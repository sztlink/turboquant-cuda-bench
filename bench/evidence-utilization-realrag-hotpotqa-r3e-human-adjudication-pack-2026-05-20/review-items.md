# RealRAG HotpotQA R3E — human/independent adjudication packet

Status: **review packet generated; labels unreviewed**

## Boundary

- review packet only; no human labels have been assigned.
- local judge labels are included as triage hints, not ground truth.
- designed for human or independent judge adjudication before broader claims.
- do not treat R3E as additional benchmark evidence until reviewed.

## Label schema

- `correct` — prediction is semantically equivalent to the gold answer.
- `partial` — prediction is related but incomplete/overbroad/underspecified.
- `wrong` — prediction is not the answer.
- `ambiguous_dataset` — question/gold/prediction conflict is genuinely ambiguous or alias-sensitive.
- `metric_false_positive` — automatic closure counted it closed but reviewer says wrong.
- `metric_false_negative` — automatic closure missed an acceptable answer.
- `prior_knowledge_or_leakage` — no-support condition answered correctly/plausibly without support in prompt.

## Category counts

| category | selected | available |
|---|---:|---:|
| metric_closed_judge_negative | 4 | 4 |
| metric_open_judge_positive | 20 | 53 |
| no_support_metric_closed | 0 | 0 |
| no_support_prior_or_leakage | 20 | 34 |
| bge_wrong_support_present | 20 | 70 |
| oracle_wrong_support_first | 20 | 65 |
| bm25_wrong_support_present | 20 | 84 |
| metric_closed_judge_positive_control | 20 | 239 |
| metric_open_judge_negative_control | 20 | 135 |

## Review files

- `review-items.jsonl` — canonical machine-readable packet with blank human labels.
- `review-items.csv` — spreadsheet-friendly view with blank human labels.
- `review-items.md` — readable packet for manual review.

## Preview

### r3e-0001 — metric_closed_judge_negative

- qid: `5ade74285542992fa25da78c` / condition: `no_support`
- question: Of the two genuses Gaillardia and Browningia which one is a genus of cacti?
- gold: `Browningia`
- prediction: `Browningia UNKNOWN`
- metric closure: `1`; local judge: `wrong` — Prediction is incorrect and includes UNKNOWN.
- human_label: **UNREVIEWED**

### r3e-0002 — metric_closed_judge_negative

- qid: `5ab2123155429970612095b9` / condition: `bm25_top10`
- question: What did Mustafa Kemal Atatürk's residence become once it became Atatürk Museum Mansion?  
- gold: `museum`
- prediction: `Atatürk Museum Mansion`
- metric closure: `1`; local judge: `wrong` — Prediction is not semantically equivalent to the gold answer.
- human_label: **UNREVIEWED**

### r3e-0003 — metric_closed_judge_negative

- qid: `5a83ab355542990548d0b218` / condition: `no_support`
- question: Who was a higher ranked tennis player: Paola Suárez or Michael Venus?
- gold: `Paola Suárez`
- prediction: `Michael Venus was not mentioned in the context, but based on the information provided, Paola Suárez had higher rankings reaching up to world number 12`
- metric closure: `1`; local judge: `wrong` — Prediction states Michael Venus was not mentioned, which contradicts the gold answer.
- human_label: **UNREVIEWED**

### r3e-0004 — metric_closed_judge_negative

- qid: `5ab2123155429970612095b9` / condition: `oracle_first`
- question: What did Mustafa Kemal Atatürk's residence become once it became Atatürk Museum Mansion?  
- gold: `museum`
- prediction: `Atatürk Museum Mansion`
- metric closure: `1`; local judge: `wrong` — Prediction is not semantically equivalent to the gold answer.
- human_label: **UNREVIEWED**

### r3e-0005 — metric_open_judge_positive

- qid: `5a7f7b365542992097ad2f80` / condition: `bge_rerank_top10`
- question: Did the Beaulieu Mine or the McIntyre Mines yield gold and copper?
- gold: `The McIntyre also yielded a considerable amount of copper`
- prediction: `McIntyre Mines yielded gold and copper. UNKNOWN for Beaulieu Mine.`
- metric closure: `0`; local judge: `partial` — Prediction is correct for McIntyre Mines but unknown for Beaulieu Mine.
- human_label: **UNREVIEWED**

### r3e-0006 — metric_open_judge_positive

- qid: `5a835e215542992ef85e2296` / condition: `bm25_top10`
- question: Between Pine and Butea, which genus has the greatest number of species?
- gold: `"Pinus"`
- prediction: `Pine`
- metric closure: `0`; local judge: `correct` — Prediction matches gold answer 'Pinus'.
- human_label: **UNREVIEWED**

### r3e-0007 — metric_open_judge_positive

- qid: `5abbda84554299642a094b5b` / condition: `bm25_top10`
- question: What is the ratio of flow velocity past a boundary to the local speed of sound for a Saab JAS 39 Gripen?
- gold: `2`
- prediction: `Mach number`
- metric closure: `0`; local judge: `correct` — Mach number is semantically equivalent to the gold answer 2.
- human_label: **UNREVIEWED**

### r3e-0008 — metric_open_judge_positive

- qid: `5a8a5c9855429970aeb702be` / condition: `bge_rerank_top10`
- question: Why I Write was penned by which English novelist and critic?
- gold: `Eric Arthur Blair`
- prediction: `George Orwell`
- metric closure: `0`; local judge: `correct` — Prediction matches the gold answer, though using the full name is preferred.
- human_label: **UNREVIEWED**

### r3e-0009 — metric_open_judge_positive

- qid: `5adf73a45542992d7e9f9378` / condition: `oracle_first`
- question: Philip Despencer's brother was a favorite of which king who was deposed in January of 1327?
- gold: `King Edward II`
- prediction: `Edward II of England`
- metric closure: `0`; local judge: `correct` — Prediction is semantically equivalent to the gold answer.
- human_label: **UNREVIEWED**

### r3e-0010 — metric_open_judge_positive

- qid: `5a8f24cc55429924144829e7` / condition: `bm25_top10`
- question: Andrei Ivanovich Gorchakov commanded the 1st Infanty Corps in what major engagement of the Napoleonic Wars?
- gold: `Battle of Dresden`
- prediction: `Dresden`
- metric closure: `0`; local judge: `partial` — Prediction 'Dresden' is related but incomplete as it does not specify the battle.
- human_label: **UNREVIEWED**

### r3e-0011 — metric_open_judge_positive

- qid: `5ae5305b5542990ba0bbb1f5` / condition: `oracle_first`
- question: When would be the professional wrestling video game release in which Mark Henry will appear as "legend"?
- gold: `October 17, 2017`
- prediction: `WWE 2K18`
- metric closure: `0`; local judge: `partial` — WWE 2K18 is the correct game, but the prediction lacks the release date.
- human_label: **UNREVIEWED**

### r3e-0012 — metric_open_judge_positive

- qid: `5a835e215542992ef85e2296` / condition: `bge_rerank_top10`
- question: Between Pine and Butea, which genus has the greatest number of species?
- gold: `"Pinus"`
- prediction: `Pine`
- metric closure: `0`; local judge: `correct` — Prediction matches the gold answer semantically.
- human_label: **UNREVIEWED**

### r3e-0013 — metric_open_judge_positive

- qid: `5a8f24cc55429924144829e7` / condition: `bge_rerank_top10`
- question: Andrei Ivanovich Gorchakov commanded the 1st Infanty Corps in what major engagement of the Napoleonic Wars?
- gold: `Battle of Dresden`
- prediction: `Dresden`
- metric closure: `0`; local judge: `partial` — Prediction is related but incomplete; 'Dresden' is part of the answer but lacks the date and context.
- human_label: **UNREVIEWED**

### r3e-0014 — metric_open_judge_positive

- qid: `5a7137dc5542994082a3e68a` / condition: `oracle_first`
- question: Kevin Wayne Durant was named what ?(An Award initiated following 1952-53 NBA Season?
- gold: `The National Basketball Association's Rookie of the Year`
- prediction: `NBA Rookie of the Year Award`
- metric closure: `0`; local judge: `partial` — Prediction is related but not semantically equivalent to the gold answer.
- human_label: **UNREVIEWED**

### r3e-0015 — metric_open_judge_positive

- qid: `5a7137dc5542994082a3e68a` / condition: `bm25_top10`
- question: Kevin Wayne Durant was named what ?(An Award initiated following 1952-53 NBA Season?
- gold: `The National Basketball Association's Rookie of the Year`
- prediction: `NBA Rookie of the Year Award`
- metric closure: `0`; local judge: `partial` — Prediction is related but incomplete. The full answer includes 'The National Basketball Association's Rookie of the Year', which Kevin Durant did not win.
- human_label: **UNREVIEWED**

### r3e-0016 — metric_open_judge_positive

- qid: `5a81fa59554299676cceb1b0` / condition: `oracle_first`
- question: What type of profession does Jonah Meyerson and Alison Pill have in common?
- gold: `actor`
- prediction: `actress`
- metric closure: `0`; local judge: `partial` — Prediction is a related but different profession.
- human_label: **UNREVIEWED**

### r3e-0017 — metric_open_judge_positive

- qid: `5a8038b55542996402f6a485` / condition: `bge_rerank_top10`
- question: Jacques Sernas, actor in Fugitive in Trieste, was of what nationality?
- gold: `Lithuanian-born French`
- prediction: `French`
- metric closure: `0`; local judge: `partial` — Prediction is related but missing the 'Lithuanian-born' part.
- human_label: **UNREVIEWED**

### r3e-0018 — metric_open_judge_positive

- qid: `5abd724b55429924427fcfd9` / condition: `bm25_top10`
- question: Is Ashland, New Hampshire or Plymouth Regional High School located near the Scribner-Fellows State Forest?
- gold: `Ashland is home to Scribner-Fellows State Forest`
- prediction: `Scribner-Fellows State Forest is located near Ashland, New Hampshire, not Plymouth Regional High School in New Hampshire. Therefore, the answer is`
- metric closure: `0`; local judge: `partial` — Prediction is related but does not match the gold answer.
- human_label: **UNREVIEWED**

### r3e-0019 — metric_open_judge_positive

- qid: `5a859a755542992a431d1b6d` / condition: `oracle_first`
- question: Who was considered more iconic, Charlie Chaplin or Bruce Bilson?
- gold: `Charles Spencer "Charlie" Chaplin`
- prediction: `Charlie Chaplin`
- metric closure: `0`; local judge: `correct` — Prediction matches the gold answer exactly.
- human_label: **UNREVIEWED**

### r3e-0020 — metric_open_judge_positive

- qid: `5a859a755542992a431d1b6d` / condition: `bge_rerank_top10`
- question: Who was considered more iconic, Charlie Chaplin or Bruce Bilson?
- gold: `Charles Spencer "Charlie" Chaplin`
- prediction: `Charlie Chaplin`
- metric closure: `0`; local judge: `correct` — Prediction matches gold answer.
- human_label: **UNREVIEWED**

