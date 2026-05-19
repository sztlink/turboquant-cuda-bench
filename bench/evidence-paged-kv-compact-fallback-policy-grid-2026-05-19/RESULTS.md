# Evidence-Paged KV Phase 2c.11 — compact fallback policy grid — 2026-05-19

> Offline broader grid for sequence-length guard + flagged-head threshold. No serving mutation.

## Boundary

```txt
M values: [4096, 8192, 12288, 16384, 24576, 32768, 49152, 65536]
requested flagged heads: [0, 7, 14, 21, 28]
probe_local_top: 8
fallback_local_top: 32
global_k: 32
serving: no
```

## Results by case

| M | observed flags | flag rate | max abs err | compact p50 ms | exact p50 ms | compact/exact | p50 best |
|---:|---:|---:|---:|---:|---:|---:|---|
| 4096 | 6 | 0.214 | 0.000160 | 0.1500 | 0.1430 | 1.049 | exact_only |
| 4096 | 10 | 0.357 | 0.000122 | 0.1423 | 0.1109 | 1.284 | exact_only |
| 4096 | 18 | 0.643 | 0.000152 | 0.1556 | 0.1116 | 1.394 | exact_only |
| 4096 | 24 | 0.857 | 0.000129 | 0.1639 | 0.1093 | 1.500 | exact_only |
| 4096 | 28 | 1.000 | 0.000175 | 0.1608 | 0.1075 | 1.496 | exact_only |
| 8192 | 0 | 0.000 | 0.000122 | 0.1618 | 0.1782 | 0.908 | compact_fallback |
| 8192 | 7 | 0.250 | 0.000145 | 0.1439 | 0.1701 | 0.846 | compact_fallback |
| 8192 | 14 | 0.500 | 0.000160 | 0.1567 | 0.1706 | 0.918 | compact_fallback |
| 8192 | 21 | 0.750 | 0.000161 | 0.1915 | 0.1740 | 1.100 | exact_only |
| 8192 | 28 | 1.000 | 0.000137 | 0.2384 | 0.1747 | 1.364 | exact_only |
| 12288 | 0 | 0.000 | 0.000137 | 0.2620 | 1.1213 | 0.234 | compact_fallback |
| 12288 | 7 | 0.250 | 0.000145 | 0.8332 | 1.1363 | 0.733 | compact_fallback |
| 12288 | 14 | 0.500 | 0.000130 | 0.7045 | 0.7885 | 0.894 | compact_fallback |
| 12288 | 21 | 0.750 | 0.000145 | 0.8253 | 0.7905 | 1.044 | exact_only |
| 12288 | 28 | 1.000 | 0.000138 | 1.0486 | 0.7946 | 1.320 | exact_only |
| 16384 | 0 | 0.000 | 0.000168 | 0.2048 | 0.2837 | 0.722 | compact_fallback |
| 16384 | 7 | 0.250 | 0.000137 | 0.1903 | 0.2798 | 0.680 | compact_fallback |
| 16384 | 14 | 0.500 | 0.000160 | 0.2520 | 0.2896 | 0.870 | compact_fallback |
| 16384 | 21 | 0.750 | 0.000129 | 0.3116 | 0.2885 | 1.080 | exact_only |
| 16384 | 28 | 1.000 | 0.000130 | 0.3574 | 0.2816 | 1.269 | exact_only |
| 24576 | 0 | 0.000 | 0.000114 | 0.8821 | 3.7048 | 0.238 | compact_fallback |
| 24576 | 7 | 0.250 | 0.000152 | 2.4262 | 3.7273 | 0.651 | compact_fallback |
| 24576 | 14 | 0.500 | 0.000160 | 3.1508 | 3.4601 | 0.911 | compact_fallback |
| 24576 | 21 | 0.750 | 0.000137 | 3.7151 | 0.4020 | 9.242 | exact_only |
| 24576 | 28 | 1.000 | 0.000136 | 0.5069 | 0.3994 | 1.269 | exact_only |
| 32768 | 0 | 0.000 | 0.000114 | 0.2068 | 0.5147 | 0.402 | compact_fallback |
| 32768 | 7 | 0.250 | 0.000153 | 0.3162 | 0.5138 | 0.615 | compact_fallback |
| 32768 | 14 | 0.500 | 0.000130 | 0.4157 | 0.5158 | 0.806 | compact_fallback |
| 32768 | 21 | 0.750 | 0.000137 | 0.5417 | 0.5139 | 1.054 | exact_only |
| 32768 | 28 | 1.000 | 0.000146 | 0.6062 | 0.4751 | 1.276 | exact_only |
| 49152 | 0 | 0.000 | 0.000130 | 1.5367 | 7.0062 | 0.219 | compact_fallback |
| 49152 | 7 | 0.250 | 0.000122 | 4.4718 | 6.9404 | 0.644 | compact_fallback |
| 49152 | 14 | 0.500 | 0.000122 | 0.6042 | 0.7383 | 0.818 | compact_fallback |
| 49152 | 21 | 0.750 | 0.000152 | 0.7702 | 0.7380 | 1.044 | exact_only |
| 49152 | 28 | 1.000 | 0.000129 | 0.9310 | 0.7363 | 1.265 | exact_only |
| 65536 | 0 | 0.000 | 0.000130 | 0.3424 | 0.9554 | 0.358 | compact_fallback |
| 65536 | 7 | 0.250 | 0.000122 | 0.5161 | 0.8884 | 0.581 | compact_fallback |
| 65536 | 14 | 0.500 | 0.000145 | 0.7311 | 0.8868 | 0.824 | compact_fallback |
| 65536 | 21 | 0.750 | 0.000138 | 0.9317 | 0.8849 | 1.053 | exact_only |
| 65536 | 28 | 1.000 | 0.000137 | 1.1278 | 0.8858 | 1.273 | exact_only |

## Policy candidates

| seq guard | flag threshold | accuracy | matches | compact cases | mean regret | max regret |
|---:|---:|---:|---:|---:|---:|---:|
| 4096 | 0.625 | 1.000 | 40/40 | 21 | 0.000 | 0.000 |
| 4096 | 0.750 | 1.000 | 40/40 | 21 | 0.000 | 0.000 |
| 0 | 0.625 | 0.950 | 38/40 | 23 | 0.008 | 0.284 |
| 8192 | 0.625 | 0.925 | 37/40 | 18 | 0.009 | 0.182 |
| 8192 | 0.750 | 0.925 | 37/40 | 18 | 0.009 | 0.182 |
| 0 | 0.750 | 0.925 | 37/40 | 24 | 0.018 | 0.394 |
| 12288 | 0.625 | 0.850 | 34/40 | 15 | 0.103 | 3.280 |
| 12288 | 0.750 | 0.850 | 34/40 | 15 | 0.103 | 3.280 |
| 4096 | 0.500 | 0.825 | 33/40 | 14 | 0.028 | 0.241 |
| 4096 | 0.875 | 0.825 | 33/40 | 28 | 0.215 | 8.242 |

## Readout

- best policy in this grid: seq_guard=4096, flag_threshold=0.625;
- `flag_threshold=0.625` and `0.750` are equivalent on this sampled grid because observed rates jump from 0.50 to 0.75;
- best policy accuracy: 40/40 synthetic cases;
- timing is shape-sensitive and some non-power-of-two lengths show large p50 swings, so this is a policy-direction receipt, not a stable latency table;
- this is an offline policy heuristic over synthetic fixtures, not a serving result;
- next useful step is to write a runtime integration design doc, not install it.

Decision:

```txt
Candidate policy v1:
  if M <= 4096: exact-only / compact disabled
  else if flagged_head_rate >= 0.75: exact-only
  else: compact fallback

The 0.625 threshold also fits this grid, but 0.75 preserves the previous boundary and is equivalent for sampled rates.
Do not install into serving. Next: runtime integration design doc with invariants, telemetry, kill switch, and exact-restore requirements.
```

## Non-claims

- Not production attention.
- Not serving.
- Not a serving speedup claim.
- Not model-quality or evidence-utilization evidence.
