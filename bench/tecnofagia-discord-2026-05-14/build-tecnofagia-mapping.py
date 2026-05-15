"""
Build tecnofagia-discord-mapping.json.

Take the canonical k16-mapping.json (8 handles × 4 chunks each: 1 canonical + 3 decoys),
keep the canonical chunk (the one containing the expected SECRET VALUE),
replace the 3 decoy chunks with 3 random chunks from the Discord Waffle House corpus.

Pergunta única: o invariante 5/8 sobrevive quando os decoys são reais (não curados
para serem lexicamente densos em query terms)?
"""
import json, os, re, random
from pathlib import Path

ORIG = "/home/aya/implante/research/turboquant-cuda-bench/bench/vllm-decoy-2026-05-11/k16-mapping.json"
DISCORD_DIR = "/home/aya/implante/memory-md/AYA1/research/discord-thetom-turboquant"
OUT = "/home/aya/implante/research/turboquant-cuda-bench/bench/tecnofagia-discord-2026-05-14/tecnofagia-mapping.json"

CHUNK_SIZE_TARGET = 4700  # match avg decoy size
CHUNK_OVERLAP = 0          # non-overlapping for clean substitution

def load_discord_corpus():
    """Load all Discord .md files, return list of (source_label, text)."""
    files = sorted(Path(DISCORD_DIR).glob("*.md"))
    out = []
    for f in files:
        text = f.read_text(encoding="utf-8")
        # Strip frontmatter and the boilerplate header
        text = re.sub(r"^---\n.*?\n---\n", "", text, count=1, flags=re.DOTALL)
        out.append((f.name, text))
    return out

def split_into_chunks(text, size):
    """Naive char-based split, prefer to break on newline near target."""
    chunks = []
    i = 0
    while i < len(text):
        j = min(i + size, len(text))
        # Try to backtrack to a newline within last 200 chars
        if j < len(text):
            nl = text.rfind("\n", j - 200, j)
            if nl > i:
                j = nl
        chunks.append(text[i:j].strip())
        i = j
    return [c for c in chunks if len(c) > 1500]  # drop too-small chunks

def build_discord_chunk_pool():
    pool = []
    for label, text in load_discord_corpus():
        for ci, chunk in enumerate(split_into_chunks(text, CHUNK_SIZE_TARGET)):
            pool.append({
                "source": label,
                "chunk_idx": ci,
                "text": chunk,
                "len": len(chunk),
            })
    return pool

def find_canonical_chunk(system_prompt, expected):
    """Split system prompt by chunk boundaries, return (canonical_text, decoy_texts)."""
    # Each chunk starts with "// /home/aya/implante/research/turboquant-cuda-bench/..."
    # Wrapped in ```
    parts = re.split(r"(?=// /home/aya/implante)", system_prompt)
    parts = [p for p in parts if p.strip()]
    canonical = None
    decoys = []
    header = ""
    for i, p in enumerate(parts):
        if i == 0 and not p.startswith("// "):
            # Pre-header e.g. "## Retrieved code context"
            header = p
            continue
        if expected in p:
            canonical = p
        else:
            decoys.append(p)
    return header, canonical, decoys

def format_discord_chunk_as_block(disc_chunk, idx):
    """Turn a Discord chunk into the same path-header convention as decoys."""
    label = disc_chunk["source"]
    ci = disc_chunk["chunk_idx"]
    path = f"/home/aya/implante/memory-md/AYA1/research/discord-thetom-turboquant/{label}:chunk_{ci}"
    body = disc_chunk["text"]
    return f"// {path}\n```\n{body}\n```\n"

def main():
    rng = random.Random(42)
    orig = json.load(open(ORIG))
    pool = build_discord_chunk_pool()
    print(f"Discord chunk pool: {len(pool)} chunks "
          f"(avg {sum(c['len'] for c in pool)//len(pool)} chars)")

    out = []
    for handle_i, h in enumerate(orig):
        sys_prompt = h["messages"][0]["content"]
        expected = h["expected"]
        header, canonical, decoys = find_canonical_chunk(sys_prompt, expected)
        if canonical is None:
            print(f"[{h['handle']}] NO canonical chunk found, skipping")
            continue
        # Pick 3 random Discord chunks (deterministic per handle)
        rng_h = random.Random(42 + handle_i)
        picks = rng_h.sample(pool, 3)
        new_decoys = [format_discord_chunk_as_block(p, i) for i, p in enumerate(picks)]
        # Preserve the canonical position (where it was in original — we'll keep canonical at original index)
        # For simplicity put canonical at the same relative position; here we put canonical 4th (last)
        # to match original (decoys first, canonical at end was the original ranking)
        new_chunks = new_decoys + [canonical]
        new_sys = header + "".join(new_chunks)
        new_messages = [
            {"role": "system", "content": new_sys},
            h["messages"][1],
        ]
        rec = {
            "handle": h["handle"],
            "expected": expected,
            "messages": new_messages,
            "_tecnofagia": {
                "decoy_sources": [{"source": p["source"], "chunk_idx": p["chunk_idx"]} for p in picks],
                "canonical_preserved": True,
            },
        }
        out.append(rec)
        print(f"[{h['handle']}] canonical={len(canonical)}ch  decoys={[p['source'] for p in picks]}  total_sys={len(new_sys)}ch")

    with open(OUT, "w") as f:
        json.dump(out, f, indent=2)
    print(f"\nwrote {len(out)} handles to {OUT}")

if __name__ == "__main__":
    main()
