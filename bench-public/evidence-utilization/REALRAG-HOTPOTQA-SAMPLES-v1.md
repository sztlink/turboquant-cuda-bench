# RealRAG HotpotQA sample pack v1

This is an audit sample pack for the RealRAG HotpotQA R2 rank-curve run. It contains 200 deterministic examples from the public HotpotQA dev distractor dataset.

Boundary: samples expose answer-side closure labels, predictions, support ranks, and context titles. They do not prove attention or internal evidence use. Full paragraph text is not duplicated here because HotpotQA is public and the benchmark receipts already include per-condition records.

Source run:

```txt
bench/evidence-utilization-realrag-hotpotqa-r2-rankcurve-2026-05-20/records.jsonl
```

Machine-readable file:

```txt
REALRAG-HOTPOTQA-SAMPLES-v1.jsonl
```

## Selection buckets

| bucket | count | why included |
|---|---:|---|
| rank1_only_or_middle_fail | 35 | rank_1 closes while middle placements fail |
| last_recency_recovery | 35 | rank_last closes while middle placements fail |
| middle_burial_rank1_and_last_win | 25 | beginning and end close, middle fails |
| all_support_positions_close | 20 | all support-present placements close |
| all_support_positions_fail | 25 | all support-present placements fail |
| no_support_leak | 20 | no_support closes, useful for leakage/memorization audit |
| rank3_only_or_middle_anomaly | 20 | rank_3 closes while rank_1 fails |
| deterministic_fill | 20 | deterministic fill to 200 samples |

## JSONL schema

```json
{
  "qid": "HotpotQA id",
  "question": "question text",
  "gold_answer": "gold answer",
  "conditions": {
    "rank_1": {
      "prediction": "model answer",
      "closure": 0,
      "em": 0,
      "f1": 0.0,
      "contains_answer": 0,
      "support_rank_min": 1,
      "context_titles": ["..."]
    }
  }
}
```

## First 10 samples

### 1. 5a70f9335542994082a3e46a — rank1_only_or_middle_fail

**Question:** Which magazine is published more in a year, Essence or Alt for Damerne?

**Gold:** ALT for Damerne

| condition | closure | F1 | support rank | prediction |
|---|---:|---:|---:|---|
| rank_1 | 1 | 1.00 | 1 | Alt for Damerne |
| rank_3 | 0 | 0.00 | 3 | Essence |
| rank_5 | 0 | 0.00 | 5 | Essence |
| rank_8 | 0 | 0.00 | 8 | Essence |
| rank_last | 0 | 0.00 | 9 | Essence |
| no_support | 0 | 0.00 | none | Essence |

### 2. 5a71166d5542994082a3e576 — rank1_only_or_middle_fail

**Question:** Which battle occurred first, the Battle of Manila or the Battle of Guam?

**Gold:** Battle of Guam

| condition | closure | F1 | support rank | prediction |
|---|---:|---:|---:|---|
| rank_1 | 1 | 0.86 | 1 | Battle of Guam (1944) |
| rank_3 | 0 | 0.57 | 3 | Battle of Manila (1574) |
| rank_5 | 0 | 0.67 | 5 | Battle of Manila |
| rank_8 | 0 | 0.57 | 8 | Battle of Manila (1574) |
| rank_last | 0 | 0.67 | 9 | Battle of Manila |
| no_support | 0 | 0.67 | none | Battle of Manila |

### 3. 5a7119f75542994082a3e58e — rank1_only_or_middle_fail

**Question:** When was the composer of "Persian Surgery Dervishes" born?

**Gold:** June 24, 1935

| condition | closure | F1 | support rank | prediction |
|---|---:|---:|---:|---|
| rank_1 | 1 | 1.00 | 1 | June 24, 1935 |
| rank_3 | 0 | 0.00 | 3 | UNKNOWN |
| rank_5 | 0 | 0.00 | 5 | UNKNOWN |
| rank_8 | 0 | 0.00 | 8 | UNKNOWN |
| rank_last | 0 | 0.00 | 9 | UNKNOWN |
| no_support | 0 | 0.00 | none | UNKNOWN |

### 4. 5a711bb55542994082a3e597 — rank1_only_or_middle_fail

**Question:** Steven Covey, the father of Sean Covey, wrote what similar sounding title to The 7 Habits of Highly Effective Teens?

**Gold:** The 7 Habits of Highly Effective People

| condition | closure | F1 | support rank | prediction |
|---|---:|---:|---:|---|
| rank_1 | 1 | 1.00 | 1 | The 7 Habits of Highly Effective People |
| rank_3 | 0 | 0.00 | 3 | The 8th Habit |
| rank_5 | 0 | 0.00 | 5 | The 8th Habit |
| rank_8 | 0 | 0.00 | 8 | The 8th Habit |
| rank_last | 0 | 0.00 | 9 | The 8th Habit |
| no_support | 0 | 0.00 | none | The 8th Habit |

### 5. 5a71231a5542994082a3e5c4 — rank1_only_or_middle_fail

**Question:** What edible, juicy fruit is grown on a deciduous tree called 'pesco' in Italian?

**Gold:** peach

| condition | closure | F1 | support rank | prediction |
|---|---:|---:|---:|---|
| rank_1 | 1 | 1.00 | 1 | Peach |
| rank_3 | 0 | 0.00 | 3 | UNKNOWN |
| rank_5 | 0 | 0.00 | 5 | UNKNOWN |
| rank_8 | 0 | 0.00 | 8 | UNKNOWN |
| rank_last | 0 | 0.00 | 9 | UNKNOWN |
| no_support | 0 | 0.00 | none | UNKNOWN |

### 6. 5a7125165542994082a3e5d0 — rank1_only_or_middle_fail

**Question:** Which composer was a French Romantic composer in the 1800's, Hector Berlioz or Gaetano Donizetti?

**Gold:** Louis-Hector Berlioz

| condition | closure | F1 | support rank | prediction |
|---|---:|---:|---:|---|
| rank_1 | 1 | 0.80 | 1 | Hector Berlioz |
| rank_3 | 0 | 0.00 | 3 | Gaetano Donizetti |
| rank_5 | 0 | 0.00 | 5 | Gaetano Donizetti |
| rank_8 | 0 | 0.00 | 8 | Gaetano Donizetti |
| rank_last | 0 | 0.00 | 9 | Gaetano Donizetti |
| no_support | 0 | 0.00 | none | Gaetano Donizetti |

### 7. 5a7128b05542994082a3e5f2 — rank1_only_or_middle_fail

**Question:** Which film was released first, Laura's Star or Wonder Woman?

**Gold:** Laura's Star

| condition | closure | F1 | support rank | prediction |
|---|---:|---:|---:|---|
| rank_1 | 1 | 1.00 | 1 | Laura's Star |
| rank_3 | 0 | 0.00 | 3 | UNKNOWN |
| rank_5 | 0 | 0.00 | 5 | UNKNOWN |
| rank_8 | 0 | 0.00 | 8 | UNKNOWN |
| rank_last | 0 | 0.00 | 9 | UNKNOWN |
| no_support | 0 | 0.00 | none | UNKNOWN |

### 8. 5a712beb5542994082a3e61c — rank1_only_or_middle_fail

**Question:** What Golden Globe Award actor starred in the film Little Fugitive? 

**Gold:** Peter Dinklage

| condition | closure | F1 | support rank | prediction |
|---|---:|---:|---:|---|
| rank_1 | 1 | 1.00 | 1 | Peter Dinklage |
| rank_3 | 0 | 0.00 | 3 | UNKNOWN |
| rank_5 | 0 | 0.00 | 5 | UNKNOWN |
| rank_8 | 0 | 0.00 | 8 | UNKNOWN |
| rank_last | 0 | 0.00 | 9 | UNKNOWN |
| no_support | 0 | 0.00 | none | UNKNOWN |

### 9. 5a713fb15542994082a3e6f0 — rank1_only_or_middle_fail

**Question:** Did the board game San Marco or About Time come out first?

**Gold:** San Marco

| condition | closure | F1 | support rank | prediction |
|---|---:|---:|---:|---|
| rank_1 | 1 | 0.57 | 1 | San Marco (board game) UNKNOWN |
| rank_3 | 0 | 0.00 | 3 | UNKNOWN |
| rank_5 | 0 | 0.00 | 5 | UNKNOWN |
| rank_8 | 0 | 0.00 | 8 | UNKNOWN |
| rank_last | 1 | 1.00 | 9 | San Marco |
| no_support | 0 | 0.00 | none | UNKNOWN |

### 10. 5a71419f5542994082a3e70d — rank1_only_or_middle_fail

**Question:** Riema Juhani Karppinen won the silver medal at what event held outside of Munich, Germany?

**Gold:** 1981 World Rowing Championships

| condition | closure | F1 | support rank | prediction |
|---|---:|---:|---:|---|
| rank_1 | 1 | 1.00 | 1 | 1981 World Rowing Championships |
| rank_3 | 0 | 0.00 | 3 | UNKNOWN |
| rank_5 | 0 | 0.00 | 5 | UNKNOWN |
| rank_8 | 0 | 0.00 | 8 | UNKNOWN |
| rank_last | 1 | 1.00 | 9 | 1981 World Rowing Championships |
| no_support | 0 | 0.00 | none | UNKNOWN |

