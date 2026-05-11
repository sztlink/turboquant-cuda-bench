$ErrorActionPreference = 'Continue'
$out = 'C:\turbo-build\longctx-proxy-20260510'
New-Item -ItemType Directory -Force -Path $out | Out-Null
$pidFile = Join-Path $out 'llama-server.pid'
if (Test-Path $pidFile) {
  try { Stop-Process -Id ([int](Get-Content $pidFile -Raw)) -Force -ErrorAction SilentlyContinue } catch {}
}
Stop-Process -Name llama-server -Force -ErrorAction SilentlyContinue
$server = 'C:\turbo-build\llama-cpp-turboquant\build\bin\llama-server.exe'
$stdout = Join-Path $out 'llama-server.stdout.log'
$stderr = Join-Path $out 'llama-server.stderr.log'
Remove-Item $stdout,$stderr -Force -ErrorAction SilentlyContinue
$args = @('-m','C:\models\q36_27b_new.gguf','-ngl','99','-fa','1','-ctk','q8_0','-ctv','turbo4','-c','196608','--host','127.0.0.1','--port','18080','--no-warmup')
$p = Start-Process -FilePath $server -ArgumentList $args -RedirectStandardOutput $stdout -RedirectStandardError $stderr -PassThru -WindowStyle Hidden
$p.Id | Set-Content -Path $pidFile -Encoding ASCII
"LLAMA_SERVER_STARTED pid=$($p.Id)"
