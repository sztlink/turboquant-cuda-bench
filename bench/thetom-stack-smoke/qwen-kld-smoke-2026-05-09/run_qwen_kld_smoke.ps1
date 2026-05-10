$ErrorActionPreference = 'Continue'
$outDir = 'C:\turbo-build\qwen-kld-smoke-20260509'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$log = Join-Path $outDir 'qwen-kld-smoke-task.log'
$env:PYTHONPATH = 'C:\turbo-build\turboquant_plus'
$env:LLAMA_CPP_BIN_DIR = 'C:\turbo-build\llama-cpp-turboquant\build\bin'
$env:PYTHONIOENCODING = 'utf-8'
"JOB_START $(Get-Date -Format o)" | Tee-Object -FilePath $log
"PYTHONPATH=$env:PYTHONPATH" | Tee-Object -FilePath $log -Append
"LLAMA_CPP_BIN_DIR=$env:LLAMA_CPP_BIN_DIR" | Tee-Object -FilePath $log -Append
"PYTHONIOENCODING=$env:PYTHONIOENCODING" | Tee-Object -FilePath $log -Append
python (Join-Path $outDir 'run_qwen_kld_smoke.py') 2>&1 | Tee-Object -FilePath $log -Append
$code = $LASTEXITCODE
"JOB_EXIT $code $(Get-Date -Format o)" | Tee-Object -FilePath $log -Append
if ($code -eq 0) {
  "QWEN_KLD_SMOKE_DONE" | Tee-Object -FilePath $log -Append
} else {
  "QWEN_KLD_SMOKE_FATAL" | Tee-Object -FilePath $log -Append
}
exit $code
