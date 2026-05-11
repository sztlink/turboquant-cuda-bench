#!/usr/bin/env bash
set -u
OUT="/home/aya/implante/research/turboquant-cuda-bench/bench/consumer-context-2026-05-09"
RAW="$OUT/raw"
LOG="$OUT/runner.log"
SUMMARY="$OUT/summary.jsonl"
mkdir -p "$RAW"
: > "$LOG"
: > "$SUMMARY"
BENCH='C:\turbo-build\llama-cpp-turboquant\build\bin\llama-bench.exe'
REMOTE_BENCH_SHA=$(ssh 4090 'powershell.exe -NoProfile -Command "(Get-FileHash C:\\turbo-build\\llama-cpp-turboquant\\build\\bin\\llama-bench.exe -Algorithm SHA256).Hash"' | tr -d '\r')
REMOTE_COMMIT=$(ssh 4090 'powershell.exe -NoProfile -Command "Set-Location C:\\turbo-build\\llama-cpp-turboquant; git rev-parse --short HEAD"' | tr -d '\r')
GPU0=$(ssh 4090 'powershell.exe -NoProfile -Command "nvidia-smi --query-gpu=name,driver_version,utilization.gpu,memory.used,memory.total,temperature.gpu --format=csv,noheader"' | tr -d '\r')
{
  echo "CONTEXT_BENCH_START $(date -Iseconds)"
  echo "bench=$BENCH"
  echo "bench_sha256=$REMOTE_BENCH_SHA"
  echo "repo_commit=$REMOTE_COMMIT"
  echo "gpu=$GPU0"
} | tee -a "$LOG"
run_cell() {
  local idx="$1" model_key="$2" model="$3" depth="$4" label="$5" ctk="$6" ctv="$7"
  local slug
  slug=$(printf '%02d-%s-%s-ctk_%s-ctv_%s' "$idx" "$model_key" "$label" "$ctk" "$ctv" | tr -c 'A-Za-z0-9_.-' '_')
  local json="$RAW/$slug.json"
  local err="$RAW/$slug.stderr.log"
  local cmd="${BENCH} -m ${model} -ngl 99 -fa 1 -ctk ${ctk} -ctv ${ctv} -p 512 -n 64 -d ${depth} -r 1 -o json --no-warmup"
  echo "CELL_START $(date -Iseconds) idx=$idx model=$model_key depth=$depth label=$label ctk=$ctk ctv=$ctv" | tee -a "$LOG"
  echo "CMD $cmd" >> "$LOG"
  local start end elapsed code
  start=$(date +%s)
  timeout 900 ssh 4090 "cmd.exe /c \"$cmd\"" > "$json" 2> "$err"
  code=$?
  end=$(date +%s)
  elapsed=$((end-start))
  local gpu_after
  gpu_after=$(ssh 4090 'powershell.exe -NoProfile -Command "nvidia-smi --query-gpu=utilization.gpu,memory.used,memory.total,temperature.gpu --format=csv,noheader"' | tr -d '\r')
  local status="ok"
  if [[ "$code" != "0" ]]; then status="failed"; fi
  local stdout_bytes stderr_tail
  stdout_bytes=$(wc -c < "$json" | tr -d ' ')
  stderr_tail=$(tail -40 "$err" | sed ':a;N;$!ba;s/\\/\\\\/g;s/"/\\"/g;s/\r//g;s/\n/\\n/g')
  printf '{"idx":%s,"status":"%s","exit_code":%s,"elapsed_sec":%s,"model_key":"%s","model":"%s","depth":%s,"label":"%s","ctk":"%s","ctv":"%s","stdout":"%s","stderr":"%s","stdout_bytes":%s,"gpu_after":"%s","stderr_tail":"%s"}\n' \
    "$idx" "$status" "$code" "$elapsed" "$model_key" "$model" "$depth" "$label" "$ctk" "$ctv" "$json" "$err" "$stdout_bytes" "$gpu_after" "$stderr_tail" >> "$SUMMARY"
  echo "CELL_EXIT $(date -Iseconds) idx=$idx status=$status exit=$code elapsed_sec=$elapsed stdout_bytes=$stdout_bytes gpu_after=$gpu_after" | tee -a "$LOG"
  if [[ "$status" != "ok" ]]; then echo "CELL_FAILED idx=$idx" >> "$LOG"; tail -40 "$err" >> "$LOG"; fi
}
idx=0
# Dense 27B capacity matrix
for depth_label in "65536 64K" "131072 128K" "245760 240K"; do
  set -- $depth_label; depth=$1; label=$2
  idx=$((idx+1)); run_cell "$idx" qwen36_27b_dense 'C:\models\q36_27b_new.gguf' "$depth" "$label" q8_0 q8_0
  idx=$((idx+1)); run_cell "$idx" qwen36_27b_dense 'C:\models\q36_27b_new.gguf' "$depth" "$label" q8_0 turbo4
  idx=$((idx+1)); run_cell "$idx" qwen36_27b_dense 'C:\models\q36_27b_new.gguf' "$depth" "$label" turbo4 turbo4
done
# Hybrid 35B high context sanity
for depth_label in "131072 128K" "245760 240K"; do
  set -- $depth_label; depth=$1; label=$2
  idx=$((idx+1)); run_cell "$idx" qwen36_35b_a3b 'C:\models\q36_35b.gguf' "$depth" "$label" q8_0 q8_0
  idx=$((idx+1)); run_cell "$idx" qwen36_35b_a3b 'C:\models\q36_35b.gguf' "$depth" "$label" q8_0 turbo4
done
echo "CONTEXT_BENCH_DONE $(date -Iseconds)" | tee -a "$LOG"
