# Repo Audit — turboquant-cuda-bench — 2026-05-23

Hostile-but-fair internal audit after the N=500 machine-only RealRAG check.

## Verdict

The repo is becoming **materially inauditable** as a single public-facing research object.

Not because the work is bad — the opposite. The repo contains several real technical findings. But it now mixes too many layers:

```txt
public receipts
raw experiment dumps
runtime patch scripts
live vLLM intervention harnesses
old synthetic longctx work
RealRAG natural retrieval checks
KV/cache bridge methodology
public narrative assets
abandoned human-adjudication scaffolds
```

The result is an archive that is rich but no longer has a clear reader path.

## Current size / shape

Snapshot from working tree:

```txt
files total:              16,299
tracked files:            11,589
git status entries:       60
bench dirs:               123
repo size:                862 MB
bench size:               789 MB
local ignored datasets:   361 MB
git object dir:            53 MB
```

Largest tracked artifacts include:

```txt
42 MB  HotpotQA R2 records.jsonl
35 MB  HotpotQA R1 full records.jsonl
27 MB  HotpotQA R3A prompt variants records.jsonl
21 MB  evidence-protection span-provenance.jsonl
17 MB  runtime telemetry events.jsonl
16 MB  EPKV serving dryrun events.jsonl
```

The repo is still within manageable disk limits, but not within manageable cognitive limits.

## What is actually valuable

### 1. Public receipts / public-safe findings

These should remain visible:

```txt
bench-public/
KEY-FINDINGS.md
CANON.md
GLOSSARY.md
MANIFEST.md
```

But they need a narrower current stance after N=500.

### 2. RealRAG answer-closure archive

Valuable, but should be treated as an archive, not a live thesis engine:

```txt
HotpotQA R1/R2/R3A/R3B/R3L
2Wiki R3G/R3H/R3I/R3J/R6/R7/R8
N=500 machine-only check
```

The strongest current truth:

```txt
Evidence placement and path construction affect answer closure.
But answer-control / verifier gates did not beat direct path prompting at N=500.
```

### 3. Runtime intervention lab

Technically valuable:

```txt
07-scripts/vllm-hook/
bench/epkv-live-probe-v0-2026-05-21/
remote vLLM sampler policy patches
```

But this is a lab, not public proof.

### 4. KV/cache methodology probes

Still valuable as bridge methodology:

```txt
KVFidelity
CASK bridge
longctx decoy/resolution
```

But these should not be entangled with RealRAG claims.

## Main audit failures

### Failure 1 — One repo has at least four different products

Current repo is simultaneously:

```txt
A. public benchmark/receipt site
B. raw research archive
C. live runtime intervention lab
D. narrative/paper-ish claim surface
```

Those have different readers, retention rules, and evidence standards.

### Failure 2 — README is too large and stale

The README is trying to be:

```txt
abstract
paper
changelog
receipt index
hardware inventory
historical ledger
claim boundary
```

It still references independent/human adjudication as a broad-claim blocker, but Felipe explicitly removed human adjudication from the plan. That makes parts of the public framing stale.

### Failure 3 — `bench/` is an archive without an index

`bench/` has 123 top-level experiment directories. Many are useful, but a reader cannot know which are:

```txt
canonical
superseded
negative result
scratch
historical dependency
public-safe
internal-only
```

### Failure 4 — generated artifacts are tracked too broadly

The repo tracks thousands of JSON/log/JSONL files. Some are receipts; many are raw dumps. This makes diffs and reviews noisy.

Tracked file mix:

```txt
json:   7,772
md:     3,063
log:      255
jsonl:    158
```

A public repo can track receipts and small summaries. It should not default to tracking every run response.

### Failure 5 — claim vocabulary remains haunted

Even with caveats, phrases like these still dominate search results:

```txt
retrieved ≠ used
evidence utilization
human adjudication next gate
Evidence-Paged KV fixes/bridges retrieved ≠ used
```

After N=500, this needs tightening.

## Current canonical truth after N=500

This should become the new top-level stance:

```txt
This repo is a research archive for answer-closure, path-construction, and KV/runtime observability probes.

It shows that evidence placement, path construction, and retrieval shape answer closure.
It does not show that EPKV/sampler/verifier control improves natural RealRAG quality.
The strongest natural RealRAG baseline remains entity-hop path prompting.
The N=500 machine-only check found no quality delta for gated verifier control over direct path prompting.
```

## Recommended reorganization

### Keep repo, but split surfaces

Do **not** split git history immediately. Instead add a governance layer:

```txt
/README.md                 short entry, current truth only
/AUDIT.md or /STATE.md      current canonical status
/bench-public/             public receipts only
/research/ or /archive/     indexed raw research archive
/lab/                       active runtime harnesses
/scripts/                   maintained commands only
/attic/                     superseded scripts and generated dumps
```

Given current paths, the lowest-risk migration is:

```txt
1. Do not move old artifacts yet.
2. Add indexes and status labels.
3. Freeze new raw-output commits unless promoted.
4. Move future work into a new clean layout.
```

### Add bench manifest

Create:

```txt
bench/MANIFEST.md
```

Each bench directory gets one status:

```txt
CANONICAL
SUPPORTING
NEGATIVE
SUPERSEDED
SCRATCH
ARCHIVE_ONLY
```

Minimum columns:

```txt
path | date | family | status | public? | summary | superseded_by
```

### Add artifact retention rule

New rule:

```txt
Track markdown summaries and compact summary.json.
Do not track per-case response JSON, raw logs, or full records unless promoted.
```

For large historical artifacts, leave in place for now. Do not rewrite history unless necessary.

### Add current-state page

Create/update:

```txt
STATE.md
```

With only:

```txt
current canonical claims
current non-claims
best positive results
latest falsifications
active next step
```

This should be under 200 lines.

### Shorten README aggressively

README should become:

```txt
1. What this repo is
2. Current canonical truth
3. Three entry paths
4. Latest falsification: N=500 no delta
5. Where to find public receipts
6. Where to find raw archive
```

Everything else moves to `docs/` or `bench-public/`.

## What to stop doing

```txt
- Do not add more hand-written verifier gates.
- Do not commit more per-case response dumps by default.
- Do not expand README as a session log.
- Do not use human adjudication as a blocker if it is not actually planned.
- Do not let Boring Receipts and turboquant duplicate the same public layer.
```

## What to do next

Recommended next cleanup sprint:

```txt
1. Create STATE.md with post-N=500 truth.
2. Rewrite README to point to STATE.md + bench-public + bench/MANIFEST.md.
3. Create bench/MANIFEST.md with top 30 canonical/superseded entries first.
4. Add .gitignore rules for future raw responses/logs.
5. Move active work policy to CONTRIBUTING or docs/REPO-GOVERNANCE.md.
```

Success criterion:

```txt
A technical reader can answer in 5 minutes:
- What is the strongest current claim?
- What was falsified?
- Which artifacts are canonical?
- Which dirs are raw/superseded?
- What should I rerun?
```

## Bottom line

The repo has produced real knowledge, but the current shape rewards archaeology instead of understanding.

The next artifact should not be another experiment. It should be a **membrane**:

```txt
STATE.md + bench/MANIFEST.md + shorter README + retention policy
```

Until that exists, every new result makes the repo less auditable.
