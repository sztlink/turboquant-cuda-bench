#!/usr/bin/env python3
"""
Precompute BAAI/bge-reranker-v2-m3 scores for RealRAG HotpotQA R3B.

Scores BM25 top-k paragraph candidates for the same deterministic HotpotQA
question selection used by the Node harness. Output is public-safe metadata plus
qid -> paragraph-index -> score.
"""
import argparse, hashlib, json, math, os, time
from pathlib import Path


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument('--dataset', default='bench/_datasets/hotpot_dev_distractor_v1.json')
    p.add_argument('--out', required=True)
    p.add_argument('--limit', type=int, default=500)
    p.add_argument('--offset', type=int, default=0)
    p.add_argument('--seed', type=int, default=20260520)
    p.add_argument('--candidate-k', type=int, default=10)
    p.add_argument('--batch-size', type=int, default=16)
    p.add_argument('--device', default='auto')
    p.add_argument('--model-path', default='/home/aya/.cache/huggingface/hub/models--BAAI--bge-reranker-v2-m3/snapshots/953dc6f6f85a1b2dbfca4c34a2796e7dde08d41e')
    return p.parse_args()


def sha256_bytes(b):
    return hashlib.sha256(b).hexdigest()


def u32(x):
    return x & 0xFFFFFFFF


def imul(a, b):
    a = u32(a); b = u32(b)
    ah, al = a >> 16, a & 0xffff
    bh, bl = b >> 16, b & 0xffff
    return u32((al * bl) + (((ah * bl + al * bh) & 0xffff) << 16))


def mulberry32(seed):
    t = u32(seed)
    def rnd():
        nonlocal t
        t = u32(t + 0x6D2B79F5)
        r = imul(t ^ (t >> 15), 1 | t)
        r = u32(r ^ u32(r + imul(r ^ (r >> 7), 61 | r)))
        return u32(r ^ (r >> 14)) / 4294967296.0
    return rnd


def shuffled_indices(n, seed):
    arr = list(range(n))
    rnd = mulberry32(seed)
    for i in range(n - 1, 0, -1):
        j = int(math.floor(rnd() * (i + 1)))
        arr[i], arr[j] = arr[j], arr[i]
    return arr


def norm_text(s):
    import re
    s = str(s or '').lower().replace('\u2018', "'").replace('\u2019', "'").replace('\u201c', '"').replace('\u201d', '"')
    s = re.sub(r'[^a-z0-9\s]', ' ', s)
    s = re.sub(r'\b(a|an|the)\b', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()


def tokenize(s):
    n = norm_text(s)
    return n.split(' ') if n else []


def paragraph_records(item):
    support = set(str(sf[0]) for sf in item.get('supporting_facts', []))
    out = []
    for idx, pair in enumerate(item.get('context', [])):
        title, sentences = pair
        text = ' '.join(sentences) if isinstance(sentences, list) else str(sentences or '')
        out.append({'idx': idx, 'title': str(title), 'text': text, 'isSupport': str(title) in support})
    return out


def bm25_order(question, paragraphs):
    docs = [tokenize(p['title'] + ' ' + p['text']) for p in paragraphs]
    q = [t for t in tokenize(question) if len(t) > 1]
    N = len(docs) or 1
    df = {}
    for doc in docs:
        for t in set(doc):
            df[t] = df.get(t, 0) + 1
    avgdl = (sum(len(d) for d in docs) / N) if N else 1
    k1 = 1.2; b = 0.75
    scored = []
    for i, p in enumerate(paragraphs):
        doc = docs[i]
        tf = {}
        for t in doc:
            tf[t] = tf.get(t, 0) + 1
        score = 0.0
        for t in q:
            f = tf.get(t, 0)
            if not f: continue
            dft = df.get(t, 0)
            idf = math.log(1 + (N - dft + 0.5) / (dft + 0.5))
            score += idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * len(doc) / (avgdl or 1)))
        x = dict(p); x['bm25_score'] = score
        scored.append(x)
    scored.sort(key=lambda p: (-p['bm25_score'], p['idx']))
    for rank, p in enumerate(scored, 1):
        p['bm25_rank'] = rank
    return scored


def main():
    args = parse_args()
    raw = Path(args.dataset).read_bytes()
    dataset = json.loads(raw.decode('utf-8'))
    indices = shuffled_indices(len(dataset), args.seed)[args.offset:args.offset + args.limit]
    selected = []
    for i in indices:
        item = dataset[i]
        paras = paragraph_records(item)
        if item.get('_id') and item.get('question') and item.get('answer') and any(p['isSupport'] for p in paras) and any(not p['isSupport'] for p in paras):
            selected.append(item)

    pairs = []
    pair_meta = []
    candidate_titles = {}
    for item in selected:
        bm25 = bm25_order(item['question'], paragraph_records(item))[:args.candidate_k]
        candidate_titles[item['_id']] = [p['title'] for p in bm25]
        for p in bm25:
            pairs.append((item['question'], f"{p['title']}\n{p['text']}"))
            pair_meta.append((item['_id'], p['idx']))

    import torch
    from transformers import AutoModelForSequenceClassification, AutoTokenizer
    device = args.device
    if device == 'auto':
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
    started = time.time()
    tokenizer = AutoTokenizer.from_pretrained(args.model_path)
    model = AutoModelForSequenceClassification.from_pretrained(args.model_path).to(device)
    model.eval()
    scores = []
    with torch.inference_mode():
        total_batches = (len(pairs) + args.batch_size - 1) // args.batch_size
        for bi in range(total_batches):
            batch = pairs[bi * args.batch_size:(bi + 1) * args.batch_size]
            enc = tokenizer([a for a, _ in batch], [b for _, b in batch], padding=True, truncation=True, max_length=512, return_tensors='pt')
            enc = {k: v.to(device) for k, v in enc.items()}
            logits = model(**enc).logits.reshape(-1)
            vals = torch.sigmoid(logits).detach().cpu().tolist()
            scores.extend(vals)
            if bi == 0 or (bi + 1) % 25 == 0 or bi + 1 == total_batches:
                print(f"bge_batches {bi + 1}/{total_batches}", flush=True)
    score_map = {}
    for (qid, idx), score in zip(pair_meta, scores):
        score_map.setdefault(qid, {})[str(idx)] = float(score)

    out = {
        'schema': 'realrag.hotpotqa.r3b.bge_rerank_scores.v1',
        'created_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'dataset_path': args.dataset,
        'dataset_sha256': sha256_bytes(raw),
        'model_path': args.model_path,
        'model_name': 'BAAI/bge-reranker-v2-m3',
        'device': device,
        'limit': args.limit,
        'offset': args.offset,
        'seed': args.seed,
        'candidate_k': args.candidate_k,
        'selected_questions': len(selected),
        'scored_pairs': len(pairs),
        'elapsed_s': round(time.time() - started, 2),
        'candidate_titles': candidate_titles,
        'scores': score_map,
        'boundary': [
            'reranker scores are used only to reorder BM25 candidates',
            'support labels are not used by the reranker',
            'this is not evidence-use proof or production-RAG evidence'
        ]
    }
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    Path(args.out).write_text(json.dumps(out, indent=2), encoding='utf-8')
    print(json.dumps({k: out[k] for k in ['schema','device','selected_questions','scored_pairs','elapsed_s']}, indent=2))


if __name__ == '__main__':
    main()
