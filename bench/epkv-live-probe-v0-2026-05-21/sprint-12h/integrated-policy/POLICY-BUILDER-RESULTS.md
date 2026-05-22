# Automatic dynamic policy builder

Added:

```txt
07-scripts/vllm-hook/epkv-build-logit-policy-file.py
```

It builds internal sampler policy JSON directly from a span map:

```txt
span map -> evidence-derived candidate -> candidate first-token ids -> optional scaffold ids -> bias_map
```

Test case:

```txt
span-map-3 / La Leona
candidate-source: auto
candidate: Víctor Bó
candidate ids: [53, 647, 36125]
scaffold suppression: enabled
```

Generated policy:

```json
{
  "enabled": true,
  "candidate": "Víctor Bó",
  "bias_map": {
    "53": 3,
    "647": 3,
    "36125": 3,
    "28715": -10,
    "20205": -10,
    "785": -10,
    "576": -10
  }
}
```

Live internal sampler result, no API `logit_bias`:

```txt
Víctor Bó is the child of the director of film La Leona
```

Restored:

```txt
policy file: {"enabled": false, "tag": "default-off"}
/health OK
```
