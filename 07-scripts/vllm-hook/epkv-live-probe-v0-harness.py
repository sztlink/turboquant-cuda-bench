#!/usr/bin/env python3
"""Evidence-KV Live Probe v0 harness.

This is deliberately not a paper artifact. It is a small executable knife for the
runtime idea now added to ``evidence_paged_kv.runtime_hook``:

- map evidence pages into a page mask;
- optionally boost evidence-page scores before top-k selection;
- report selected-position evidence hit/miss geometry.

On CUDA it runs the same Triton score-boost kernel shape used by the runtime hook.
On CPU it uses a torch fallback so CI/syntax smoke still works without touching
serving infrastructure.
"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path

import torch

try:
    import triton
    import triton.language as tl
except Exception:  # pragma: no cover
    triton = None
    tl = None


if triton is not None:
    @triton.jit
    def _boost_scores_kernel(scores, evidence_page_mask, Hq: tl.constexpr, BLOCK_SIZE: tl.constexpr, BOOST: tl.constexpr):
        row = tl.program_id(0)
        hq = tl.program_id(1)
        page_idx = row // BLOCK_SIZE
        is_evidence = tl.load(evidence_page_mask + page_idx).to(tl.int32)
        score = tl.load(scores + row * Hq + hq)
        tl.store(scores + row * Hq + hq, score + tl.where(is_evidence == 1, BOOST, 0.0))


def parse_pages(spec: str, num_pages: int) -> list[int]:
    pages: set[int] = set()
    for part in spec.split(','):
        part = part.strip()
        if not part:
            continue
        if '-' in part:
            a, b = part.split('-', 1)
            lo, hi = sorted((int(a), int(b)))
            for p in range(lo, hi + 1):
                if 0 <= p < num_pages:
                    pages.add(p)
        else:
            p = int(part)
            if 0 <= p < num_pages:
                pages.add(p)
    return sorted(pages)


def summarize(pos: torch.Tensor, evidence_mask: torch.Tensor, block_size: int) -> dict:
    pages = (pos // block_size).to(torch.long).cpu()
    mask = evidence_mask.cpu().to(torch.int32)
    hit = 0
    per_head = []
    for h in range(pages.shape[1]):
        head_pages = pages[:, h].tolist()
        head_hit = sum(1 for p in head_pages if 0 <= int(p) < len(mask) and int(mask[int(p)].item()) == 1)
        hit += head_hit
        per_head.append({'head': h, 'selected': len(head_pages), 'evidence_hits': head_hit})
    total = int(pos.numel())
    return {
        'selected_total': total,
        'evidence_hits': hit,
        'evidence_misses': total - hit,
        'evidence_hit_rate': hit / total if total else 0.0,
        'evidence_pages': [i for i, v in enumerate(mask.tolist()) if int(v) == 1],
        'per_head': per_head,
    }


def run(args: argparse.Namespace) -> dict:
    torch.manual_seed(args.seed)
    device = torch.device('cuda' if args.cuda and torch.cuda.is_available() else 'cpu')
    scores = torch.randn((args.seq_len, args.heads), device=device, dtype=torch.float32)
    # Make late non-evidence rows slightly attractive to make the intervention visible.
    ramp = torch.linspace(0, args.ramp, args.seq_len, device=device).unsqueeze(1)
    scores = scores + ramp
    num_pages = (args.seq_len + args.block_size - 1) // args.block_size
    evidence_pages = parse_pages(args.evidence_pages, num_pages)
    evidence_mask = torch.zeros((num_pages,), device=device, dtype=torch.int32)
    if evidence_pages:
        evidence_mask[torch.tensor(evidence_pages, device=device, dtype=torch.long)] = 1

    base_vals, base_pos = torch.topk(scores, min(args.k, args.seq_len), dim=0)
    base = summarize(base_pos, evidence_mask, args.block_size)

    boosted_scores = scores.clone()
    used_kernel = False
    if args.boost != 0:
        if device.type == 'cuda' and triton is not None:
            _boost_scores_kernel[(args.seq_len, args.heads)](
                boosted_scores,
                evidence_mask,
                Hq=args.heads,
                BLOCK_SIZE=args.block_size,
                BOOST=float(args.boost),
                num_warps=4,
                num_stages=1,
            )
            torch.cuda.synchronize(device)
            used_kernel = True
        else:
            row_pages = torch.arange(args.seq_len, device=device) // args.block_size
            boosted_scores += (evidence_mask[row_pages].to(torch.float32) * float(args.boost)).unsqueeze(1)
    boost_vals, boost_pos = torch.topk(boosted_scores, min(args.k, args.seq_len), dim=0)
    boosted = summarize(boost_pos, evidence_mask, args.block_size)
    return {
        'schema': 'epkv.live_probe.v0.harness',
        'device': str(device),
        'used_triton_kernel': used_kernel,
        'seq_len': args.seq_len,
        'heads': args.heads,
        'k': args.k,
        'block_size': args.block_size,
        'num_pages': num_pages,
        'evidence_pages_spec': args.evidence_pages,
        'boost': args.boost,
        'baseline': base,
        'boosted': boosted,
        'delta_hit_rate': boosted['evidence_hit_rate'] - base['evidence_hit_rate'],
        'sample_positions': {
            'baseline_first_head': base_pos[:, 0].detach().cpu().tolist()[: min(args.k, 16)],
            'boosted_first_head': boost_pos[:, 0].detach().cpu().tolist()[: min(args.k, 16)],
        },
    }


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument('--seq-len', type=int, default=512)
    p.add_argument('--heads', type=int, default=8)
    p.add_argument('--k', type=int, default=32)
    p.add_argument('--block-size', type=int, default=16)
    p.add_argument('--evidence-pages', default='2,5-6')
    p.add_argument('--boost', type=float, default=4.0)
    p.add_argument('--ramp', type=float, default=1.5)
    p.add_argument('--seed', type=int, default=20260521)
    p.add_argument('--cuda', action='store_true')
    p.add_argument('--out', default='')
    args = p.parse_args()
    result = run(args)
    text = json.dumps(result, indent=2, sort_keys=True)
    print(text)
    if args.out:
        out = Path(args.out)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(text + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
