# RealRAG HotpotQA R3C — metric/supporting-facts audit pack

Status: **offline audit pack generated**

## Boundary

- offline metric/supporting-facts audit pack.
- audit_label is unreviewed; this is not an LLM-as-judge result.
- supporting-fact sentence presence follows HotpotQA paragraph inclusion; it validates prompt inclusion, not internal use.
- closure remains answer-side EM/contains/F1 derived.

## Aggregate sentence-support audit

| condition | n | closure | EM | F1 | SF sentence recall | SF sentence rank mean | closure risk breakdown |
|---|---:|---:|---:|---:|---:|---:|---|
| bge_rerank_top10 | 1991 | 50.1% | 41.2% | 52.6% | 100.0% | 1.77 | exact 821; contains 109; f1 68; no-support 0 |
| bm25_top10 | 1991 | 45.8% | 38.0% | 48.8% | 100.0% | 3.17 | exact 757; contains 97; f1 57; no-support 0 |
| no_support | 1991 | 6.8% | 5.5% | 7.6% | 0.0% | n/a | exact 0; contains 0; f1 0; no-support 136 |
| oracle_first | 1991 | 51.2% | 43.2% | 54.2% | 100.0% | 1.54 | exact 860; contains 90; f1 69; no-support 0 |

## Stratified bucket counts

| bucket | count | sample count |
|---|---:|---:|
| bm25_fail_bge_success | 198 | 30 |
| bm25_success_bge_fail | 111 | 30 |
| bm25_fail_bge_fail_oracle_success | 86 | 30 |
| all_support_conditions_fail | 796 | 30 |
| oracle_success_bge_fail | 145 | 30 |
| bge_success_oracle_fail | 124 | 30 |
| no_support_success_leakage | 136 | 30 |

## Sample preview

### bm25_fail_bge_success

- **5ae588cb55429960a22e0300** — Which plant, the Chaerophyllum or the Cryptanthus, can be found in various places across the world?
  - gold: `Chaerophyllum`
  - bm25: `UNKNOWN` closure=0 sfRank=20
  - bge: `Chaerophyllum` closure=1 sfRank=1
  - oracle: `Chaerophyllum` closure=1 sfRank=1
  - no_support: `UNKNOWN` closure=0
- **5ae3a8985542992f92d82329** — Politician Lyman Sherwood was born in what New York county?
  - gold: `Rensselaer County`
  - bm25: `Wayne County` closure=0 sfRank=1
  - bge: `Rensselaer County` closure=1 sfRank=1
  - oracle: `Rensselaer County` closure=1 sfRank=1
  - no_support: `UNKNOWN` closure=0
- **5a7c827e55429907fabeefa7** — The 2011 Tennessee Tech Golden Eagles football team competed in a conference with how many members competing in football?
  - gold: `9`
  - bm25: `12` closure=0 sfRank=3
  - bge: `9` closure=1 sfRank=3
  - oracle: `9` closure=1 sfRank=3
  - no_support: `UNKNOWN` closure=0
- **5a8c6bd55542995e66a475ea** — jean Sagbo, considered "Russia's Obama" is considered to belong to what ethnic group based on his having African heritage or dark skin?
  - gold: `Afro-Russian`
  - bm25: `Beninese` closure=0 sfRank=4
  - bge: `Afro-Russian` closure=1 sfRank=4
  - oracle: `Afro-Russian` closure=1 sfRank=4
  - no_support: `UNKNOWN` closure=0
- **5ade3b925542992fa25da70a** — What was the middle name of the pilot who was portrayed by Levon Helm in the film The Right Stuff ?
  - gold: `Lynwood`
  - bm25: `UNKNOWN` closure=0 sfRank=4
  - bge: `Lynwood` closure=1 sfRank=4
  - oracle: `Lynwood` closure=1 sfRank=1
  - no_support: `UNKNOWN` closure=0

### bm25_success_bge_fail

- **5adf73a45542992d7e9f9378** — Philip Despencer's brother was a favorite of which king who was deposed in January of 1327?
  - gold: `King Edward II`
  - bm25: `Edward II` closure=1 sfRank=4
  - bge: `Edward II of England` closure=0 sfRank=4
  - oracle: `Edward II of England` closure=0 sfRank=1
  - no_support: `UNKNOWN` closure=0
- **5a7339c85542991f9a20c6a2** — What is the nickname of the county in Northern Ireland where the Tandragee killings took place?
  - gold: `"Orchard County"`
  - bm25: `Orchard County` closure=1 sfRank=1
  - bge: `UNKNOWN` closure=0 sfRank=1
  - oracle: `Orchard County` closure=1 sfRank=3
  - no_support: `UNKNOWN` closure=0
- **5a7a11c85542996a35c170b4** — What is the English translation of the name of the novel series which the Four III is the final installment of?
  - gold: `"The Four Great Constables"`
  - bm25: `The Four Great Constables` closure=1 sfRank=2
  - bge: `Woon Swee Oan's novel series` closure=0 sfRank=2
  - oracle: `The Four` closure=0 sfRank=2
  - no_support: `UNKNOWN` closure=0
- **5a7b895c5542997c3ec97206** — The head writer for which show also wrote a Simpsons' episode narrated by James Earl Jones?
  - gold: `Futurama`
  - bm25: `Futurama` closure=1 sfRank=1
  - bge: `David X. Cohen` closure=0 sfRank=1
  - oracle: `Futurama` closure=1 sfRank=1
  - no_support: `UNKNOWN` closure=0
- **5ab2123155429970612095b9** — What did Mustafa Kemal Atatürk's residence become once it became Atatürk Museum Mansion?  
  - gold: `museum`
  - bm25: `Atatürk Museum Mansion` closure=1 sfRank=1
  - bge: `UNKNOWN` closure=0 sfRank=1
  - oracle: `Atatürk Museum Mansion` closure=1 sfRank=1
  - no_support: `UNKNOWN` closure=0

### bm25_fail_bge_fail_oracle_success

- **5a78caa955429970f5fffd83** — Which civilization instigated a war with Rome and significantly influenced the Latin language?
  - gold: `the Etruscan civilization`
  - bm25: `Lars Tolumnius` closure=0 sfRank=1
  - bge: `Etruscan` closure=0 sfRank=1
  - oracle: `Etruscan civilization` closure=1 sfRank=1
  - no_support: `UNKNOWN` closure=0
- **5ae69fa755429908198fa66c** — Jeff Bhasker won a Grammy Award for a song that was the fourth single from what studio album?
  - gold: `My Beautiful Dark Twisted Fantasy`
  - bm25: `UNKNOWN` closure=0 sfRank=1
  - bge: `UNKNOWN` closure=0 sfRank=1
  - oracle: `My Beautiful Dark Twisted Fantasy` closure=1 sfRank=1
  - no_support: `UNKNOWN` closure=0
- **5a7f1e805542993067513640** — When does the universe, Earth, and all life on Earth were created as believed by an organization which commissioned The Voyage That Shook The World?
  - gold: `10,000 years ago`
  - bm25: `UNKNOWN` closure=0 sfRank=1
  - bge: `UNKNOWN` closure=0 sfRank=1
  - oracle: `less than 10,000 years ago` closure=1 sfRank=1
  - no_support: `UNKNOWN` closure=0
- **5ab531cc5542990594ba9d23** — How large is the shopping mall where KGOT radio station has its studios ?
  - gold: `728,000 ft²`
  - bm25: `UNKNOWN` closure=0 sfRank=2
  - bge: `UNKNOWN` closure=0 sfRank=2
  - oracle: `728,000 ft² (67,000 m²)` closure=1 sfRank=1
  - no_support: `UNKNOWN` closure=0
- **5a863d2d5542991e771815d2** — Which utility holding company did Alfred A. Marcus work as a consultant?
  - gold: `Xcel Energy Inc.`
  - bm25: `UNKNOWN` closure=0 sfRank=2
  - bge: `UNKNOWN` closure=0 sfRank=2
  - oracle: `Xcel Energy` closure=1 sfRank=1
  - no_support: `EBASCO Services` closure=0

### all_support_conditions_fail

- **5a84c4b05542991dd0999deb** — Are both Forman Christian College and Purbanchal University public schools?
  - gold: `no`
  - bm25: `UNKNOWN` closure=0 sfRank=15
  - bge: `UNKNOWN` closure=0 sfRank=1
  - oracle: `UNKNOWN` closure=0 sfRank=1
  - no_support: `UNKNOWN` closure=0
- **5a8a5c9855429970aeb702be** — Why I Write was penned by which English novelist and critic?
  - gold: `Eric Arthur Blair`
  - bm25: `George Orwell` closure=0 sfRank=1
  - bge: `George Orwell` closure=0 sfRank=1
  - oracle: `George Orwell` closure=0 sfRank=1
  - no_support: `UNKNOWN` closure=0
- **5a7fb1e55542995d8a8ddef7** — Which documentary film premiered first, Grizzly Man or Pray the Devil Back to Hell?
  - gold: `Grizzly Man`
  - bm25: `UNKNOWN` closure=0 sfRank=2
  - bge: `UNKNOWN` closure=0 sfRank=2
  - oracle: `UNKNOWN` closure=0 sfRank=2
  - no_support: `Grizzly Man` closure=1
- **5ab4071955429976abd1bd38** — How long was the career of the actor in The Skull?
  - gold: `70 years`
  - bm25: `UNKNOWN` closure=0 sfRank=2
  - bge: `UNKNOWN` closure=0 sfRank=2
  - oracle: `UNKNOWN` closure=0 sfRank=2
  - no_support: `UNKNOWN` closure=0
- **5abd724b55429924427fcfd9** — Is Ashland, New Hampshire or Plymouth Regional High School located near the Scribner-Fellows State Forest?
  - gold: `Ashland is home to Scribner-Fellows State Forest`
  - bm25: `Scribner-Fellows State Forest is located near Ashland, New Hampshire, not Plymouth Regional High School in New Hampshir…` closure=0 sfRank=3
  - bge: `Ashland, New Hampshire` closure=0 sfRank=1
  - oracle: `Scribner-Fellows State Forest` closure=0 sfRank=3
  - no_support: `UNKNOWN` closure=0

### oracle_success_bge_fail

- **5a78caa955429970f5fffd83** — Which civilization instigated a war with Rome and significantly influenced the Latin language?
  - gold: `the Etruscan civilization`
  - bm25: `Lars Tolumnius` closure=0 sfRank=1
  - bge: `Etruscan` closure=0 sfRank=1
  - oracle: `Etruscan civilization` closure=1 sfRank=1
  - no_support: `UNKNOWN` closure=0
- **5ae69fa755429908198fa66c** — Jeff Bhasker won a Grammy Award for a song that was the fourth single from what studio album?
  - gold: `My Beautiful Dark Twisted Fantasy`
  - bm25: `UNKNOWN` closure=0 sfRank=1
  - bge: `UNKNOWN` closure=0 sfRank=1
  - oracle: `My Beautiful Dark Twisted Fantasy` closure=1 sfRank=1
  - no_support: `UNKNOWN` closure=0
- **5a7f1e805542993067513640** — When does the universe, Earth, and all life on Earth were created as believed by an organization which commissioned The Voyage That Shook The World?
  - gold: `10,000 years ago`
  - bm25: `UNKNOWN` closure=0 sfRank=1
  - bge: `UNKNOWN` closure=0 sfRank=1
  - oracle: `less than 10,000 years ago` closure=1 sfRank=1
  - no_support: `UNKNOWN` closure=0
- **5a7339c85542991f9a20c6a2** — What is the nickname of the county in Northern Ireland where the Tandragee killings took place?
  - gold: `"Orchard County"`
  - bm25: `Orchard County` closure=1 sfRank=1
  - bge: `UNKNOWN` closure=0 sfRank=1
  - oracle: `Orchard County` closure=1 sfRank=3
  - no_support: `UNKNOWN` closure=0
- **5ab531cc5542990594ba9d23** — How large is the shopping mall where KGOT radio station has its studios ?
  - gold: `728,000 ft²`
  - bm25: `UNKNOWN` closure=0 sfRank=2
  - bge: `UNKNOWN` closure=0 sfRank=2
  - oracle: `728,000 ft² (67,000 m²)` closure=1 sfRank=1
  - no_support: `UNKNOWN` closure=0

### bge_success_oracle_fail

- **5a8cee9b554299441c6b9f87** — Haier has North American rights to which appliance company headquartered in Louisville, Kentucky?
  - gold: `GE Appliances`
  - bm25: `Hotpoint` closure=0 sfRank=1
  - bge: `GE Appliances` closure=1 sfRank=1
  - oracle: `UNKNOWN` closure=0 sfRank=1
  - no_support: `UNKNOWN` closure=0
- **5a75639255429916b01642f7** — What role did Ben Keaton play in the british film East is East written by Ayub Khan-Din?
  - gold: `a priest`
  - bm25: `priest` closure=1 sfRank=4
  - bge: `priest` closure=1 sfRank=1
  - oracle: `UNKNOWN` closure=0 sfRank=1
  - no_support: `UNKNOWN` closure=0
- **5a871e265542991e771816d1** — The man nicknamed "the Mayor of Silicon Valley"  was credited along with what engineer that was awarded the nobel prize for physics on December 10, 2000
  - gold: `Jack Kilby`
  - bm25: `Jack Kilby` closure=1 sfRank=1
  - bge: `Jack Kilby` closure=1 sfRank=1
  - oracle: `Robert Noyce` closure=0 sfRank=2
  - no_support: `UNKNOWN` closure=0
- **5a728f745542991f9a20c4e6** — Which magazine was founded first, Diva or Elle?
  - gold: `Elle`
  - bm25: `Elle` closure=1 sfRank=1
  - bge: `Elle` closure=1 sfRank=1
  - oracle: `UNKNOWN` closure=0 sfRank=2
  - no_support: `UNKNOWN` closure=0
- **5addce005542997dc790703c** — How many daily flights are made by the Thai long-haul low-fare airline (part of the AirAsia Group) headquartered and based at Don Mueang International Airport?
  - gold: `21`
  - bm25: `UNKNOWN` closure=0 sfRank=1
  - bge: `21` closure=1 sfRank=1
  - oracle: `UNKNOWN` closure=0 sfRank=1
  - no_support: `UNKNOWN` closure=0

### no_support_success_leakage

- **5a7fb1e55542995d8a8ddef7** — Which documentary film premiered first, Grizzly Man or Pray the Devil Back to Hell?
  - gold: `Grizzly Man`
  - bm25: `UNKNOWN` closure=0 sfRank=2
  - bge: `UNKNOWN` closure=0 sfRank=2
  - oracle: `UNKNOWN` closure=0 sfRank=2
  - no_support: `Grizzly Man` closure=1
- **5ab871725542990e739ec8f8** — Which band has the guitarist Gorden Mack, Red House Painters or Daughtry?
  - gold: `Red House Painters`
  - bm25: `Red House Painters` closure=1 sfRank=1
  - bge: `Red House Painters` closure=1 sfRank=1
  - oracle: `Red House Painters` closure=1 sfRank=1
  - no_support: `Red House Painters` closure=1
- **5adc0f8d55429947ff1738ef** — Between Parsifal and Saul og David which opera has more acts?
  - gold: `Saul og David`
  - bm25: `Saul og David` closure=1 sfRank=5
  - bge: `Saul og David` closure=1 sfRank=1
  - oracle: `Saul og David` closure=1 sfRank=1
  - no_support: `Saul og David` closure=1
- **5ae1847e55429920d52343ee** — Which has a greater area, Liuzhou or Muling?
  - gold: `Liuzhou`
  - bm25: `Liuzhou` closure=1 sfRank=2
  - bge: `Liuzhou` closure=1 sfRank=2
  - oracle: `Liuzhou` closure=1 sfRank=1
  - no_support: `Liuzhou` closure=1
- **5aba510f5542994dbf0198d6** — Yakuza Kiwami is a remake of the first video game in what video game series that is an open world action-adventure beat 'em up video game franchise?
  - gold: `Yakuza`
  - bm25: `Yakuza` closure=1 sfRank=1
  - bge: `Yakuza` closure=1 sfRank=2
  - oracle: `Yakuza` closure=1 sfRank=1
  - no_support: `Yakuza` closure=1

## Files

- `summary.json` — aggregate and bucket counts.
- `samples.json` — grouped samples by bucket.
- `samples.jsonl` — flat sample rows for review.
