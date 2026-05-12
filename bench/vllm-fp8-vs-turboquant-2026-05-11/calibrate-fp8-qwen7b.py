"""
Calibrate Qwen2.5-7B-Instruct for FP8 KV cache via llmcompressor.

Canonical Red Hat AI / vLLM ecosystem recipe:
- Dataset: HuggingFaceH4/ultrachat_200k, train_sft split
- 512 samples, max_seq_length=2048
- Per-tensor static FP8 scales for weights + activations + KV cache

Produces: ./qwen2.5-7b-fp8-kv/ (compressed FP8 model + tokenizer)
"""
import os, sys, time

os.environ.setdefault("HF_HOME", "/home/felipe/hf-cache")

from datasets import load_dataset
from transformers import AutoModelForCausalLM, AutoTokenizer
from llmcompressor import oneshot
from llmcompressor.modifiers.quantization import QuantizationModifier

MODEL_ID = "Qwen/Qwen2.5-7B-Instruct"
SAVE_DIR = "/home/felipe/vllm-lab/qwen2.5-7b-fp8-kv"
NUM_CALIBRATION_SAMPLES = 512
MAX_SEQUENCE_LENGTH = 2048

print(f"[{time.strftime('%H:%M:%S')}] loading {MODEL_ID}", flush=True)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_ID, dtype="auto", device_map="auto"
)
tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
print(f"[{time.strftime('%H:%M:%S')}] model on device", flush=True)

print(f"[{time.strftime('%H:%M:%S')}] loading calibration dataset", flush=True)
ds = load_dataset("HuggingFaceH4/ultrachat_200k", split="train_sft")
ds = ds.shuffle(seed=42).select(range(NUM_CALIBRATION_SAMPLES))

def preprocess(example):
    return {"text": tokenizer.apply_chat_template(example["messages"], tokenize=False)}

ds = ds.map(preprocess)

def tokenize(example):
    return tokenizer(
        example["text"],
        padding=False,
        max_length=MAX_SEQUENCE_LENGTH,
        truncation=True,
        add_special_tokens=False,
    )

ds = ds.map(tokenize, remove_columns=ds.column_names)
print(f"[{time.strftime('%H:%M:%S')}] dataset ready, {len(ds)} samples", flush=True)

recipe = """
quant_stage:
    quant_modifiers:
        QuantizationModifier:
            ignore: ["lm_head"]
            config_groups:
                group_0:
                    weights:
                        num_bits: 8
                        type: float
                        strategy: tensor
                        dynamic: false
                        symmetric: true
                    input_activations:
                        num_bits: 8
                        type: float
                        strategy: tensor
                        dynamic: false
                        symmetric: true
                    targets: ["Linear"]
            kv_cache_scheme:
                num_bits: 8
                type: float
                strategy: tensor
                dynamic: false
                symmetric: true
"""

print(f"[{time.strftime('%H:%M:%S')}] running oneshot calibration", flush=True)
t0 = time.time()
oneshot(
    model=model,
    dataset=ds,
    recipe=recipe,
    max_seq_length=MAX_SEQUENCE_LENGTH,
    num_calibration_samples=NUM_CALIBRATION_SAMPLES,
)
print(f"[{time.strftime('%H:%M:%S')}] calibration done in {time.time()-t0:.1f}s", flush=True)

model.save_pretrained(SAVE_DIR, save_compressed=True)
tokenizer.save_pretrained(SAVE_DIR)
print(f"[{time.strftime('%H:%M:%S')}] saved to {SAVE_DIR}", flush=True)
print("CALIBRATION_OK")
