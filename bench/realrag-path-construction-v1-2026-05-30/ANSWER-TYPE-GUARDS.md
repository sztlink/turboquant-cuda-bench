# Answer-type and relation guards

## Status

Implemented as a guarded prompt option in:

```txt
07-scripts/vllm-hook/epkv-entity-hop-retrieval.py
```

Flag:

```txt
--include-guarded-path
```

When enabled, the script adds a third condition:

```txt
entity_hop_path_guarded
```

This condition uses the same retrieved documents and candidate graph as `entity_hop_path_prompt`. Only the prompt contract changes.

## Guard families

### 1. Answer-type contract

Infer expected answer type from the question surface:

```txt
when/date/born/died -> date or year
nationality -> nationality/demonym
which country/from -> country
where/place/graduated -> place or institution
who/spouse/father/mother/director/performer/composer -> person or organization
```

Purpose:

```txt
avoid answering a person when the question asks for a place
avoid answering a place when the question asks for a person
avoid generic labels like Place of birth as final answers
```

### 2. Attribute-owner guard

Trigger:

```txt
question asks an attribute of an owner entity
```

Examples:

```txt
place of birth of X's father
nationality of the director of film Y
date of death of Z's mother
where the performer of song S was born
```

Rule:

```txt
first resolve the owner entity
then answer that owner's requested attribute
never answer the owner itself or the generic attribute label
```

### 3. Relation-depth guard

Trigger:

```txt
father
mother
grandfather
grandmother
paternal
maternal
```

Rule:

```txt
grandparent requires parent-of-parent
parent requires direct parent
spouse requires requested spouse
```

Purpose:

```txt
avoid father vs paternal grandfather drift
avoid spouse vs person-itself drift
avoid same-family neighbor selection
```

### 4. Generic-title guard

Trigger:

```txt
selected titles include generic ontology/document titles
```

Examples:

```txt
Place of birth
Place of origin
The Singer
The Child
The Feature
Story
Model
The General
```

Rule:

```txt
generic titles are evidence hints, not final answers
```

### 5. Same-neighborhood guard

Trigger:

```txt
many selected titles share family, dynasty, surname, or nobility tokens
```

Rule:

```txt
require direct evidence tying the exact relation target
not just a nearby family or title neighbor
```

### 6. Media-chain guard

Trigger:

```txt
film/song plus performer/director/composer
```

Rule:

```txt
resolve exact media work
then requested relation
then final attribute
```

## Next test shape

Do not run this without `[CONFIRMAR:INFRA]` because it calls vLLM.

Recommended command shape:

```bash
python3 07-scripts/vllm-hook/epkv-entity-hop-retrieval.py \
  --out-dir bench/realrag-path-construction-v1-2026-05-30/guarded-path-offset1500-n100 \
  --limit 100 \
  --offset 1500 \
  --top-k 10 \
  --bm25-first 8 \
  --seed-top 0 \
  --second-per-mention 0 \
  --max-seed-expansions 4 \
  --max-doc-mentions 3 \
  --pool-limit 80 \
  --skip-bge \
  --skip-extract \
  --disable-ecd \
  --include-guarded-path
```

Compare:

```txt
entity_hop_path_prompt
entity_hop_path_guarded
```

Pass condition:

```txt
losses decrease without erasing wins
F1 delta vs unguarded config0 >= +0.03
UNKNOWN/refusal rate does not dominate
```

## Boundary

This is not a new verifier, not a gold-derived detector, and not an answer override gate.

It is a prompt-level contract test over the same retrieved evidence.
