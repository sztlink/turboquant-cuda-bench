@echo off
:: Rebuild TheTom HEAD build-head (clears SAC trust via new binary hash)
:: Run from Developer Command Prompt or after vcvarsall

set TEMP=C:\turbo-build\tmp
set TMP=C:\turbo-build\tmp

if not exist %TEMP% mkdir %TEMP%

call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvarsall.bat" x64

cd C:\turbo-build\llama-cpp-turboquant
git fetch origin
git checkout origin/feature/turboquant-kv-cache

cmake -B build-head2 -S . -G "NMake Makefiles" ^
  -DGGML_CUDA=ON ^
  -DCMAKE_CUDA_ARCHITECTURES=89 ^
  -DCMAKE_BUILD_TYPE=Release

cmake --build build-head2 --config Release -j 8

echo.
echo Build complete: build-head2\bin\llama-server.exe
echo New hash clears SAC trust. Run llama-server from build-head2.
