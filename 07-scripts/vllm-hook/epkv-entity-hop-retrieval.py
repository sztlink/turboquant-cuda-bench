#!/usr/bin/env python3
"""Entity-hop retrieval/path construction reality check for EPKV RealRAG.

Purpose: test whether a cheap entity-aware multi-hop retriever can improve over
BM25->BGE top-10 before Evidence-Controlled Decoding.

Pipeline:
- seed entities from question/title mentions
- first-hop BM25/exact-title retrieval
- title/entity mentions in first-hop docs
- second-hop exact-title + BM25 expansion
- optional BGE rerank over expanded candidate pool
- strong prompt, graph/path prompt, extractor candidate, optional internal ECD
"""
from __future__ import annotations

import argparse
import json
import re
import string
import subprocess
import sys
import time
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

import numpy as np
from rank_bm25 import BM25Okapi


STOP_SEEDS = {
    "who", "what", "which", "when", "where", "was", "were", "is", "are", "did", "do", "does",
    "the", "a", "an", "in", "of", "for", "and", "or", "to", "by", "with", "from", "this", "that",
    "Question", "Answer", "Passages", "Final",
}


def normalize_answer(s: str) -> str:
    def remove_articles(text: str) -> str:
        return re.sub(r"\b(a|an|the)\b", " ", text)
    def white_space_fix(text: str) -> str:
        return " ".join(text.split())
    def remove_punc(text: str) -> str:
        return "".join(ch for ch in text if ch not in set(string.punctuation))
    return white_space_fix(remove_articles(remove_punc(str(s).lower())))


def exact_match(prediction: str, ground_truth: str) -> float:
    return float(normalize_answer(prediction) == normalize_answer(ground_truth))


def contains_match(prediction: str, ground_truth: str) -> float:
    ng = normalize_answer(ground_truth)
    np = normalize_answer(prediction)
    return float(bool(ng) and ng in np)


def f1_score(prediction: str, ground_truth: str) -> float:
    pred_tokens = normalize_answer(prediction).split()
    gold_tokens = normalize_answer(ground_truth).split()
    if not pred_tokens and not gold_tokens:
        return 1.0
    if not pred_tokens or not gold_tokens:
        return 0.0
    counts = Counter(pred_tokens)
    num_same = 0
    for t in gold_tokens:
        if counts[t] > 0:
            num_same += 1
            counts[t] -= 1
    if num_same == 0:
        return 0.0
    precision = num_same / len(pred_tokens)
    recall = num_same / len(gold_tokens)
    return 2 * precision * recall / (precision + recall)


def metrics(pred: str, gold: str) -> dict[str, float]:
    return {"em": exact_match(pred, gold), "contains": contains_match(pred, gold), "f1": f1_score(pred, gold)}


def tokenize(s: str) -> list[str]:
    return re.findall(r"[\wÀ-ÖØ-öø-ÿ]+", str(s).lower())


def build_corpus(data: list[dict[str, Any]]) -> list[dict[str, str]]:
    seen = set()
    docs = []
    for item in data:
        for title, sents in item.get("context") or []:
            text = f"{title}: {' '.join(sents)}"
            key = (str(title), text)
            if key in seen:
                continue
            seen.add(key)
            docs.append({"title": str(title), "text": text})
    return docs


def support_titles(item: dict[str, Any]) -> set[str]:
    out = {str(x[0]) for x in item.get("supporting_facts") or [] if x}
    for ev in item.get("evidences") or []:
        if ev:
            out.add(str(ev[0]))
    return out


def request_json(url: str, payload: dict[str, Any], timeout: int) -> dict[str, Any]:
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"content-type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:  # noqa: S310 - local lab endpoint
        return json.loads(r.read().decode("utf-8"))


def content_of(resp: dict[str, Any]) -> str:
    return str(((resp.get("choices") or [{}])[0].get("message") or {}).get("content") or "")


def call_llm(endpoint: str, model: str, prompt: str, max_tokens: int, timeout: int) -> tuple[str, dict[str, Any], float]:
    t0 = time.time()
    resp = request_json(endpoint, {"model": model, "messages": [{"role": "user", "content": prompt}], "temperature": 0, "max_tokens": max_tokens}, timeout)
    return content_of(resp), resp, time.time() - t0


def top_indices(scores: Any, k: int) -> list[int]:
    arr = np.asarray(scores, dtype=float)
    if k <= 0 or arr.size == 0:
        return []
    k = min(k, arr.size)
    idx = np.argpartition(-arr, k - 1)[:k]
    idx = idx[np.argsort(-arr[idx])]
    return [int(i) for i in idx]


def unique_docs(docs: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen = set()
    out = []
    for d in docs:
        key = (d["title"], d["text"])
        if key in seen:
            continue
        seen.add(key)
        out.append(d)
    return out


def cap_spans(question: str) -> list[str]:
    spans = re.findall(r"(?:[A-ZÀ-ÖØ-Þ][\wÀ-ÖØ-öø-ÿ'’.-]*(?:\s+|$)){1,8}", question)
    out = []
    for s in spans:
        s = re.sub(r"\s+", " ", s).strip(" ?.,;:!()[]{}\"'")
        if not s or s.lower() in STOP_SEEDS or len(s) < 3:
            continue
        words = s.split()
        if all(w in STOP_SEEDS for w in words):
            continue
        if s not in out:
            out.append(s)
    return out


class TitleMatcher:
    def __init__(self, docs: list[dict[str, str]], max_df: int = 250) -> None:
        self.docs_by_norm_title: dict[str, list[dict[str, str]]] = defaultdict(list)
        self.titles: list[str] = []
        title_set = []
        seen = set()
        for d in docs:
            t = d["title"]
            nt = normalize_answer(t)
            if nt not in seen:
                seen.add(nt)
                title_set.append(t)
            self.docs_by_norm_title[nt].append(d)
        self.titles = title_set
        df: Counter[str] = Counter()
        title_tokens: list[set[str]] = []
        for t in self.titles:
            toks = {x for x in tokenize(t) if len(x) >= 4}
            title_tokens.append(toks)
            for tok in toks:
                df[tok] += 1
        self.index: dict[str, list[int]] = defaultdict(list)
        for i, toks in enumerate(title_tokens):
            for tok in toks:
                if df[tok] <= max_df:
                    self.index[tok].append(i)
        self._mention_cache: dict[tuple[str, int], list[str]] = {}

    def exact_docs(self, title: str) -> list[dict[str, str]]:
        return list(self.docs_by_norm_title.get(normalize_answer(title), []))

    def mentions(self, text: str, max_mentions: int = 30) -> list[str]:
        cache_key = (str(text), int(max_mentions))
        if cache_key in self._mention_cache:
            return list(self._mention_cache[cache_key])
        ntext = f" {normalize_answer(text)} "
        toks = {x for x in tokenize(text) if len(x) >= 4}
        cand: Counter[int] = Counter()
        for tok in toks:
            for i in self.index.get(tok, [])[:500]:
                cand[i] += 1
        found = []
        for i, score in cand.most_common(800):
            title = self.titles[i]
            nt = normalize_answer(title)
            if len(nt) < 3:
                continue
            # require full normalized title as substring; avoids most noisy capital spans.
            if f" {nt} " in ntext:
                found.append((title, score, len(nt)))
        found.sort(key=lambda x: (x[1], x[2]), reverse=True)
        out = []
        for title, _, _ in found:
            if title not in out:
                out.append(title)
            if len(out) >= max_mentions:
                break
        self._mention_cache[cache_key] = list(out)
        return out


def doc_text(d: dict[str, Any], max_chars: int) -> str:
    text = str(d["text"])
    if max_chars > 0 and len(text) > max_chars:
        return text[:max_chars].rsplit(" ", 1)[0] + " ..."
    return text


def make_strong_prompt(question: str, docs: list[dict[str, Any]], max_chars: int = 700) -> str:
    lines = [f"P{i+1}: {doc_text(d, max_chars)}" for i, d in enumerate(docs)]
    return "\n".join([
        "You are answering a multi-hop question using retrieved passages.",
        "Some passages may be irrelevant or distracting.",
        "Use only passages that directly support the answer.",
        "Answer with only the final answer string. No explanation.",
        "Passages:",
        *lines,
        f"Question: {question}",
        "Final answer:",
    ])


def make_path_prompt(question: str, docs: list[dict[str, Any]], edges: list[tuple[str, str]], max_chars: int = 700) -> str:
    edge_lines = [f"- {a} -> {b}" for a, b in edges[:50]] or ["- no explicit title-link edges found"]
    doc_lines = [f"P{i+1}: {doc_text(d, max_chars)}" for i, d in enumerate(docs)]
    return "\n".join([
        "You are answering a multi-hop question using retrieved passages and a candidate entity graph.",
        "The graph is heuristic and may contain distractors. Use it only if the passages support it.",
        "Answer with only the final answer string. No explanation.",
        "Candidate entity/title graph:",
        *edge_lines,
        "Passages:",
        *doc_lines,
        f"Question: {question}",
        "Final answer:",
    ])


def answer_contract_lines(question: str) -> list[str]:
    q = str(question).lower()
    lines: list[str] = []
    if re.search(r"\b(when|date)\b|date of (birth|death)|born|died", q):
        lines.append("Expected answer type: date or year. Do not answer with a person, title, country, or relation label.")
    elif re.search(r"nationality", q):
        lines.append("Expected answer type: nationality/demonym. Do not answer with a city, person, film, or generic title.")
    elif re.search(r"which country|what country|country .* from|\bfrom\?", q):
        lines.append("Expected answer type: country. Do not answer with a city, region, person, film, or generic title.")
    elif re.search(r"\bwhere\b|place of (birth|death|origin)|born|died|graduated", q):
        lines.append("Expected answer type: place or institution. Do not answer with a person, film, song, or relation label.")
    elif re.search(r"\bwho\b|spouse|father|mother|grandfather|grandmother|performer|director|composer", q):
        lines.append("Expected answer type: person or organization name. Do not answer with a place, date, nationality, or relation label.")
    else:
        lines.append("Expected answer type: short entity/value string matching the question.")

    if re.search(r"paternal grandfather|maternal grandfather|paternal grandmother|maternal grandmother|grandfather|grandmother", q):
        lines.append("Relation-depth guard: a grandparent answer needs a two-hop parent-of-parent chain. Do not answer with the direct parent.")
    elif re.search(r"father|mother|parent", q):
        lines.append("Relation-depth guard: answer the requested parent relation only. Do not drift to grandparent, spouse, child, or same-family neighbor.")
    elif re.search(r"spouse|husband|wife", q):
        lines.append("Relation guard: answer the spouse of the requested entity, not the entity itself or another family member.")

    if re.search(r"(place|date|country|nationality).*(father|mother|spouse|husband|wife|performer|director|composer)|(father|mother|spouse|husband|wife|performer|director|composer).*(born|died|from|nationality|graduated|place|date)", q):
        lines.append("Attribute-owner guard: first resolve the owner entity, then answer that owner's requested attribute. Do not answer the owner entity or the generic attribute label.")

    if re.search(r"film|song|performer|director|composer", q):
        lines.append("Media-chain guard: resolve the exact film/song first, then the requested performer/director/composer relation, then the final attribute.")

    lines.append("Generic-title guard: titles like Place of birth, Place of origin, The Singer, The Child, The Feature, Story, Model, or The General are evidence hints, not final answers.")
    return lines


def make_guarded_path_prompt(question: str, docs: list[dict[str, Any]], edges: list[tuple[str, str]], max_chars: int = 700) -> str:
    edge_lines = [f"- {a} -> {b}" for a, b in edges[:50]] or ["- no explicit title-link edges found"]
    doc_lines = [f"P{i+1}: {doc_text(d, max_chars)}" for i, d in enumerate(docs)]
    return "\n".join([
        "You are answering a multi-hop question using retrieved passages and a candidate entity graph.",
        "The graph is heuristic and may contain distractors. Use it only if the passages support it.",
        "Before answering, silently enforce these guards:",
        *[f"- {line}" for line in answer_contract_lines(question)],
        "If the passages do not support the required relation and answer type, answer UNKNOWN.",
        "Answer with only the final answer string. No explanation.",
        "Candidate entity/title graph:",
        *edge_lines,
        "Passages:",
        *doc_lines,
        f"Question: {question}",
        "Final answer:",
    ])


def extractor_prompt(question: str, docs: list[dict[str, Any]], edges: list[tuple[str, str]], max_chars: int = 700) -> str:
    edge_lines = [f"- {a} -> {b}" for a, b in edges[:80]] or ["- none"]
    doc_lines = [f"P{i+1}: {doc_text(d, max_chars)}" for i, d in enumerate(docs)]
    return "\n".join([
        "You are a strict graph/path extractor for multi-hop QA.",
        "Use ONLY the passages. The candidate graph is heuristic and may contain distractors.",
        "Find the minimal supported chain. If not enough information, status MISSING.",
        "Return ONLY valid JSON, no markdown.",
        '{"status":"FOUND|MISSING","final_answer":"answer string or UNKNOWN","chain":["A -- relation --> B"],"evidence_passages":["P1"],"reason":"short"}',
        "Candidate graph:",
        *edge_lines,
        "Passages:",
        *doc_lines,
        f"Question: {question}",
    ])


def extract_json_object(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    cleaned = re.sub(r"^```(?:json)?", "", cleaned).strip()
    cleaned = re.sub(r"```$", "", cleaned).strip()
    try:
        obj = json.loads(cleaned)
        return obj if isinstance(obj, dict) else {}
    except Exception:
        pass
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start >= 0 and end > start:
        try:
            obj = json.loads(cleaned[start : end + 1])
            return obj if isinstance(obj, dict) else {}
        except Exception:
            return {}
    return {}


def sh(cmd: list[str], timeout: int = 420) -> str:
    p = subprocess.run(cmd, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=timeout)
    if p.returncode != 0:
        raise RuntimeError(f"command failed {p.returncode}: {' '.join(cmd)}\nSTDOUT={p.stdout}\nSTDERR={p.stderr}")
    return p.stdout


def run_internal_ecd(prompt: str, candidate: str, qid: str, gold: str, out_path: Path, bias: float, max_tokens: int) -> str:
    fake = {
        "schema": "epkv.entity_hop_prompt.v0",
        "qid": qid,
        "gold_answer": gold,
        "messages": [{"role": "user", "content": prompt}],
        "spans": [],
    }
    span_path = out_path.with_suffix(".span-map.json")
    span_path.write_text(json.dumps(fake, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    sh([
        sys.executable,
        "07-scripts/vllm-hook/epkv-internal-sampler-policy-live.py",
        "--span-map", str(span_path),
        "--candidate", candidate,
        "--candidate-source", "auto",
        "--bias", str(bias),
        "--suppress-scaffold",
        "--max-tokens", str(max_tokens),
        "--out", str(out_path),
    ])
    data = json.loads(out_path.read_text(encoding="utf-8"))
    return str(data.get("output") or "")


def avg(rows: list[dict[str, Any]], condition: str, metric: str) -> float:
    if not rows:
        return 0.0
    return sum(float(r["conditions"][condition][metric]) for r in rows) / len(rows)


SOURCE_PRIORITY = {
    "seed_exact": 100.0,
    "mention_exact": 80.0,
    "bm25_first": 50.0,
    "seed_bm25": 45.0,
    "mention_bm25": 40.0,
}


def rank_pool_heuristic(question: str, pool: list[dict[str, Any]]) -> list[dict[str, Any]]:
    qtoks = set(tokenize(question))
    def score(d: dict[str, Any]) -> tuple[float, int, int]:
        title_toks = set(tokenize(d.get("title", "")))
        text_toks = set(tokenize(d.get("text", "")))
        overlap_title = len(qtoks.intersection(title_toks))
        overlap_text = len(qtoks.intersection(text_toks))
        return (SOURCE_PRIORITY.get(str(d.get("source") or ""), 0.0) + 3 * overlap_title + 0.2 * overlap_text, overlap_title, overlap_text)
    return sorted(pool, key=score, reverse=True)


def retrieve_entity_hop(
    q: str,
    corpus: list[dict[str, str]],
    bm25: BM25Okapi,
    matcher: TitleMatcher,
    *,
    bm25_first: int,
    seed_top: int,
    second_per_mention: int,
    pool_limit: int,
    max_seed_expansions: int,
    max_doc_mentions: int,
) -> tuple[list[dict[str, Any]], list[tuple[str, str]], list[str]]:
    scores_q = bm25.get_scores(tokenize(q))
    base_idx = top_indices(scores_q, bm25_first)
    seeds = matcher.mentions(q, max_mentions=12)
    for s in cap_spans(q):
        if s not in seeds:
            seeds.append(s)
    docs: list[dict[str, Any]] = []
    # exact title seeds
    for s in seeds:
        for d in matcher.exact_docs(s)[:3]:
            dd = dict(d)
            dd["source"] = "seed_exact"
            docs.append(dd)
    for i in base_idx:
        dd = dict(corpus[i])
        dd["source"] = "bm25_first"
        docs.append(dd)
    # seed BM25 expansions
    if seed_top > 0:
        for s in seeds[:max_seed_expansions]:
            ss = bm25.get_scores(tokenize(q + " " + s))
            for i in top_indices(ss, seed_top):
                dd = dict(corpus[i])
                dd["source"] = "seed_bm25"
                docs.append(dd)
    first_docs = unique_docs(docs)[:pool_limit]
    edges: list[tuple[str, str]] = []
    expanded = list(first_docs)
    for d in first_docs[:bm25_first]:
        mentions = [m for m in matcher.mentions(d["text"], max_mentions=max_doc_mentions) if normalize_answer(m) != normalize_answer(d["title"])]
        for m in mentions[:max_doc_mentions]:
            edges.append((d["title"], m))
            for ed in matcher.exact_docs(m)[:2]:
                dd = dict(ed)
                dd["source"] = "mention_exact"
                expanded.append(dd)
            if second_per_mention > 0:
                ms = bm25.get_scores(tokenize(q + " " + m))
                for i in top_indices(ms, second_per_mention):
                    dd = dict(corpus[i])
                    dd["source"] = "mention_bm25"
                    expanded.append(dd)
    return unique_docs(expanded)[:pool_limit], edges, seeds


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--dataset", default="bench/_datasets/2wiki/data/dev.json")
    p.add_argument("--rag-summary", default="bench/epkv-live-probe-v0-2026-05-21/sprint-12h/rag-reality-check-100/summary.json")
    p.add_argument("--out-dir", required=True)
    p.add_argument("--endpoint", default="http://192.168.15.133:11435/v1/chat/completions")
    p.add_argument("--model", default="local-vllm")
    p.add_argument("--limit", type=int, default=20)
    p.add_argument("--offset", type=int, default=0)
    p.add_argument("--top-k", type=int, default=10)
    p.add_argument("--bm25-first", type=int, default=12)
    p.add_argument("--seed-top", type=int, default=3)
    p.add_argument("--second-per-mention", type=int, default=1)
    p.add_argument("--max-seed-expansions", type=int, default=4)
    p.add_argument("--max-doc-mentions", type=int, default=5)
    p.add_argument("--pool-limit", type=int, default=80)
    p.add_argument("--max-tokens", type=int, default=32)
    p.add_argument("--extract-max-tokens", type=int, default=128)
    p.add_argument("--doc-chars", type=int, default=700)
    p.add_argument("--timeout", type=int, default=120)
    p.add_argument("--bge-model", default="BAAI/bge-reranker-v2-m3")
    p.add_argument("--skip-bge", action="store_true")
    p.add_argument("--disable-ecd", action="store_true")
    p.add_argument("--skip-extract", action="store_true")
    p.add_argument("--skip-llm", action="store_true", help="Only compute retrieval/path stats; do not call vLLM")
    p.add_argument("--include-guarded-path", action="store_true", help="Also run a guarded path prompt with relation and answer-type constraints")
    p.add_argument("--bias", type=float, default=3.0)
    args = p.parse_args()

    out_dir = Path(args.out_dir)
    response_dir = out_dir / "responses"
    ecd_dir = out_dir / "ecd"
    response_dir.mkdir(parents=True, exist_ok=True)
    ecd_dir.mkdir(parents=True, exist_ok=True)

    data = json.loads(Path(args.dataset).read_text(encoding="utf-8"))
    selected = [x for x in data if x.get("type") in {"compositional", "inference"} and len(x.get("evidences") or []) >= 2]
    selected = selected[args.offset : args.offset + args.limit]
    corpus = build_corpus(data)
    bm25 = BM25Okapi([tokenize(d["text"]) for d in corpus])
    matcher = TitleMatcher(corpus)
    rag_ref = {}
    if args.rag_summary and Path(args.rag_summary).exists():
        rag = json.loads(Path(args.rag_summary).read_text(encoding="utf-8"))
        rag_ref = {str(r["qid"]): r for r in rag.get("rows", [])}

    reranker = None
    if not args.skip_bge:
        from sentence_transformers import CrossEncoder
        reranker = CrossEncoder(args.bge_model, max_length=512)

    rows = []
    t0 = time.time()
    for idx, item in enumerate(selected, start=args.offset):
        qid = str(item["_id"])
        q = str(item["question"])
        gold = str(item["answer"])
        stitles = support_titles(item)
        pool, edges, seeds = retrieve_entity_hop(q, corpus, bm25, matcher, bm25_first=args.bm25_first, seed_top=args.seed_top, second_per_mention=args.second_per_mention, pool_limit=args.pool_limit, max_seed_expansions=args.max_seed_expansions, max_doc_mentions=args.max_doc_mentions)
        if reranker is not None and pool:
            pred = reranker.predict([(q, d["text"]) for d in pool])
            order = sorted(range(len(pool)), key=lambda i: float(pred[i]), reverse=True)
            docs = [pool[i] for i in order[:args.top_k]]
            scores = [float(pred[i]) for i in order[:args.top_k]]
        else:
            docs = rank_pool_heuristic(q, pool)[:args.top_k]
            scores = []
        doc_titles = {d["title"] for d in docs}
        support_recall = len(stitles.intersection(doc_titles)) / max(1, len(stitles))
        full_support = float(stitles.issubset(doc_titles)) if stitles else 0.0
        answer_present = any(normalize_answer(gold) in normalize_answer(d["text"]) for d in docs)
        conditions: dict[str, Any] = {}
        if not args.skip_llm:
            prompt_jobs = [
                ("entity_hop_strong", make_strong_prompt(q, docs, args.doc_chars)),
                ("entity_hop_path_prompt", make_path_prompt(q, docs, edges, args.doc_chars)),
            ]
            if args.include_guarded_path:
                prompt_jobs.append(("entity_hop_path_guarded", make_guarded_path_prompt(q, docs, edges, args.doc_chars)))
            for cname, prompt in prompt_jobs:
                output, resp, latency = call_llm(args.endpoint, args.model, prompt, args.max_tokens, args.timeout)
                m = metrics(output, gold)
                conditions[cname] = {**m, "output": output, "latency_sec": latency}
                (response_dir / f"{idx}-{qid}-{cname}.json").write_text(json.dumps({"qid": qid, "condition": cname, "gold": gold, "prompt": prompt, "output": output, "metrics": m, "response": resp}, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        candidate = ""
        if not args.skip_extract and not args.skip_llm:
            # strict path extraction
            eprompt = extractor_prompt(q, docs, edges, args.doc_chars)
            etext, eresp, elat = call_llm(args.endpoint, args.model, eprompt, args.extract_max_tokens, args.timeout)
            eobj = extract_json_object(etext)
            candidate = str(eobj.get("final_answer") or "").strip()
            status = str(eobj.get("status") or "").upper()
            if candidate.upper() in {"", "UNKNOWN", "MISSING", "N/A", "NONE"}:
                candidate = ""
            extract_output = candidate if status == "FOUND" and candidate else etext
            conditions["entity_hop_path_extract"] = {**metrics(extract_output, gold), "output": extract_output, "latency_sec": elat, "status": status, "candidate": candidate}
            (response_dir / f"{idx}-{qid}-entity_hop_path_extract.json").write_text(json.dumps({"qid": qid, "gold": gold, "prompt": eprompt, "output": etext, "extract": eobj, "metrics": conditions["entity_hop_path_extract"], "response": eresp}, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        ecd_output = ""
        ecd_error = ""
        if candidate and not args.disable_ecd:
            try:
                ecd_output = run_internal_ecd(make_path_prompt(q, docs, edges, args.doc_chars), candidate, qid, gold, ecd_dir / f"{idx}-{qid}.json", args.bias, args.max_tokens)
            except Exception as exc:  # noqa: BLE001
                ecd_error = str(exc)
        if not args.skip_extract:
            conditions["entity_hop_path_ecd"] = {**(metrics(ecd_output, gold) if ecd_output else {"em": 0.0, "contains": 0.0, "f1": 0.0}), "output": ecd_output, "error": ecd_error}
        bref = (rag_ref.get(qid, {}).get("conditions", {}).get("bge_rerank_strong") or {})
        rows.append({
            "idx": idx,
            "qid": qid,
            "question": q,
            "gold": gold,
            "support_titles": sorted(stitles),
            "seeds": seeds,
            "edges": edges[:80],
            "pool_size": len(pool),
            "selected_titles": [d["title"] for d in docs],
            "selected_scores": scores,
            "support_title_recall": support_recall,
            "full_support_recall": full_support,
            "answer_string_present_in_docs": bool(answer_present),
            "bge_ref": {"em": bref.get("em", 0), "contains": bref.get("contains", 0), "f1": bref.get("f1", 0), "output": bref.get("output", "")},
            "conditions": conditions,
        })

    conds = sorted({c for r in rows for c in r["conditions"]})
    summary = {
        "schema": "epkv.entity_hop_retrieval.v0",
        "elapsed_sec": time.time() - t0,
        "total": len(rows),
        "corpus_docs": len(corpus),
        "macro": {},
        "retrieval": {
            "support_title_recall": sum(r["support_title_recall"] for r in rows) / max(1, len(rows)),
            "full_support_recall": sum(r["full_support_recall"] for r in rows) / max(1, len(rows)),
            "answer_string_present_rate": sum(1 for r in rows if r["answer_string_present_in_docs"]) / max(1, len(rows)),
        },
        "rows": rows,
    }
    summary["macro"]["bge_ref"] = {
        "em": sum(float(r["bge_ref"].get("em", 0)) for r in rows) / max(1, len(rows)),
        "contains": sum(float(r["bge_ref"].get("contains", 0)) for r in rows) / max(1, len(rows)),
        "f1": sum(float(r["bge_ref"].get("f1", 0)) for r in rows) / max(1, len(rows)),
    }
    for c in conds:
        summary["macro"][c] = {m: avg(rows, c, m) for m in ["em", "contains", "f1"]}
    (out_dir / "summary.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    md = ["# Entity-Hop Retrieval", "", f"total: {len(rows)}", f"corpus_docs: {len(corpus)}", "", "## Retrieval", "", "| metric | value |", "|---|---:|"]
    for k, v in summary["retrieval"].items():
        md.append(f"| {k} | {v:.3f} |")
    md.extend(["", "## Answer quality", "", "| condition | EM | contains | F1 |", "|---|---:|---:|---:|"])
    for c, m in summary["macro"].items():
        md.append(f"| {c} | {m['em']:.3f} | {m['contains']:.3f} | {m['f1']:.3f} |")
    md.extend(["", "## Rows", "", "| qid | gold | support | answer in docs | bge | hop strong | path | guarded | extract | ecd |", "|---|---|---:|---:|---:|---:|---:|---:|---:|---:|"])
    for r in rows:
        def f(c: str) -> str:
            if c not in r["conditions"]:
                return ""
            return f"{r['conditions'][c]['em']:.0f}/{r['conditions'][c]['f1']:.2f}"
        md.append(f"| {r['qid']} | {r['gold']} | {r['support_title_recall']:.2f} | {int(r['answer_string_present_in_docs'])} | {r['bge_ref']['em']:.0f}/{r['bge_ref']['f1']:.2f} | {f('entity_hop_strong')} | {f('entity_hop_path_prompt')} | {f('entity_hop_path_guarded')} | {f('entity_hop_path_extract')} | {f('entity_hop_path_ecd')} |")
    (out_dir / "RESULTS.md").write_text("\n".join(md) + "\n", encoding="utf-8")
    print(json.dumps({"out_dir": str(out_dir), "total": len(rows), "retrieval": summary["retrieval"], "macro": summary["macro"]}, indent=2, ensure_ascii=False))
    print("EPKV_ENTITY_HOP_RETRIEVAL_DONE")


if __name__ == "__main__":
    main()
