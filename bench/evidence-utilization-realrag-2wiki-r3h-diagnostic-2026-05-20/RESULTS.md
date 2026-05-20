# RealRAG 2Wiki R3H — diagnostic analysis

Status: **offline diagnostic complete**

## Boundary

- offline diagnostic only.
- uses answer-side closure and prompt-side support sentence placement.
- does not adjudicate semantic correctness.
- intended to explain R3G non-generalization.

## By condition

| condition | n | closure | EM | F1 | SF sentence recall | SF sentence rank mean | support rank mean |
|---|---:|---:|---:|---:|---:|---:|---:|
| bge_rerank_top10 | 2000 | 33.8% | 27.2% | 32.0% | 100.0% | 1.65 | 1.01 |
| bm25_top10 | 2000 | 33.3% | 26.9% | 31.8% | 100.0% | 2.67 | 1.25 |
| no_support | 2000 | 3.9% | 2.9% | 4.4% | 0.0% | n/a | n/a |
| oracle_first | 2000 | 31.9% | 26.4% | 30.6% | 100.0% | 1.93 | 1.00 |

## Bucket counts

| bucket | count |
|---|---:|
| all_support_conditions_fail | 1059 |
| bge_only_success | 190 |
| bm25_only_success | 181 |
| natural_success_oracle_fail | 302 |
| no_support_success_leakage | 78 |
| oracle_only_success | 85 |

## By 2Wiki question type

| type:condition | n | closure | SF sentence rank mean |
|---|---:|---:|---:|
| bridge_comparison:bge_rerank_top10 | 428 | 33.4% | 1.18 |
| bridge_comparison:bm25_top10 | 428 | 36.7% | 1.46 |
| bridge_comparison:no_support | 428 | 7.5% | n/a |
| bridge_comparison:oracle_first | 428 | 30.4% | 1.11 |
| comparison:bge_rerank_top10 | 475 | 50.5% | 1.21 |
| comparison:bm25_top10 | 475 | 41.7% | 1.72 |
| comparison:no_support | 475 | 8.4% | n/a |
| comparison:oracle_first | 475 | 47.6% | 1.20 |
| compositional:bge_rerank_top10 | 871 | 31.8% | 1.97 |
| compositional:bm25_top10 | 871 | 33.8% | 3.19 |
| compositional:no_support | 871 | 0.5% | n/a |
| compositional:oracle_first | 871 | 30.3% | 2.59 |
| inference:bge_rerank_top10 | 226 | 6.6% | 2.24 |
| inference:bm25_top10 | 226 | 7.5% | 4.97 |
| inference:no_support | 226 | 0.9% | n/a |
| inference:oracle_first | 226 | 8.4% | 2.48 |

## By answer class

| answer_class:condition | n | closure |
|---|---:|---:|
| long_answer:bge_rerank_top10 | 458 | 38.0% |
| long_answer:bm25_top10 | 458 | 39.3% |
| long_answer:no_support | 458 | 6.1% |
| long_answer:oracle_first | 458 | 35.6% |
| mixed_numeric_text:bge_rerank_top10 | 139 | 28.8% |
| mixed_numeric_text:bm25_top10 | 139 | 33.1% |
| mixed_numeric_text:no_support | 139 | 2.9% |
| mixed_numeric_text:oracle_first | 139 | 30.9% |
| numeric_only:bge_rerank_top10 | 24 | 16.7% |
| numeric_only:bm25_top10 | 24 | 12.5% |
| numeric_only:no_support | 24 | 0.0% |
| numeric_only:oracle_first | 24 | 12.5% |
| short_entity:bge_rerank_top10 | 702 | 45.4% |
| short_entity:bm25_top10 | 702 | 42.3% |
| short_entity:no_support | 702 | 5.7% |
| short_entity:oracle_first | 702 | 41.7% |
| single_token_entity:bge_rerank_top10 | 467 | 29.6% |
| single_token_entity:bm25_top10 | 467 | 29.8% |
| single_token_entity:no_support | 467 | 1.3% |
| single_token_entity:oracle_first | 467 | 29.3% |
| yes_no:bge_rerank_top10 | 210 | 0.0% |
| yes_no:bm25_top10 | 210 | 0.5% |
| yes_no:no_support | 210 | 0.0% |
| yes_no:oracle_first | 210 | 0.0% |

## Sample buckets

### all_support_conditions_fail

- **f8b4545a08a111ebbd7aac1f6bf848b6** (bridge_comparison, long_answer) — Which film has the director who died first, Cuando En El Cielo Pasen Lista or The Love Of Jeanne Ney?
  - answer: `Cuando En El Cielo Pasen Lista`
  - bm25_top10: `UNKNOWN` closure=0 rank=1
  - bge_rerank_top10: `UNKNOWN` closure=0 rank=1
  - oracle_first: `The Love of Jeanne Ney` closure=0 rank=1
  - no_support: `The Love Of Jeanne Ney` closure=0 rank=null
- **3124087c084f11ebbd56ac1f6bf848b6** (bridge_comparison, long_answer) — Which film has the director died first, The Luckiest Girl In The World or The Tiger'S Shadow?
  - answer: `The Luckiest Girl In The World`
  - bm25_top10: `Edward Buzzell died first.` closure=0 rank=1
  - bge_rerank_top10: `Edward Buzzell` closure=0 rank=1
  - oracle_first: `Spencer Gordon Bennet` closure=0 rank=1
  - no_support: `UNKNOWN` closure=0 rank=null
- **8d3d54ec0bdd11eba7f7acde48001122** (compositional, single_token_entity) — Where was the place of death of Engelbert I, Count Of Berg's father?
  - answer: `Altenberg`
  - bm25_top10: `Serbia` closure=0 rank=2
  - bge_rerank_top10: `UNKNOWN` closure=0 rank=1
  - oracle_first: `UNKNOWN` closure=0 rank=1
  - no_support: `Castle of Bredevoort` closure=0 rank=null
- **15eac9e60bde11eba7f7acde48001122** (compositional, single_token_entity) — Which country Zita Of Bourbon-Parma's father is from?
  - answer: `Italian`
  - bm25_top10: `UNKNOWN` closure=0 rank=4
  - bge_rerank_top10: `UNKNOWN` closure=0 rank=1
  - oracle_first: `Portugal` closure=0 rank=1
  - no_support: `UNKNOWN` closure=0 rank=null
- **a33c6cf60bdd11eba7f7acde48001122** (compositional, single_token_entity) — What nationality is the composer of song Compass (Mark Vincent Song)?
  - answer: `American`
  - bm25_top10: `UNKNOWN` closure=0 rank=1
  - bge_rerank_top10: `UNKNOWN` closure=0 rank=1
  - oracle_first: `Australian` closure=0 rank=1
  - no_support: `Spanish` closure=0 rank=null

### bge_only_success

- **8cb889a1096711ebbdafac1f6bf848b6** (comparison, long_answer) — Which film was released more recently, Morchha or The Thing About My Folks?
  - answer: `The Thing About My Folks`
  - bm25_top10: `Morchha` closure=0 rank=1
  - bge_rerank_top10: `The Thing About My Folks UNKNOWN` closure=1 rank=1
  - oracle_first: `Morchha` closure=0 rank=1
  - no_support: `UNKNOWN` closure=0 rank=null
- **4469d2fa0bdc11eba7f7acde48001122** (compositional, mixed_numeric_text) — What is the date of death of Tsarevna Catherine Ivanovna Of Russia's mother?
  - answer: `13 October 1723`
  - bm25_top10: `UNKNOWN` closure=0 rank=2
  - bge_rerank_top10: `13 October 1723` closure=1 rank=1
  - oracle_first: `13 October 1723` closure=1 rank=1
  - no_support: `UNKNOWN` closure=0 rank=null
- **dd97cc92088111ebbd6dac1f6bf848b6** (bridge_comparison, short_entity) — Which film has the director born earlier, To Dorothy A Son or Jurášek?
  - answer: `Jurášek`
  - bm25_top10: `Muriel Box` closure=0 rank=1
  - bge_rerank_top10: `Jurášek` closure=1 rank=1
  - oracle_first: `To Dorothy A Son` closure=0 rank=1
  - no_support: `UNKNOWN` closure=0 rank=null
- **b729a3c80bdd11eba7f7acde48001122** (compositional, short_entity) — Where was the director of film The January Man born?
  - answer: `Ardmore, County Waterford`
  - bm25_top10: `UNKNOWN` closure=0 rank=2
  - bge_rerank_top10: `Ardmore, County Waterford, Ireland` closure=1 rank=1
  - oracle_first: `Ardmore, County Waterford, Ireland` closure=1 rank=1
  - no_support: `UNKNOWN` closure=0 rank=null
- **a11b23f8093a11ebbdaeac1f6bf848b6** (comparison, single_token_entity) — Which film was released first, Venmegam or Red Lines?
  - answer: `Venmegam`
  - bm25_top10: `UNKNOWN` closure=0 rank=1
  - bge_rerank_top10: `Venmegam` closure=1 rank=1
  - oracle_first: `Venmegam` closure=1 rank=1
  - no_support: `UNKNOWN` closure=0 rank=null

### bm25_only_success

- **ed236e980bae11ebab90acde48001122** (inference, mixed_numeric_text) — Who is the paternal grandfather of James Bruce (1769–1798)?
  - answer: `William Bruce, 8th Earl of Kincardine`
  - bm25_top10: `William Bruce, 8th Earl of Kincardine` closure=1 rank=1
  - bge_rerank_top10: `UNKNOWN` closure=0 rank=1
  - oracle_first: `UNKNOWN` closure=0 rank=1
  - no_support: `UNKNOWN` closure=0 rank=null
- **ea897033084e11ebbd56ac1f6bf848b6** (comparison, short_entity) — Who was born first out of Marie Agba-Otikpo and Mariam El-Masri?
  - answer: `Marie Agba-Otikpo`
  - bm25_top10: `Marie Agba-Otikpo` closure=1 rank=1
  - bge_rerank_top10: `Ahmed El-Masri` closure=0 rank=1
  - oracle_first: `Marie Agba-Otikpo` closure=1 rank=1
  - no_support: `Marie Agba-Otikpo UNKNOWN Mariam El-Masri` closure=1 rank=null
- **a387d7b00bdb11eba7f7acde48001122** (compositional, single_token_entity) — Where was the director of film Detective Chinatown 2 born?
  - answer: `Shenyang`
  - bm25_top10: `Shenyang` closure=1 rank=2
  - bge_rerank_top10: `UNKNOWN` closure=0 rank=1
  - oracle_first: `Shenyang` closure=1 rank=1
  - no_support: `UNKNOWN` closure=0 rank=null
- **e9aefcde08cd11ebbd93ac1f6bf848b6** (bridge_comparison, yes_no) — Are director of film Ghosts Of Mississippi and director of film The Silence (1998 Film) both from the same country?
  - answer: `no`
  - bm25_top10: `No` closure=1 rank=1
  - bge_rerank_top10: `UNKNOWN` closure=0 rank=1
  - oracle_first: `UNKNOWN` closure=0 rank=1
  - no_support: `UNKNOWN` closure=0 rank=null
- **148d982608af11ebbd83ac1f6bf848b6** (bridge_comparison, long_answer) — Which film has the director died earlier, Smiley Gets A Gun or Frankenstein And The Monster From Hell?
  - answer: `Smiley Gets A Gun`
  - bm25_top10: `Smiley Gets A Gun` closure=1 rank=1
  - bge_rerank_top10: `Anthony Kimmins` closure=0 rank=1
  - oracle_first: `Smiley Gets A Gun` closure=1 rank=1
  - no_support: `Smiley Gets A Gun` closure=1 rank=null

### natural_success_oracle_fail

- **8cb889a1096711ebbdafac1f6bf848b6** (comparison, long_answer) — Which film was released more recently, Morchha or The Thing About My Folks?
  - answer: `The Thing About My Folks`
  - bm25_top10: `Morchha` closure=0 rank=1
  - bge_rerank_top10: `The Thing About My Folks UNKNOWN` closure=1 rank=1
  - oracle_first: `Morchha` closure=0 rank=1
  - no_support: `UNKNOWN` closure=0 rank=null
- **ed236e980bae11ebab90acde48001122** (inference, mixed_numeric_text) — Who is the paternal grandfather of James Bruce (1769–1798)?
  - answer: `William Bruce, 8th Earl of Kincardine`
  - bm25_top10: `William Bruce, 8th Earl of Kincardine` closure=1 rank=1
  - bge_rerank_top10: `UNKNOWN` closure=0 rank=1
  - oracle_first: `UNKNOWN` closure=0 rank=1
  - no_support: `UNKNOWN` closure=0 rank=null
- **dd97cc92088111ebbd6dac1f6bf848b6** (bridge_comparison, short_entity) — Which film has the director born earlier, To Dorothy A Son or Jurášek?
  - answer: `Jurášek`
  - bm25_top10: `Muriel Box` closure=0 rank=1
  - bge_rerank_top10: `Jurášek` closure=1 rank=1
  - oracle_first: `To Dorothy A Son` closure=0 rank=1
  - no_support: `UNKNOWN` closure=0 rank=null
- **ddb04f2608c011ebbd8aac1f6bf848b6** (bridge_comparison, short_entity) — Which film has the director who is older, Up In The World or Gioventù Alla Sbarra?
  - answer: `Gioventù Alla Sbarra`
  - bm25_top10: `Gioventù Alla Sbarra` closure=1 rank=1
  - bge_rerank_top10: `Gioventù alla sbarra` closure=1 rank=1
  - oracle_first: `UNKNOWN` closure=0 rank=1
  - no_support: `UNKNOWN` closure=0 rank=null
- **5760d86408a711ebbd7fac1f6bf848b6** (comparison, short_entity) — Which film came out first, Blood And Diamonds or Opened By Mistake?
  - answer: `Opened By Mistake`
  - bm25_top10: `Opened By Mistake` closure=1 rank=1
  - bge_rerank_top10: `Opened By Mistake` closure=1 rank=1
  - oracle_first: `Blood And Diamonds` closure=0 rank=1
  - no_support: `UNKNOWN` closure=0 rank=null

### no_support_success_leakage

- **2fcf02980bdc11eba7f7acde48001122** (compositional, single_token_entity) — Which country the director of film West 32Nd is from?
  - answer: `American`
  - bm25_top10: `UNKNOWN` closure=0 rank=1
  - bge_rerank_top10: `UNKNOWN` closure=0 rank=1
  - oracle_first: `American` closure=1 rank=1
  - no_support: `Korean-American` closure=1 rank=null
- **e84d4a04089511ebbd75ac1f6bf848b6** (bridge_comparison, long_answer) — Which film has the director who is older, Don'T Take Me Home or Das Mädchen Und Der Staatsanwalt?
  - answer: `Das Mädchen Und Der Staatsanwalt`
  - bm25_top10: `Das Mädchen Und Der Staatsanwalt` closure=1 rank=1
  - bge_rerank_top10: `Das Mädchen Und Der Staatsanwalt` closure=1 rank=1
  - oracle_first: `Das Mädchen Und Der Staatsanwalt` closure=1 rank=1
  - no_support: `Das Mädchen Und Der Staatsanwalt` closure=1 rank=null
- **ea897033084e11ebbd56ac1f6bf848b6** (comparison, short_entity) — Who was born first out of Marie Agba-Otikpo and Mariam El-Masri?
  - answer: `Marie Agba-Otikpo`
  - bm25_top10: `Marie Agba-Otikpo` closure=1 rank=1
  - bge_rerank_top10: `Ahmed El-Masri` closure=0 rank=1
  - oracle_first: `Marie Agba-Otikpo` closure=1 rank=1
  - no_support: `Marie Agba-Otikpo UNKNOWN Mariam El-Masri` closure=1 rank=null
- **fe105e54089411ebbd75ac1f6bf848b6** (comparison, short_entity) — Which film was released more recently, The Vein or Now Barabbas?
  - answer: `Now Barabbas`
  - bm25_top10: `Now Barabbas` closure=1 rank=1
  - bge_rerank_top10: `Now Barabbas` closure=1 rank=1
  - oracle_first: `Now Barabbas` closure=1 rank=1
  - no_support: `Now Barabbas UNKNOWN` closure=1 rank=null
- **148d982608af11ebbd83ac1f6bf848b6** (bridge_comparison, long_answer) — Which film has the director died earlier, Smiley Gets A Gun or Frankenstein And The Monster From Hell?
  - answer: `Smiley Gets A Gun`
  - bm25_top10: `Smiley Gets A Gun` closure=1 rank=1
  - bge_rerank_top10: `Anthony Kimmins` closure=0 rank=1
  - oracle_first: `Smiley Gets A Gun` closure=1 rank=1
  - no_support: `Smiley Gets A Gun` closure=1 rank=null

### oracle_only_success

- **71f7295008d211ebbd96ac1f6bf848b6** (bridge_comparison, long_answer) — Which film has the director who was born later, The Fighting Hombre or Vayyari Bhamalu Vagalamari Bhartalu?
  - answer: `Vayyari Bhamalu Vagalamari Bhartalu`
  - bm25_top10: `The Fighting Hombre` closure=0 rank=1
  - bge_rerank_top10: `The Fighting Hombre` closure=0 rank=1
  - oracle_first: `Vayyari Bhamalu Vagalamari Bhartalu` closure=1 rank=1
  - no_support: `UNKNOWN` closure=0 rank=null
- **2fcf02980bdc11eba7f7acde48001122** (compositional, single_token_entity) — Which country the director of film West 32Nd is from?
  - answer: `American`
  - bm25_top10: `UNKNOWN` closure=0 rank=1
  - bge_rerank_top10: `UNKNOWN` closure=0 rank=1
  - oracle_first: `American` closure=1 rank=1
  - no_support: `Korean-American` closure=1 rank=null
- **f68691d208bf11ebbd8aac1f6bf848b6** (bridge_comparison, short_entity) — Which film has the director who was born first, The Younger Generation or The Sky Skidder?
  - answer: `The Sky Skidder`
  - bm25_top10: `UNKNOWN` closure=0 rank=1
  - bge_rerank_top10: `UNKNOWN` closure=0 rank=1
  - oracle_first: `The Sky Skidder` closure=1 rank=1
  - no_support: `UNKNOWN` closure=0 rank=null
- **e01dc80c0bda11eba7f7acde48001122** (compositional, short_entity) — Who is the spouse of the director of film Mcdull: Me & My Mum?
  - answer: `Alice Mak`
  - bm25_top10: `UNKNOWN` closure=0 rank=1
  - bge_rerank_top10: `UNKNOWN` closure=0 rank=1
  - oracle_first: `Alice Mak` closure=1 rank=1
  - no_support: `UNKNOWN` closure=0 rank=null
- **7b4cc520091d11ebbdaeac1f6bf848b6** (comparison, long_answer) — Which film came out earlier, Irina Palm or Big Man On Campus?
  - answer: `Big Man On Campus`
  - bm25_top10: `Irina Palm` closure=0 rank=1
  - bge_rerank_top10: `Irina Palm` closure=0 rank=1
  - oracle_first: `The Big Man On Campus (1908) UNKNOWN` closure=1 rank=1
  - no_support: `UNKNOWN` closure=0 rank=null

