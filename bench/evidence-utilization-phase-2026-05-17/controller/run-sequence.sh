#!/usr/bin/env bash
set -u
ROOT=/home/aya/implante
SEQ=overnight-evidence-utilization-2026-05-17
OUT="$ROOT/tmp/$SEQ"
DEPTH="$ROOT/tmp/longctx-evidence-zone-depth-2026-05-17"
LOG="$OUT/sequence.log"
: > "$LOG"
log(){ echo "[$(date -Iseconds)] $*" | tee -a "$LOG"; }
fail(){ log "OVERNIGHT_SEQUENCE_FAIL $*"; echo OVERNIGHT_SEQUENCE_FAIL > "$OUT/FAILED.txt"; exit 1; }
check_gpu_temp(){
  local temp
  temp=$(ssh 4090 'nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader,nounits' 2>/dev/null | tr -d '\r' | head -n1 || echo 0)
  temp=${temp:-0}
  log "gpu_temp=${temp}C"
  if [[ "$temp" =~ ^[0-9]+$ && "$temp" -ge 82 ]]; then
    fail "gpu_temp_too_high_${temp}C"
  fi
}
check_errors_under_5pct(){
  local agg="$1"
  node - "$agg" <<'NODE'
const fs=require('fs'); const p=process.argv[2];
const a=JSON.parse(fs.readFileSync(p,'utf8'));
const rate=(a.errors||0)/(a.runs||1);
console.log(JSON.stringify({runs:a.runs,errors:a.errors,error_rate:rate,hits:a.hits}));
if(rate>0.05) process.exit(2);
NODE
}
wait_depth(){
  log "WAIT_DEPTH_START path=$DEPTH"
  while true; do
    if [[ -f "$DEPTH/FAILED.txt" ]]; then fail "depth_failed"; fi
    if [[ -f "$DEPTH/DONE.txt" && -f "$DEPTH/aggregate.json" ]]; then
      log "WAIT_DEPTH_DONE"
      check_errors_under_5pct "$DEPTH/aggregate.json" | tee -a "$LOG" || fail "depth_error_rate_gt_5pct"
      return 0
    fi
    if [[ -f "$DEPTH/progress.json" ]]; then tr '\n' ' ' < "$DEPTH/progress.json" | sed 's/^/[depth_progress] /' | tee -a "$LOG"; echo >> "$LOG"; fi
    check_gpu_temp
    sleep 300
  done
}
run_job(){
  local name="$1" script="$2" port="$3" repeats="$4" budget="$5"
  local jobout="$OUT/$name"
  mkdir -p "$jobout"
  rm -f "$jobout/DONE.txt" "$jobout/FAILED.txt" "$jobout/summary.jsonl" "$jobout/aggregate.json" "$jobout/RESULTS.md"
  local tunnel_pid=""
  log "${name}_START port=$port repeats=$repeats budget=$budget"
  check_gpu_temp
  ssh -N -L "${port}:127.0.0.1:11435" 4090 >> "$jobout/ssh-tunnel.log" 2>&1 &
  tunnel_pid=$!
  for i in $(seq 1 60); do
    if curl -fsS --max-time 3 "http://127.0.0.1:${port}/health" >> "$jobout/health.log" 2>&1; then
      log "${name}_upstream_ready after=${i}s"
      break
    fi
    sleep 1
    [[ "$i" == "60" ]] && { kill "$tunnel_pid" 2>/dev/null || true; fail "${name}_upstream_not_ready"; }
  done
  OUT="$jobout" BASE_URL="http://127.0.0.1:${port}/v1" REPEATS="$repeats" TIME_BUDGET_MIN="$budget" node "/home/aya/implante/tmp/overnight-evidence-utilization-2026-05-17/$script" >> "$jobout/job.log" 2>&1
  local status=$?
  kill "$tunnel_pid" 2>/dev/null || true
  if [[ $status -ne 0 ]]; then fail "${name}_node_status_$status"; fi
  if [[ ! -f "$jobout/DONE.txt" || ! -f "$jobout/aggregate.json" ]]; then fail "${name}_missing_done_or_aggregate"; fi
  check_errors_under_5pct "$jobout/aggregate.json" | tee -a "$LOG" || fail "${name}_error_rate_gt_5pct"
  log "${name}_DONE"
  check_gpu_temp
}
log "OVERNIGHT_SEQUENCE_START confirmed=CONFIRMAR_INFRA"
log "policy=no_posting no_credentials no_service_restart use_current_llama_server_via_tunnel"
wait_depth
run_job "prompt-scaffold-sweep" "prompt-scaffold-sweep.mjs" 11438 12 150
run_job "distractor-taxonomy-sweep" "distractor-taxonomy-sweep.mjs" 11439 12 150
log "OVERNIGHT_SEQUENCE_DONE"
echo OVERNIGHT_SEQUENCE_DONE > "$OUT/DONE.txt"
