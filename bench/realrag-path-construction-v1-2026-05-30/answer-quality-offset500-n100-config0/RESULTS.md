# Entity-Hop Retrieval

total: 100
corpus_docs: 56687

## Retrieval

| metric | value |
|---|---:|
| support_title_recall | 0.724 |
| full_support_recall | 0.400 |
| answer_string_present_rate | 0.790 |

## Answer quality

| condition | EM | contains | F1 |
|---|---:|---:|---:|
| bge_ref | 0.000 | 0.000 | 0.000 |
| entity_hop_path_prompt | 0.270 | 0.330 | 0.376 |
| entity_hop_strong | 0.210 | 0.310 | 0.318 |

## Rows

| qid | gold | support | answer in docs | bge | hop strong | path | extract | ecd |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| 709430f20bda11eba7f7acde48001122 | America | 0.67 | 1 | 0/0.00 | 0/0.00 | 1/1.00 |  |  |
| 6de887fc0bdc11eba7f7acde48001122 | Karnataka | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| ca3fdcde0bdd11eba7f7acde48001122 | Öland | 0.50 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 45a190120bdd11eba7f7acde48001122 | Reykjavík | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 374844b20baf11ebab90acde48001122 | Adalbert I, Margrave of Tuscany | 1.00 | 1 | 0/0.00 | 0/0.00 | 1/1.00 |  |  |
| e8b086280bdd11eba7f7acde48001122 | Indian | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 9ba526540bdd11eba7f7acde48001122 | Liria Palace | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| ac354ea00baf11ebab90acde48001122 | Louise of Mecklenburg-Güstrow | 0.25 | 0 | 0/0.00 | 0/0.29 | 0/0.25 |  |  |
| 6f0a15860bde11eba7f7acde48001122 | Tony Award for Best Actress in a Musical | 0.67 | 1 | 0/0.00 | 0/0.44 | 0/0.44 |  |  |
| 2c7d1dd00bde11eba7f7acde48001122 | American | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| a06475340bdb11eba7f7acde48001122 | Panthéon | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 23ae34720bda11eba7f7acde48001122 | Villupuram | 0.67 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 4c1772720bb011ebab90acde48001122 | Charles I of Austria | 0.67 | 1 | 0/0.00 | 0/0.44 | 0/0.44 |  |  |
| a70f3a840bdd11eba7f7acde48001122 | April 23, 1716 | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 21a3b9fa0bde11eba7f7acde48001122 | 1 August 10 | 0.00 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 4b145f0a0bda11eba7f7acde48001122 | New York | 1.00 | 1 | 0/0.00 | 0/0.08 | 0/0.00 |  |  |
| 968068d20bdd11eba7f7acde48001122 | England | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| cd1dfa560bda11eba7f7acde48001122 | Käthe von Nagy | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 57eb21ba0bde11eba7f7acde48001122 | Los Angeles County | 0.67 | 1 | 0/0.00 | 0/0.86 | 0/0.86 |  |  |
| 0d77cf5a0bdb11eba7f7acde48001122 | Taiyuan | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 96b7c1a60bdd11eba7f7acde48001122 | Palencia | 0.50 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| e33d85f00bd911eba7f7acde48001122 | San Diego State University | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 247f29b00bda11eba7f7acde48001122 | Harvard | 0.67 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 4f6bc4a20bdb11eba7f7acde48001122 | United Nations | 0.67 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 1c8a39d20bdc11eba7f7acde48001122 | Samos | 0.33 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| a6ecf1040bdd11eba7f7acde48001122 | America | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 3cfe44540bde11eba7f7acde48001122 | Shanghai | 0.00 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 057f68740bdd11eba7f7acde48001122 | Volker Schlöndorff | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 812d167e0bb011ebab90acde48001122 | Thomas de Beauchamp | 1.00 | 1 | 0/0.00 | 0/0.20 | 0/0.20 |  |  |
| 895740ae0bb011ebab90acde48001122 | Elizabeth Willoughby | 1.00 | 1 | 0/0.00 | 0/0.50 | 0/0.50 |  |  |
| be9369c80bdd11eba7f7acde48001122 | Georgia | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 692515880bdb11eba7f7acde48001122 | Northern Ireland | 0.67 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 73165fb60bdb11eba7f7acde48001122 | Ottoman Empire | 0.67 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 57e24dd60bdb11eba7f7acde48001122 | Austria | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 2ed1a68c0bde11eba7f7acde48001122 | Wolverhampton | 0.50 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 429615320bb011ebab90acde48001122 | Jean de Laval | 0.67 | 1 | 0/0.00 | 0/0.57 | 0/0.57 |  |  |
| 9494fa760bdb11eba7f7acde48001122 | Reykjavík | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 4aee95dc0bd911eba7f7acde48001122 | New York | 1.00 | 1 | 0/0.00 | 0/0.67 | 0/0.67 |  |  |
| 19ab7c2a0bdd11eba7f7acde48001122 | San Antonio | 1.00 | 1 | 0/0.00 | 0/0.80 | 0/0.80 |  |  |
| 885ba7220bdc11eba7f7acde48001122 | Venice | 0.67 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 66f6f0e60baf11ebab90acde48001122 | Theodora | 0.50 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 6faf10f40bde11eba7f7acde48001122 | Indian | 1.00 | 1 | 0/0.00 | 0/0.67 | 0/0.67 |  |  |
| 6be347940baf11ebab90acde48001122 | Mihnea Turcitul | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.50 |  |  |
| db9c68800bdd11eba7f7acde48001122 | Paris | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| d4f53b200baf11ebab90acde48001122 | Victor de Broglie | 1.00 | 1 | 0/0.00 | 0/0.57 | 0/0.57 |  |  |
| 4faf4b760bb011ebab90acde48001122 | Louise d'Aumont | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 07f908b20bdd11eba7f7acde48001122 | Moscow | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 1b99cbbc0bde11eba7f7acde48001122 | London | 0.67 | 1 | 0/0.00 | 0/0.33 | 1/1.00 |  |  |
| 76cacca20bde11eba7f7acde48001122 | Grammy | 0.67 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 648a5df20baf11ebab90acde48001122 | Sophia of Rheineck | 0.50 | 1 | 0/0.00 | 0/0.25 | 0/0.25 |  |  |
| 801915340bd911eba7f7acde48001122 | Plainfield | 0.25 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| bd8cb9320bdb11eba7f7acde48001122 | Hollywood | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 9ec332a00baf11ebab90acde48001122 | Henry I of Navarre | 1.00 | 1 | 0/0.00 | 0/0.89 | 0/0.25 |  |  |
| 7e815a440bdc11eba7f7acde48001122 | Chris Pérez | 0.50 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 04a065a60bde11eba7f7acde48001122 | Topeka | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 18a5ef800bde11eba7f7acde48001122 | Florence, Italy | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| ace961ec0baf11ebab90acde48001122 | Khentkaus II | 0.50 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| e07a39e80bda11eba7f7acde48001122 | Roman | 0.67 | 1 | 0/0.00 | 0/0.40 | 0/0.00 |  |  |
| b61f7c280bdd11eba7f7acde48001122 | Parkinson's disease | 0.50 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 147c6e160bde11eba7f7acde48001122 | 29 March 1807 | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 49637d220bd911eba7f7acde48001122 | Chuck Stone | 1.00 | 1 | 0/0.00 | 0/0.40 | 0/0.40 |  |  |
| 08bc79d60bde11eba7f7acde48001122 | Wellington | 0.50 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 57eba38e0bb011ebab90acde48001122 | Frederick Louis | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| b7af3ede0bdd11eba7f7acde48001122 | Washington and Lee University | 0.33 | 0 | 0/0.00 | 0/0.07 | 0/0.00 |  |  |
| 61b3b8820bda11eba7f7acde48001122 | People's Artist of the RSFSR | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 218609020bdc11eba7f7acde48001122 | British | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| df99f4120bdc11eba7f7acde48001122 | Munich Waldfriedhof | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 746a799c0bdb11eba7f7acde48001122 | Spanish | 1.00 | 1 | 0/0.00 | 0/0.00 | 1/1.00 |  |  |
| 7b076cc40bdb11eba7f7acde48001122 | Southampton | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 2eaa7d9c0bb011ebab90acde48001122 | Constantius Chlorus | 0.67 | 1 | 0/0.00 | 0/0.00 | 1/1.00 |  |  |
| 285016800bda11eba7f7acde48001122 | Maureen O'Sullivan | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 252694580bde11eba7f7acde48001122 | Luxembourg | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 02428f7e0bb011ebab90acde48001122 | Cecile of France | 0.00 | 0 | 0/0.00 | 0/0.33 | 0/0.25 |  |  |
| 21ec1e0e0baf11ebab90acde48001122 | Henrietta Maria of France | 0.33 | 0 | 0/0.00 | 0/0.22 | 0/0.25 |  |  |
| 8dc985120bdc11eba7f7acde48001122 | Kaster | 0.50 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| a94f39220bdb11eba7f7acde48001122 | Aldeburgh | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 29bd8c0c0bb011ebab90acde48001122 | Robert de Ferrers, 2nd Earl of Derby | 0.67 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| ee3233920bda11eba7f7acde48001122 | 1397 | 1.00 | 1 | 0/0.00 | 0/0.00 | 1/1.00 |  |  |
| 42a2068a0bdd11eba7f7acde48001122 | Macau | 0.50 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 3f2eb0120baf11ebab90acde48001122 | Henry Beaufort | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| c5d56fe60bd911eba7f7acde48001122 | 15 August 1876 | 0.67 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| c811e4200bdd11eba7f7acde48001122 | Kyrgyzstan | 0.67 | 1 | 0/0.00 | 0/0.50 | 0/0.50 |  |  |
| e5354de60bdb11eba7f7acde48001122 | American | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| a4f54a640baf11ebab90acde48001122 | Ferdinand I | 0.25 | 0 | 0/0.00 | 0/0.33 | 0/0.29 |  |  |
| 3a47b9960bdb11eba7f7acde48001122 | Père Lachaise Cemetery | 0.67 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 4b443b0e0bde11eba7f7acde48001122 | Hiroshima | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 5569eb4e0baf11ebab90acde48001122 | Marie d'Agoult | 1.00 | 1 | 0/0.00 | 0/0.00 | 1/1.00 |  |  |
| 67aaa1940bdd11eba7f7acde48001122 | United Kingdom | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| e50c35fa0bdb11eba7f7acde48001122 | Salsomaggiore Terme | 0.67 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 0a9f880a0bda11eba7f7acde48001122 | Jean Harlow | 0.50 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| cd59a6660bdd11eba7f7acde48001122 | England | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 1732aeb80bde11eba7f7acde48001122 | New York | 0.67 | 1 | 0/0.00 | 0/0.80 | 0/0.80 |  |  |
| fbc3b82c0bae11ebab90acde48001122 | Philip III of France | 0.50 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 6a76a6b60bb011ebab90acde48001122 | William, Duke of Nassau | 0.50 | 0 | 0/0.00 | 0/0.18 | 0/0.18 |  |  |
| c9e655000bd911eba7f7acde48001122 | 23 January 1862 | 1.00 | 1 | 0/0.00 | 1/1.00 | 0/0.50 |  |  |
| 972eef2a0bdc11eba7f7acde48001122 | Ozzy | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 7683f0f20bde11eba7f7acde48001122 | Hungarian | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| a8f3ff980bdc11eba7f7acde48001122 | Tiflis | 0.67 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| e88629000bdd11eba7f7acde48001122 | 6 September 1868 | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.50 |  |  |
| fa3d4e360bdc11eba7f7acde48001122 | Rome | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
