#!/usr/bin/env bash
set -u
export OUT=/home/aya/implante/tmp/longctx-evidence-zone-depth-2026-05-17
LOG="$OUT/job.log"; : > "$LOG"; TUNNEL_PID=""
log(){ echo "[$(date -Iseconds)] $*" | tee -a "$LOG"; }
cleanup(){ [[ -n "${TUNNEL_PID:-}" ]] && kill "$TUNNEL_PID" 2>/dev/null || true; }
trap cleanup EXIT
log "EVIDENCE_DEPTH_START"
ssh -N -L 11437:127.0.0.1:11435 4090 >> "$OUT/ssh-tunnel.log" 2>&1 & TUNNEL_PID=$!
export BASE_URL=${BASE_URL:-http://127.0.0.1:11437/v1}
for i in $(seq 1 60); do curl -fsS --max-time 3 http://127.0.0.1:11437/health >> "$OUT/health.log" 2>&1 && { log "upstream_ready after=${i}s"; break; }; sleep 1; [[ "$i" == "60" ]] && { log "EVIDENCE_DEPTH_FATAL upstream_not_ready"; echo EVIDENCE_DEPTH_FATAL > "$OUT/FAILED.txt"; exit 1; }; done
log "base_url=$BASE_URL repeats=${REPEATS:-16} budget_min=${TIME_BUDGET_MIN:-470}"
node "$OUT/run-depth.mjs" >> "$LOG" 2>&1
s=$?; if [[ $s -eq 0 && -f "$OUT/DONE.txt" ]]; then log "EVIDENCE_DEPTH_DONE"; else log "EVIDENCE_DEPTH_FATAL status=$s"; echo EVIDENCE_DEPTH_FATAL > "$OUT/FAILED.txt"; fi; exit $s
