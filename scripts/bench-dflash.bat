@echo off
:: DFlash speculative decoding bench — Qwen3.6-27B dense target + draft
:: Build: spiritbuun/buun-llama-cpp with -DGGML_CUDA_FA_ALL_QUANTS=ON
:: Drafter: dflash-draft-3.6-q4_k_m.gguf (985 MB)

set TARGET=C:\models\q36_27b_new.gguf
set DRAFTER=C:\models\dflash-draft-3.6-q4_k_m.gguf
set BENCH=C:\turbo-build\buun-build\bin\llama-bench.exe
set LOG=C:\turbo-build\bench_dflash_%date:~-4,4%%date:~-7,2%%date:~-10,2%.log

echo === DFlash bench: %date% %time% === > %LOG%

echo --- Baseline: 27B dense, q8_0/q8_0, no spec decoding --- >> %LOG%
%BENCH% -m %TARGET% -ngl 99 -fa 1 ^
  -ctk q8_0 -ctv q8_0 ^
  -p 512 -n 128 -d 0,4096,16384,32768 -r 3 -o md >> %LOG% 2>&1

echo --- DFlash: 27B dense target + drafter, q8_0/q8_0 --- >> %LOG%
%BENCH% -m %TARGET% -md %DRAFTER% -ngl 99 -fa 1 ^
  -ctk q8_0 -ctv q8_0 ^
  -p 512 -n 128 -d 0,4096,16384,32768 -r 3 -o md >> %LOG% 2>&1

echo --- DFlash: 27B dense target + drafter, q8_0/turbo4 --- >> %LOG%
%BENCH% -m %TARGET% -md %DRAFTER% -ngl 99 -fa 1 ^
  -ctk q8_0 -ctv turbo4 ^
  -p 512 -n 128 -d 0,4096,16384,32768 -r 3 -o md >> %LOG% 2>&1

echo.
echo Done. Log: %LOG%
