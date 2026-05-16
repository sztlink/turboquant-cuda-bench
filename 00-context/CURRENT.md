# CASK / KVFidelity — Current Brief for Next Session

**Date:** 2026-05-16  
**Purpose:** single entry point for future Pi/Claude sessions without memory confusion.

## Canonical memory

The canonical project memory is:

```txt
/home/aya/implante/memory-md/AYA1/core/project/cask-kvfidelity-4090-smoke-breakthrough-2026-05-13.md
```

Current consolidated memory commit:

```txt
1fb2fbe — memory: close Claude CASK session and lab note v2
```

Use this file as source of truth. Do not create a competing CASK/KVFidelity memory unless explicitly asked.

## Closed / superseded sessions

### `claude-cask-kvfidelity`

Status: closed.

Final useful ensemble messages:

```txt
msg_7f08bedb54d74c64 — adversarial review of lab note
msg_0a8531c806974828 — final note / session closure
```

Rules after closure:

```txt
- Claude session should not edit memory-md.
- Claude session should not run GPU or infra.
- Claude session should not commit.
- Pi is canonical scribe for this project state.
```

Old pending pi-ensemble messages were marked done/superseded.

## Longctx / retrieval-utilization update — 2026-05-16

Expanded synthetic staging package promoted:

```txt
bench/longctx-utilization-expanded-2026-05-16/RESULTS.md
```

Result:

```txt
n=24 synthetic
retrieval: 19/24
baseline_proxy closure: 9/24
anti_decoy_proxy closure: 9/24
filtered_splice closure: 19/24
errors: 0
```

Interpretation:

```txt
When canonical evidence was retrieved, filtered splice closed 19/19.
Prompting alone did not improve baseline closure.
The gap remains retrieval-utilization, not merely retrieval.
```

Structural infra correction:

```txt
4090 production binary: C:\turbo-build\buun\build-may1\bin\llama-server.exe
preflight: C:\ops\llama-server-preflight.ps1
rule: validate benchmark binary before disabling LlamaServer-AutoStart
```

Rerank status:

```txt
Do not mix rerank into main benchmark yet. Rerank path hung longctx-svc in smoke; isolate as separate structural repro.
```

## Runtime facts

Working execution path:

```bash
nohup ssh -o ServerAliveInterval=60 -o ServerAliveCountMax=180 4090 \
  'wsl.exe -d Ubuntu-24.04 -u felipe -- bash /home/felipe/CASK/script.sh' \
  > /home/aya/implante/tmp/<job>.log 2>&1 < /dev/null &
```

Do **not** use:

```txt
systemd-service-inside-WSL standalone
```

4090 service restoration after CASK jobs remains mandatory:

```txt
LlamaServer-AutoStart enabled/run
llama-server.exe on port 11435
```

## Empirical state

AIME24 n=30, Qwen3-8B:

```txt
FullKV 2048:       acc 6.7  | correct idx 7, 9
TriAttention 2048: acc 0.0  | none
CASK 2048:         acc 3.3  | idx 7

FullKV 4096:       acc 13.3 | correct idx 0, 11, 24, 26
TriAttention 4096: acc 3.3  | idx 7
CASK 4096:         acc 3.3  | idx 7

Tri/CASK b384 4096: 0.0
Tri/CASK b512 4096: 3.3, idx 7
```

Core interpretation:

```txt
Do not claim CASK wins.
Do not claim CASK loses globally.
Current value is KVFidelity as diagnostic lens.
```

## Current artifacts

Lab note v2, Claude review incorporated:

```txt
/home/aya/implante/tmp/kvfidelity-trace-atlas-lab-note-v2-2026-05-15.md
```

Casey Atlas v4:

```txt
/home/aya/implante/tmp/kvfidelity-casey-v4-2026-05-14/
├── kvfidelity_casey_atlas_v4.pptx
├── pdf/kvfidelity_casey_atlas_v4.pdf
└── contact_sheet.png
```

Trace source:

```txt
/home/aya/implante/tmp/kvfidelity-aime24-n30-traces-2026-05-13.jsonl
```

## Caveats that must travel with any external note

1. n=30 AIME24 only.
2. Single model: Qwen3-8B.
3. Single order / single run, no repeat stability yet.
4. Discovery/Retention labels are regex/extractor-derived, not human-validated.
5. AIME numeric answers can create incidental matches.
6. TriAttention used packaged stats fallback `for_aime25_experiment/qwen3_8b.pt`; this may be suboptimal for AIME24.
7. Compressed budgets tested only 256/384/512.
8. Low absolute scores amplify relative noise.

## Next steps

Recommended next action is **not GPU**.

1. Manually audit labels for:

```txt
idx 0, 7, 9, 11, 12, 24, 26
```

2. Decide destination:

```txt
internal lab note / upstream issue-comment / public article
```

3. If public/upstream, use lab note v2 + Casey Atlas v4, but simplify to 3 figures:

```txt
01_topology_matrix
02_answer_lifecycle_strips
case_strip_idx_09 or 08_label_birth_idx09_fullkv_4096
```

4. Only after manual audit consider a repeat-stability subset.

## One-line thesis

A correct answer is not a score. It is a temporal event: it emerges, persists, drifts, closes, or disappears.
