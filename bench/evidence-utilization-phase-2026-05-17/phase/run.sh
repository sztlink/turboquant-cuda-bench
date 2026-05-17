#!/usr/bin/env bash
set -u
export OUT=/home/aya/implante/tmp/longctx-evidence-zone-phase-2026-05-16
LOG="$OUT/job.log"
TUNNEL_PID=""
: > "$LOG"
log(){ echo "[$(date -Iseconds)] $*" | tee -a "$LOG"; }
cleanup(){ [[ -n "${TUNNEL_PID:-}" ]] && kill "$TUNNEL_PID" 2>/dev/null || true; }
trap cleanup EXIT
log "EVIDENCE_ZONE_START"
log "starting ssh tunnel localhost:11436 -> 4090:11435"
ssh -N -L 11436:127.0.0.1:11435 4090 >> "$OUT/ssh-tunnel.log" 2>&1 &
TUNNEL_PID=$!
export BASE_URL=${BASE_URL:-http://127.0.0.1:11436/v1}
for i in $(seq 1 60); do
  if curl -fsS --max-time 3 http://127.0.0.1:11436/health >> "$OUT/health.log" 2>&1; then
    log "upstream_ready after=${i}s"
    break
  fi
  sleep 1
  if [[ "$i" == "60" ]]; then
    log "EVIDENCE_ZONE_FATAL upstream_not_ready"
    echo EVIDENCE_ZONE_FATAL > "$OUT/FAILED.txt"
    exit 1
  fi
done
log "base_url=$BASE_URL max_runs=${MAX_RUNS:-360} repeats=${REPEATS:-3} budget_min=${TIME_BUDGET_MIN:-470}"
node "$OUT/run-phase.mjs" >> "$LOG" 2>&1
status=$?
if [[ $status -eq 0 && -f "$OUT/DONE.txt" ]]; then
  log "EVIDENCE_ZONE_DONE"
else
  log "EVIDENCE_ZONE_FATAL status=$status"
  echo EVIDENCE_ZONE_FATAL > "$OUT/FAILED.txt"
fi
exit $status
