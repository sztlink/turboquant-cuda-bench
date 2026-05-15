#!/usr/bin/env python3
import argparse, json, glob, re, statistics
from collections import Counter, defaultdict

RUNS = {
  'fullkv_2048': {
    'method':'fullkv','budget':'full','max_new_tokens':2048,
    'eval': 'experiments/outputs/aime24/Qwen3-8B/sample1/fullkv/full_pi_quality_aime24_n30_fullkv_20260513/eval/*/aime24/default-default_math_multi_eval.jsonl',
    'merged': 'experiments/outputs/aime24/Qwen3-8B/sample1/fullkv/full_pi_quality_aime24_n30_fullkv_20260513/merged/merged.jsonl'},
  'tri_b256_2048': {
    'method':'triattention','budget':256,'max_new_tokens':2048,
    'eval': 'experiments/outputs/aime24/Qwen3-8B/sample1/triattention/budget_256_pi_quality_aime24_n30_triattention_20260513/eval/*/aime24/default-default_math_multi_eval.jsonl',
    'merged': 'experiments/outputs/aime24/Qwen3-8B/sample1/triattention/budget_256_pi_quality_aime24_n30_triattention_20260513/merged/merged.jsonl'},
  'cask_b256_2048': {
    'method':'cask','budget':256,'max_new_tokens':2048,
    'eval': 'experiments/outputs/aime24/Qwen3-8B/sample1/cask/budget_256_pi_quality_aime24_n30_cask_20260513/eval/*/aime24/default-default_math_multi_eval.jsonl',
    'merged': 'experiments/outputs/aime24/Qwen3-8B/sample1/cask/budget_256_pi_quality_aime24_n30_cask_20260513/merged/merged.jsonl'},
  'fullkv_4096': {
    'method':'fullkv','budget':'full','max_new_tokens':4096,
    'eval': 'experiments/outputs/aime24/Qwen3-8B/sample1/fullkv/full_pi_aime24_n30_mnt4096_fullkv_20260513/eval/*/aime24/default-default_math_multi_eval.jsonl',
    'merged': 'experiments/outputs/aime24/Qwen3-8B/sample1/fullkv/full_pi_aime24_n30_mnt4096_fullkv_20260513/merged/merged.jsonl'},
  'tri_b256_4096': {
    'method':'triattention','budget':256,'max_new_tokens':4096,
    'eval': 'experiments/outputs/aime24/Qwen3-8B/sample1/triattention/budget_256_pi_aime24_n30_mnt4096_triattention_20260513/eval/*/aime24/default-default_math_multi_eval.jsonl',
    'merged': 'experiments/outputs/aime24/Qwen3-8B/sample1/triattention/budget_256_pi_aime24_n30_mnt4096_triattention_20260513/merged/merged.jsonl'},
  'cask_b256_4096': {
    'method':'cask','budget':256,'max_new_tokens':4096,
    'eval': 'experiments/outputs/aime24/Qwen3-8B/sample1/cask/budget_256_pi_aime24_n30_mnt4096_cask_20260513/eval/*/aime24/default-default_math_multi_eval.jsonl',
    'merged': 'experiments/outputs/aime24/Qwen3-8B/sample1/cask/budget_256_pi_aime24_n30_mnt4096_cask_20260513/merged/merged.jsonl'},
  'tri_b384_4096': {
    'method':'triattention','budget':384,'max_new_tokens':4096,
    'eval': 'experiments/outputs/aime24/Qwen3-8B/sample1/triattention/budget_384_pi_aime24_n30_mnt4096_triattention_b384_20260513/eval/*/aime24/default-default_math_multi_eval.jsonl',
    'merged': 'experiments/outputs/aime24/Qwen3-8B/sample1/triattention/budget_384_pi_aime24_n30_mnt4096_triattention_b384_20260513/merged/merged.jsonl'},
  'cask_b384_4096': {
    'method':'cask','budget':384,'max_new_tokens':4096,
    'eval': 'experiments/outputs/aime24/Qwen3-8B/sample1/cask/budget_384_pi_aime24_n30_mnt4096_cask_b384_20260513/eval/*/aime24/default-default_math_multi_eval.jsonl',
    'merged': 'experiments/outputs/aime24/Qwen3-8B/sample1/cask/budget_384_pi_aime24_n30_mnt4096_cask_b384_20260513/merged/merged.jsonl'},
  'tri_b512_4096': {
    'method':'triattention','budget':512,'max_new_tokens':4096,
    'eval': 'experiments/outputs/aime24/Qwen3-8B/sample1/triattention/budget_512_pi_aime24_n30_mnt4096_triattention_b512_20260513/eval/*/aime24/default-default_math_multi_eval.jsonl',
    'merged': 'experiments/outputs/aime24/Qwen3-8B/sample1/triattention/budget_512_pi_aime24_n30_mnt4096_triattention_b512_20260513/merged/merged.jsonl'},
  'cask_b512_4096': {
    'method':'cask','budget':512,'max_new_tokens':4096,
    'eval': 'experiments/outputs/aime24/Qwen3-8B/sample1/cask/budget_512_pi_aime24_n30_mnt4096_cask_b512_20260513/eval/*/aime24/default-default_math_multi_eval.jsonl',
    'merged': 'experiments/outputs/aime24/Qwen3-8B/sample1/cask/budget_512_pi_aime24_n30_mnt4096_cask_b512_20260513/merged/merged.jsonl'},
}

ORDER = list(RUNS.keys())
IMPORTANT_IDXS = [0, 7, 9, 11, 12, 24, 26]

ANSWER_MARKER_RE = re.compile(r'(?:final\s+answer|answer\s+is|the\s+answer\s+is|therefore|thus|so\s+the\s+answer)', re.I)
BOX_RE = re.compile(r'\\boxed\{([^{}]{0,120})\}')
INT_RE = re.compile(r'(?<![A-Za-z0-9_.-])-?\d+(?:\.\d+)?(?![A-Za-z0-9_.-])')

def load_jsonl(pathpat):
    gs = glob.glob(pathpat)
    if not gs:
        raise FileNotFoundError(pathpat)
    return [json.loads(l) for l in open(gs[0], encoding='utf-8')]

def score_ok(e):
    s=e.get('score')
    return bool(s[0]) if isinstance(s,list) and s else bool(s)

def norm_num(x):
    if x is None: return None
    s=str(x).replace(',', '')
    m=re.search(r'-?\d+(?:\.\d+)?', s)
    if not m: return None
    t=m.group(0)
    # AIME targets are integers. If decimal is integer-valued, normalize to int; else keep trimmed decimal.
    try:
        f=float(t)
        if abs(f-round(f)) < 1e-9:
            return str(int(round(f)))
    except Exception:
        pass
    if '.' in t:
        t=t.rstrip('0').rstrip('.')
    neg=t.startswith('-')
    body=t[1:] if neg else t
    body=body.lstrip('0') or '0'
    return ('-' if neg else '') + body

def gt_pattern(gt):
    n=norm_num(gt)
    if n is None: return None
    if n.startswith('-'):
        return re.compile(r'(?<![\d-])-0*' + re.escape(n[1:]) + r'(?!\d)')
    return re.compile(r'(?<!\d)0*' + re.escape(n) + r'(?!\d)')

def find_gt_positions(out, gt):
    pat=gt_pattern(gt)
    if not pat: return []
    return [(m.start(), m.end()) for m in pat.finditer(out or '')]

def boxed_values(out):
    return [m.group(1).strip() for m in BOX_RE.finditer(out or '')]

def numeric_values(text):
    vals=[]
    for m in INT_RE.finditer(text or ''):
        vals.append({'raw':m.group(0), 'norm':norm_num(m.group(0)), 'start':m.start(), 'end':m.end()})
    return vals

def marker_windows(out, width=260):
    out=out or ''
    wins=[]
    for m in ANSWER_MARKER_RE.finditer(out):
        wins.append({'marker':m.group(0), 'start':m.start(), 'text':out[m.start():m.start()+width]})
    return wins

def final_answer_candidates(out):
    candidates=[]
    for w in marker_windows(out):
        nums=numeric_values(w['text'])
        for n in nums[:3]:
            candidates.append({'marker':w['marker'], 'marker_pos':w['start'], 'raw':n['raw'], 'norm':n['norm']})
    for v in boxed_values(out):
        candidates.append({'marker':'boxed', 'marker_pos':None, 'raw':v, 'norm':norm_num(v)})
    # Deduplicate adjacent identical candidates, preserving order.
    compact=[]
    for c in candidates:
        if not compact or compact[-1]['norm'] != c['norm'] or compact[-1]['marker'] != c['marker']:
            compact.append(c)
    return compact

def candidate_flips(cands):
    seq=[c['norm'] for c in cands if c.get('norm') is not None]
    if not seq: return 0
    flips=0
    prev=seq[0]
    for x in seq[1:]:
        if x != prev:
            flips += 1
            prev=x
    return flips

def pred_norm(e):
    p=e.get('pred')
    if isinstance(p, list) and p:
        return norm_num(p[0])
    return norm_num(p)

def classify(feat):
    if feat['eval_correct']:
        if feat['gt_boxed'] or feat['gt_after_answer_marker'] or feat['gt_in_final_zone']:
            return 'clean_correct'
        return 'correct_unboxed'
    if feat['gt_boxed']:
        return 'evaluator_missed_boxed_gt'
    if not feat['gt_anywhere']:
        return 'no_gt_seen'
    if feat['gt_after_answer_marker']:
        if feat['candidate_flips'] > 0 or (feat['final_pred_norm'] and feat['final_pred_norm'] != feat['gt_norm']):
            return 'answer_marker_drift'
        return 'latent_answer_marker_not_closed'
    if feat['gt_in_final_zone']:
        return 'latent_final_zone_not_closed'
    return 'latent_intermediate_only'

def symbol(label):
    return {
        'clean_correct':'✓',
        'correct_unboxed':'u',
        'evaluator_missed_boxed_gt':'B',
        'answer_marker_drift':'D',
        'latent_answer_marker_not_closed':'A',
        'latent_final_zone_not_closed':'F',
        'latent_intermediate_only':'~',
        'no_gt_seen':'·',
    }.get(label, '?')

def label_class(label):
    if label in ('clean_correct','correct_unboxed'): return 'closed'
    if label in ('answer_marker_drift','latent_answer_marker_not_closed','latent_final_zone_not_closed'): return 'closure_failure'
    if label == 'latent_intermediate_only': return 'discovered_not_retained'
    if label == 'evaluator_missed_boxed_gt': return 'extractor_bug'
    return 'not_discovered'

def make_features(run_id, meta, idx, e, m):
    out=(m.get('output') or '').replace('\r','')
    gt=e.get('gt')
    positions=find_gt_positions(out, gt)
    L=len(out)
    zone_start=max(0, int(L*0.8))
    windows=marker_windows(out)
    cands=final_answer_candidates(out)
    gt_norm=norm_num(gt)
    box_vals=boxed_values(out)
    gt_boxed=any(norm_num(v)==gt_norm for v in box_vals)
    gt_after_marker=False
    for w in windows:
        if find_gt_positions(w['text'], gt):
            gt_after_marker=True
            break
    feat={
        'run_id':run_id,
        'method':meta['method'],
        'budget':meta['budget'],
        'max_new_tokens':meta['max_new_tokens'],
        'dataset':'aime24',
        'model':'Qwen3-8B',
        'idx':idx,
        'gt_raw':gt,
        'gt_norm':gt_norm,
        'eval_pred_raw':e.get('pred'),
        'final_pred_norm':pred_norm(e),
        'eval_correct':score_ok(e),
        'output_chars':L,
        'gt_occurrences':len(positions),
        'gt_anywhere':bool(positions),
        'first_gt_char':positions[0][0] if positions else None,
        'last_gt_char':positions[-1][0] if positions else None,
        'first_gt_frac':round(positions[0][0]/L,4) if positions and L else None,
        'last_gt_frac':round(positions[-1][0]/L,4) if positions and L else None,
        'gt_in_final_zone':any(p[0] >= zone_start for p in positions),
        'gt_after_answer_marker':gt_after_marker,
        'boxed_values_tail':box_vals[-5:],
        'num_boxed_candidates':len(box_vals),
        'gt_boxed':gt_boxed,
        'final_answer_candidates_tail':cands[-8:],
        'num_answer_candidates':len(cands),
        'candidate_flips':candidate_flips(cands),
        'tail_500':out[-500:].replace('\n',' / '),
    }
    feat['pathology_label']=classify(feat)
    feat['pathology_class']=label_class(feat['pathology_label'])
    feat['symbol']=symbol(feat['pathology_label'])
    return feat

def table_line(cols):
    return '| ' + ' | '.join(str(c) for c in cols) + ' |'

def pct(n,d):
    return f'{100*n/d:.1f}' if d else '0.0'

def write_report(features, out_md):
    by_run=defaultdict(list)
    by_idx=defaultdict(dict)
    for f in features:
        by_run[f['run_id']].append(f)
        by_idx[f['idx']][f['run_id']]=f

    lines=[]
    lines.append('# KVFidelity trace v0 — AIME24 n=30')
    lines.append('')
    lines.append('Generated from saved CASK outputs/eval JSONL. No new GPU generation.')
    lines.append('')
    lines.append('## Legend')
    lines.append('')
    lines.append('- `✓` clean/candidate-corroborated correct')
    lines.append('- `u` correct but unboxed/weak closure')
    lines.append('- `D` answer-marker drift: GT appears in answer-like region but final differs')
    lines.append('- `A` latent answer after marker but not closed')
    lines.append('- `F` GT appears in final zone but not closed')
    lines.append('- `~` GT appears only as intermediate/early mention')
    lines.append('- `B` clean boxed GT missed by evaluator')
    lines.append('- `·` GT not observed in output')
    lines.append('')

    lines.append('## Discovery / Retention / Closure summary')
    lines.append('')
    lines.append(table_line(['run','method','budget','mnt','closure correct','discovery GT_anywhere','retention GT_final/marker','drift candidates','median chars','labels']))
    lines.append(table_line(['---','---','---:','---:','---:','---:','---:','---:','---:','---']))
    for r in ORDER:
        rows=by_run[r]
        n=len(rows)
        correct=sum(x['eval_correct'] for x in rows)
        discovery=sum(x['gt_anywhere'] for x in rows)
        retention=sum((x['gt_in_final_zone'] or x['gt_after_answer_marker'] or x['gt_boxed']) for x in rows)
        drift=sum(x['candidate_flips'] > 0 for x in rows)
        med=int(statistics.median([x['output_chars'] for x in rows]))
        labels=Counter(x['pathology_label'] for x in rows)
        label_txt=', '.join(f'{k}:{v}' for k,v in labels.most_common())
        meta=RUNS[r]
        lines.append(table_line([r, meta['method'], meta['budget'], meta['max_new_tokens'], f'{correct}/{n} ({pct(correct,n)}%)', f'{discovery}/{n} ({pct(discovery,n)}%)', f'{retention}/{n} ({pct(retention,n)}%)', f'{drift}/{n}', med, label_txt]))

    lines.append('')
    lines.append('## Topology matrix')
    lines.append('')
    lines.append(table_line(['idx','gt'] + ORDER))
    lines.append(table_line(['---:','---'] + ['---']*len(ORDER)))
    for idx in sorted(by_idx):
        gt=by_idx[idx][ORDER[0]]['gt_norm']
        lines.append(table_line([idx, gt] + [by_idx[idx][r]['symbol'] for r in ORDER]))

    lines.append('')
    lines.append('## 2048 → 4096 transition, b256 only')
    lines.append('')
    pairs=[('fullkv_2048','fullkv_4096'),('tri_b256_2048','tri_b256_4096'),('cask_b256_2048','cask_b256_4096')]
    for a,b in pairs:
        trans=Counter()
        examples=defaultdict(list)
        for idx in sorted(by_idx):
            la=by_idx[idx][a]['pathology_class']
            lb=by_idx[idx][b]['pathology_class']
            key=f'{la} → {lb}'
            trans[key]+=1
            if len(examples[key]) < 6:
                examples[key].append(idx)
        lines.append(f'### {a} → {b}')
        lines.append('')
        lines.append(table_line(['transition','count','example idxs']))
        lines.append(table_line(['---','---:','---']))
        for k,v in trans.most_common():
            lines.append(table_line([k,v, ', '.join(map(str,examples[k]))]))
        lines.append('')

    lines.append('## Important case strips')
    lines.append('')
    for idx in IMPORTANT_IDXS:
        lines.append(f'### idx {idx} — GT {by_idx[idx][ORDER[0]]["gt_norm"]}')
        lines.append('')
        lines.append(table_line(['run','sym','pred','first_gt','last_gt','cands','flips','tail']))
        lines.append(table_line(['---','---','---','---:','---:','---','---:','---']))
        for r in ORDER:
            f=by_idx[idx][r]
            cand='; '.join([str(c.get('norm')) for c in f['final_answer_candidates_tail'][-4:]])
            lines.append(table_line([r, f['symbol'], f['final_pred_norm'], f['first_gt_frac'], f['last_gt_frac'], cand, f['candidate_flips'], f['tail_500'].replace('|','¦')[:240]]))
        lines.append('')

    lines.append('## Interpretation v0')
    lines.append('')
    lines.append('The useful object is not a leaderboard. It is a trajectory atlas: whether the correct answer is discovered, retained, and closed as a final commitment. In this slice, no failed run contains a clean boxed GT, so the failure is usually not a parser missing a pristine answer. It is a failure to stabilize or commit to the answer, often after latent discovery.')
    lines.append('')
    lines.append('Suggested KVFidelity axes:')
    lines.append('')
    lines.append('1. **Discovery Fidelity**: GT appears anywhere.')
    lines.append('2. **Retention Fidelity**: GT appears in final zone or answer-marker context.')
    lines.append('3. **Closure Fidelity**: evaluator accepts / clean final answer.')
    lines.append('4. **Contamination/Drift flags**: candidate flips, multiple answer candidates, GT present but final differs.')

    with open(out_md, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--out-jsonl', required=True)
    ap.add_argument('--out-md', required=True)
    args=ap.parse_args()
    features=[]
    for run_id,meta in RUNS.items():
        ev=load_jsonl(meta['eval'])
        mg=load_jsonl(meta['merged'])
        for idx,(e,m) in enumerate(zip(ev,mg)):
            features.append(make_features(run_id, meta, idx, e, m))
    with open(args.out_jsonl, 'w', encoding='utf-8') as f:
        for row in features:
            f.write(json.dumps(row, ensure_ascii=False) + '\n')
    write_report(features, args.out_md)
    print(json.dumps({'rows':len(features),'jsonl':args.out_jsonl,'md':args.out_md}, indent=2))

if __name__ == '__main__':
    main()
