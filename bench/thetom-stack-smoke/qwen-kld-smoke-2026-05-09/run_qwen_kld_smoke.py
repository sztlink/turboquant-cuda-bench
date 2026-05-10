import hashlib
import json
import math
import os
import subprocess
import sys
import time
import traceback
from pathlib import Path

# REFRACT / llama.cpp environment is also set by the launcher, but keep this
# self-contained for direct reruns.
os.environ.setdefault("PYTHONPATH", r"C:\turbo-build\turboquant_plus")
os.environ.setdefault("LLAMA_CPP_BIN_DIR", r"C:\turbo-build\llama-cpp-turboquant\build\bin")
os.environ.setdefault("PYTHONIOENCODING", "utf-8")

sys.path.insert(0, r"C:\turbo-build\turboquant_plus")

from refract.runner import KVConfig, run_perplexity_kld_base, run_perplexity_kld, corpus_identity  # noqa: E402

OUT_DIR = Path(r"C:\turbo-build\qwen-kld-smoke-20260509")
MODEL = Path(r"C:\models\q36_35b.gguf")
CORPUS = Path(r"C:\Users\Aya Render 1\.cache\refract\wikitext-2-raw\wiki.test.raw")
BIN_DIR = Path(os.environ["LLAMA_CPP_BIN_DIR"])
PERPLEXITY = BIN_DIR / "llama-perplexity.exe"
REPO = Path(r"C:\turbo-build\llama-cpp-turboquant")
CTX = 14336
CHUNKS = 1
N_GPU_LAYERS = 99
REFERENCE = "ctk=q8_0,ctv=q8_0"
CANDIDATES = [
    "ctk=q8_0,ctv=q8_0",
    "ctk=q8_0,ctv=turbo4",
]
BASE_PATH = OUT_DIR / "qwen35b-q8q8-ctx14336-chunks1.kldbase.bin"
SUMMARY_PATH = OUT_DIR / "summary.json"


def now():
    return time.strftime("%Y-%m-%dT%H:%M:%S%z")


def sha256(path: Path):
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest().upper()


def run_text(args, cwd=None, timeout=30):
    try:
        p = subprocess.run(args, cwd=cwd, text=True, encoding="utf-8", errors="replace", stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=timeout)
        return {"returncode": p.returncode, "text": p.stdout.strip()}
    except Exception as e:
        return {"error": repr(e)}


def kld_score(mean_kld):
    if mean_kld is None:
        return None
    return 100.0 * math.exp(-max(0.0, float(mean_kld)))


def save(summary):
    SUMMARY_PATH.write_text(json.dumps(summary, indent=2), encoding="utf-8")


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"QWEN_KLD_SMOKE_START {now()}", flush=True)
    print(f"model={MODEL}", flush=True)
    print(f"ctx={CTX} chunks={CHUNKS} reference={REFERENCE}", flush=True)

    summary = {
        "schema": "sztlink.qwen_kld_smoke.v1",
        "started_at": now(),
        "status": "running",
        "goal": "Exercise REFRACT/llama-perplexity KLD on a Qwen-class large-vocab model above the int32 overflow threshold.",
        "host": run_text(["hostname"]),
        "gpu": run_text(["nvidia-smi", "--query-gpu=name,driver_version,temperature.gpu,utilization.gpu,memory.used,memory.total", "--format=csv,noheader"], timeout=20),
        "repo": {
            "path": str(REPO),
            "commit": run_text(["git", "rev-parse", "--short", "HEAD"], cwd=str(REPO)),
            "status_short": run_text(["git", "status", "--short"], cwd=str(REPO)),
        },
        "paths": {
            "model": str(MODEL),
            "corpus": str(CORPUS),
            "bin_dir": str(BIN_DIR),
            "llama_perplexity": str(PERPLEXITY),
            "base_path": str(BASE_PATH),
        },
        "binary": {
            "llama_perplexity_sha256": sha256(PERPLEXITY) if PERPLEXITY.exists() else None,
        },
        "params": {
            "ctx": CTX,
            "chunks": CHUNKS,
            "n_gpu_layers": N_GPU_LAYERS,
            "reference": REFERENCE,
            "candidates": CANDIDATES,
        },
        "overflow_threshold_note": {
            "vocab_observed_from_model_log": 248320,
            "nv_for_qwen35moe_vocab_248320": 2 * ((248320 + 1) // 2) + 4,
            "ctx_times_nv": CTX * (2 * ((248320 + 1) // 2) + 4),
            "int32_max": 2147483647,
            "threshold_exceeded": CTX * (2 * ((248320 + 1) // 2) + 4) > 2147483647,
        },
        "corpus_identity": corpus_identity(CORPUS),
        "base": {},
        "results": [],
    }
    save(summary)

    reference_kv = KVConfig.parse(REFERENCE)
    try:
        if BASE_PATH.exists():
            BASE_PATH.unlink()
        print(f"BASE_START {now()} {REFERENCE}", flush=True)
        t0 = time.time()
        base_result = run_perplexity_kld_base(
            model=MODEL,
            corpus=CORPUS,
            kv=reference_kv,
            base_path=BASE_PATH,
            chunks=CHUNKS,
            ctx=CTX,
            n_gpu_layers=N_GPU_LAYERS,
            timeout=21600.0,
        )
        summary["base"] = {
            "status": "ok",
            "elapsed_sec": round(time.time() - t0, 3),
            "path": str(BASE_PATH),
            "size_bytes": BASE_PATH.stat().st_size if BASE_PATH.exists() else None,
            "stdout_tail": base_result.get("stdout_tail"),
        }
        print(f"BASE_DONE {now()} elapsed_sec={summary['base']['elapsed_sec']} size_bytes={summary['base']['size_bytes']}", flush=True)
        save(summary)
    except Exception as e:
        summary["status"] = "fatal_base_failed"
        summary["base"] = {"status": "failed", "error": repr(e), "traceback": traceback.format_exc()}
        summary["finished_at"] = now()
        save(summary)
        print("QWEN_KLD_SMOKE_FATAL base_failed", flush=True)
        traceback.print_exc()
        return 1

    for cand in CANDIDATES:
        print(f"CANDIDATE_START {now()} {cand}", flush=True)
        rec = {"candidate": cand, "started_at": now(), "status": "running"}
        summary["results"].append(rec)
        save(summary)
        try:
            t0 = time.time()
            scored = run_perplexity_kld(
                model=MODEL,
                corpus=CORPUS,
                kv=KVConfig.parse(cand),
                base_path=BASE_PATH,
                chunks=CHUNKS,
                ctx=CTX,
                n_gpu_layers=N_GPU_LAYERS,
                timeout=21600.0,
            )
            rec.update({
                "status": "ok",
                "elapsed_sec": round(time.time() - t0, 3),
                "mean_kld": scored.get("mean_kld"),
                "kld_score": kld_score(scored.get("mean_kld")),
                "ppl": scored.get("ppl"),
                "rms_dp_pct": scored.get("rms_dp_pct"),
                "same_topp_pct": scored.get("same_topp_pct"),
                "stdout_tail": scored.get("stdout_tail"),
                "finished_at": now(),
            })
            print(f"CANDIDATE_DONE {now()} {cand} mean_kld={rec['mean_kld']} score={rec['kld_score']}", flush=True)
        except Exception as e:
            rec.update({
                "status": "failed",
                "elapsed_sec": round(time.time() - t0, 3) if 't0' in locals() else None,
                "error": repr(e),
                "traceback": traceback.format_exc(),
                "finished_at": now(),
            })
            print(f"CANDIDATE_ERROR {now()} {cand} {repr(e)}", flush=True)
        save(summary)

    try:
        if BASE_PATH.exists():
            base_size = BASE_PATH.stat().st_size
            BASE_PATH.unlink()
            summary["base"]["deleted_after_run"] = True
            summary["base"]["deleted_size_bytes"] = base_size
    except Exception as e:
        summary["base"]["delete_error"] = repr(e)

    ok_count = sum(1 for r in summary["results"] if r.get("status") == "ok")
    summary["status"] = "ok" if ok_count == len(CANDIDATES) else "partial"
    summary["finished_at"] = now()
    save(summary)
    print(f"QWEN_KLD_SMOKE_DONE {now()} status={summary['status']} ok={ok_count}/{len(CANDIDATES)}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
