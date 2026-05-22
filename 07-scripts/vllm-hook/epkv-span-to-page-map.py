#!/usr/bin/env python3
"""Map evidence text spans to token indices and KV pages.

This is the missing live-probe bridge:

    prompt evidence spans -> tokenizer offsets -> token positions -> KV pages

It intentionally operates on the actual chat-template string produced by the
model tokenizer, so the page mask can be fed to ``VLLM_EPKV_EVIDENCE_PAGES``.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from transformers import AutoTokenizer


def ranges_to_spec(pages: list[int]) -> str:
    if not pages:
        return ''
    pages = sorted(set(int(p) for p in pages))
    ranges = []
    start = prev = pages[0]
    for p in pages[1:]:
        if p == prev + 1:
            prev = p
            continue
        ranges.append(f'{start}' if start == prev else f'{start}-{prev}')
        start = prev = p
    ranges.append(f'{start}' if start == prev else f'{start}-{prev}')
    return ','.join(ranges)


def token_indices_for_span(offsets, start: int, end: int) -> list[int]:
    out = []
    for i, (a, b) in enumerate(offsets):
        if a is None or b is None:
            continue
        # Special tokens sometimes have zero offsets.
        if int(a) == int(b):
            continue
        if int(b) > start and int(a) < end:
            out.append(i)
    return out


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument('--model', default='Qwen/Qwen2.5-7B-Instruct')
    p.add_argument('--block-size', type=int, default=16)
    p.add_argument('--out', required=True)
    p.add_argument('--case-json', default='', help='JSON file with question, evidence[], distractor[], optional answer/qid')
    p.add_argument('--question', default='Which key opens the north door? Answer with only the key color.')
    p.add_argument('--evidence', action='append', default=None)
    p.add_argument('--distractor', action='append', default=None)
    args = p.parse_args()

    case = {}
    if args.case_json:
        case = json.loads(Path(args.case_json).read_text(encoding='utf-8'))
    question = case.get('question') or args.question
    evidence = case.get('evidence') or args.evidence or [
        'The red key opens the north door.',
        'The blue key opens the south door.',
    ]
    distractor = case.get('distractor') or args.distractor or [
        'The green key is stored in the attic.',
        'The yellow key is decorative and opens nothing.',
    ]

    tok = AutoTokenizer.from_pretrained(args.model, trust_remote_code=True)
    evidence_lines = [f'E{i+1}: {text}' for i, text in enumerate(evidence)]
    distractor_lines = [f'D{i+1}: {text}' for i, text in enumerate(distractor)]
    instruction = case.get('instruction') or 'Use only the evidence lines to answer.'
    if isinstance(instruction, str):
        instruction_lines = [instruction]
    else:
        instruction_lines = [str(x) for x in instruction]
    layout = case.get('layout') or 'evidence_first'
    if layout == 'distractors_first':
        body = [
            *instruction_lines,
            'Distractors:',
            *distractor_lines,
            'Evidence:',
            *evidence_lines,
            f'Question: {question}',
        ]
    else:
        body = [
            *instruction_lines,
            'Evidence:',
            *evidence_lines,
            'Distractors:',
            *distractor_lines,
            f'Question: {question}',
        ]
    user = '\n'.join(body)
    messages = [{'role': 'user', 'content': user}]
    chat = tok.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    encoded = tok(chat, return_offsets_mapping=True, add_special_tokens=False)
    offsets = encoded['offset_mapping']
    input_ids = encoded['input_ids']

    spans = []
    all_token_indices = []
    all_pages = []
    for label, text in [(f'E{i+1}', e) for i, e in enumerate(evidence)]:
        needle = f'{label}: {text}'
        start = chat.find(needle)
        if start < 0:
            raise SystemExit(f'could not find evidence text in chat template: {needle!r}')
        end = start + len(needle)
        token_indices = token_indices_for_span(offsets, start, end)
        pages = sorted(set(i // args.block_size for i in token_indices))
        token_start = min(token_indices) if token_indices else None
        token_end_exclusive = (max(token_indices) + 1) if token_indices else None
        token_range_spec = '' if token_start is None or token_end_exclusive is None else f'{token_start}-{token_end_exclusive - 1}'
        spans.append({
            'label': label,
            'text': text,
            'char_start': start,
            'char_end': end,
            'token_start': token_start,
            'token_end_exclusive': token_end_exclusive,
            'token_range_spec': token_range_spec,
            'token_count': len(token_indices),
            'pages': pages,
            'pages_spec': ranges_to_spec(pages),
        })
        all_token_indices.extend(token_indices)
        all_pages.extend(pages)

    result = {
        'schema': 'epkv.span_to_page_map.v0',
        'model': args.model,
        'block_size': args.block_size,
        'token_count_total': len(input_ids),
        'evidence_token_count': len(set(all_token_indices)),
        'evidence_pages': sorted(set(all_pages)),
        'evidence_pages_spec': ranges_to_spec(all_pages),
        'terminal_evidence_pages': spans[-1]['pages'] if spans else [],
        'terminal_evidence_pages_spec': spans[-1]['pages_spec'] if spans else '',
        'terminal_evidence_token_range_spec': spans[-1]['token_range_spec'] if spans else '',
        'all_evidence_token_range_spec': ranges_to_spec(sorted(set(all_token_indices))),
        'qid': case.get('qid'),
        'gold_answer': case.get('answer'),
        'layout': layout,
        'instruction': instruction_lines,
        'spans': spans,
        'messages': messages,
        'chat_template_text': chat,
    }
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(result, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(json.dumps({k: result[k] for k in ['schema', 'token_count_total', 'evidence_token_count', 'evidence_pages', 'evidence_pages_spec']}, indent=2))


if __name__ == '__main__':
    main()
