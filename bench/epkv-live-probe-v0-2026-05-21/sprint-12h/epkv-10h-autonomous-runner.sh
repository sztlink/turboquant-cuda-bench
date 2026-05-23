#!/usr/bin/env bash
set -euo pipefail

ROOT="/home/aya/implante/research/turboquant-cuda-bench"
SPRINT="bench/epkv-live-probe-v0-2026-05-21/sprint-12h"
OUT="$SPRINT/entity-hop-soft-policy-sweep-10h"
SUMMARY="$SPRINT/entity-hop-llm-100/summary.json"
RESP="$SPRINT/entity-hop-llm-100/responses"
POLICY_REMOTE="/home/felipe/vllm-lab/evidence-paged-kv-runtime/logit-policy.json"
cd "$ROOT"

restore_policy() {
  ssh 4090 "wsl.exe -d Ubuntu-24.04 -u felipe -- bash -lc 'printf %s "{\"enabled\": false, \"tag\": \"default-off\"}" > $POLICY_REMOTE'" >/dev/null 2>&1 || true
}
trap restore_policy EXIT

mkdir -p "$OUT"
echo "EPKV_10H_RUNNER_START $(date -Is)"
echo "root=$ROOT"
echo "out=$OUT"

# Sweep small enough to complete unattended, large enough to map the failure surface.
# Axes:
# - with/without path prompt output as one candidate
# - bias strength
# - max candidate count
run_variant() {
  local name="$1"; shift
  local outdir="$OUT/$name"
  echo "--- VARIANT_START $name $(date -Is) ---"
  rm -rf "$outdir"
  python3 07-scripts/vllm-hook/epkv-entity-hop-soft-policy.py \
    --summary "$SUMMARY" \
    --responses-dir "$RESP" \
    --out-dir "$outdir" \
    --limit 100 \
    "$@"
  echo "--- VARIANT_DONE $name $(date -Is) ---"
  jq -c '{total, macro, wins_losses}' "$outdir/summary.json"
  restore_policy
  curl -sS -m 5 http://192.168.15.133:11435/health >/dev/null && echo "health_ok_after_$name"
}

for cand in 8 12 16; do
  for bias in 0.5 1.0 2.0 3.0; do
    run_variant "path-c${cand}-b${bias}" --max-candidates "$cand" --bias "$bias"
  done
done

for cand in 8 12 16; do
  for bias in 1.0 2.0 3.0; do
    run_variant "nopath-c${cand}-b${bias}" --max-candidates "$cand" --bias "$bias" --no-path-output-candidate
  done
done

python3 - <<'PY'
import json
from pathlib import Path
out = Path('bench/epkv-live-probe-v0-2026-05-21/sprint-12h/entity-hop-soft-policy-sweep-10h')
rows = []
for p in sorted(out.glob('*/summary.json')):
    s = json.loads(p.read_text())
    row = {
        'name': p.parent.name,
        'total': s.get('total'),
        'path_em': s['macro']['path_prompt']['em'],
        'path_f1': s['macro']['path_prompt']['f1'],
        'soft_em': s['macro']['soft_policy']['em'],
        'soft_f1': s['macro']['soft_policy']['f1'],
        **s.get('wins_losses', {}),
    }
    rows.append(row)
rows.sort(key=lambda r: (r['soft_em'], r['soft_f1'], -r.get('soft_losses_vs_path', 999)), reverse=True)
summary = {'schema': 'epkv.soft_policy_sweep_10h.v0', 'variants': rows, 'best': rows[0] if rows else None}
(out / 'summary.json').write_text(json.dumps(summary, indent=2, ensure_ascii=False) + '\n')
md = ['# Entity-Hop Soft Policy Sweep 10h', '', '| variant | soft EM | soft F1 | path EM | path F1 | wins vs path | losses vs path |', '|---|---:|---:|---:|---:|---:|---:|']
for r in rows:
    md.append(f"| {r['name']} | {r['soft_em']:.3f} | {r['soft_f1']:.3f} | {r['path_em']:.3f} | {r['path_f1']:.3f} | {r.get('soft_wins_vs_path', 0)} | {r.get('soft_losses_vs_path', 0)} |")
if rows:
    md += ['', '## Best', '', '```json', json.dumps(rows[0], indent=2, ensure_ascii=False), '```']
(out / 'RESULTS.md').write_text('\n'.join(md) + '\n')
print(json.dumps({'out': str(out), 'best': summary['best']}, indent=2, ensure_ascii=False))
PY

restore_policy
ssh 4090 "wsl.exe -d Ubuntu-24.04 -u felipe -- bash -lc 'cat $POLICY_REMOTE'"
curl -sS -m 5 http://192.168.15.133:11435/health >/dev/null && echo health_ok_final

echo "EPKV_10H_RUNNER_DONE $(date -Is)"
