# EPKV Quality Evaluation

total: 300

## Macro metrics

| system | EM | contains | token F1 |
|---|---:|---:|---:|
| baseline | 0.327 | 0.720 | 0.428 |
| internal+relation policy | 0.907 | 0.987 | 0.934 |

## By winning layer

| layer | n | EM | contains | F1 |
|---|---:|---:|---:|---:|
| internal_sampler_policy | 239 | 0.883 | 0.983 | 0.918 |
| relation_path_then_decode | 61 | 1.000 | 1.000 | 1.000 |

## Rows

| qid | layer | gold | baseline EM/F1 | policy EM/F1 | baseline | policy |
|---|---|---|---:|---:|---|---|
| 8813f87c0bdd11eba7f7acde48001122 | internal_sampler_policy | Małgorzata Braunek | 0/0.33 | 0/0.40 | `The mother of the director of the film "Polish-Russian War" is Małgorzata Braune` | `Małgorzata Braunek is the mother of the director of the film` |
| e2a3bf2a0bdd11eba7f7acde48001122 | relation_path_then_decode | 12 June 1516 | 0/0.00 | 1/1.00 | `Based on the given evidence, the information provided does not directly state wh` | `12 June 1516` |
| dfe93efe0bdd11eba7f7acde48001122 | internal_sampler_policy | 1983 | 0/0.17 | 0/0.33 | `According to the evidence, Jean Martin's husband, William Black, died in 1983.` | `William Black died in 1983.` |
| ece1bdae0bdb11eba7f7acde48001122 | internal_sampler_policy | British | 0/0.11 | 1/1.00 | `Based on the evidence provided, the nationality of the director of the film Made` | `British.` |
| 2fd031c00bde11eba7f7acde48001122 | internal_sampler_policy | State University of New York at Purchase | 1/1.00 | 1/1.00 | `State University of New York at Purchase.` | `State University of New York at Purchase.` |
| 09b7d46a0bda11eba7f7acde48001122 | internal_sampler_policy | 2 September 1770 | 1/1.00 | 1/1.00 | `2 September 1770.` | `2 September 1770.` |
| 61d1f6900bde11eba7f7acde48001122 | internal_sampler_policy | 1080 | 0/0.10 | 1/1.00 | `Based on the evidence provided, the date of death of Conan II, Duke of Brittany'` | `1080.` |
| c3c76b780bd911eba7f7acde48001122 | internal_sampler_policy | 30 June 1963 | 0/0.00 | 1/1.00 | `According to the evidence line E2, the director of film Reykjavík-Rotterdam, Ósk` | `30 June 1963.` |
| 2e13ff240bde11eba7f7acde48001122 | relation_path_then_decode | Wales | 0/0.00 | 1/1.00 | `Based on the evidence provided, we cannot determine the place of birth of Eiludd` | `Wales` |
| c40d35580bda11eba7f7acde48001122 | internal_sampler_policy | Rosario | 1/1.00 | 1/1.00 | `Rosario.` | `Rosario.` |
| 2cf578340bde11eba7f7acde48001122 | relation_path_then_decode | 1701 | 0/0.00 | 1/1.00 | `Based on the evidence provided, we cannot directly determine when Ferdinand III ` | `1701` |
| 79675c6e0bd911eba7f7acde48001122 | internal_sampler_policy | German | 1/1.00 | 1/1.00 | `German.` | `German.` |
| 30885e540bb011ebab90acde48001122 | relation_path_then_decode | Franz Joseph I | 0/0.21 | 1/1.00 | `Based on the evidence provided, Prince Franz de Paula of Liechtenstein's paterna` | `Franz Joseph I` |
| 2207e9060bda11eba7f7acde48001122 | internal_sampler_policy | United States | 0/0.15 | 1/1.00 | `The nationality of the director of the film "World and Time Enough" is United St` | `United States` |
| 6e4854a00bde11eba7f7acde48001122 | internal_sampler_policy | Amman | 0/0.00 | 1/1.00 | `Based on the evidence provided, the place of birth of Samir Zaid al-Rifai's fath` | `Amman.` |
| 421b26d80bb011ebab90acde48001122 | relation_path_then_decode | Princess Maria Immaculata of Bourbon-Two Sicilies | 0/0.09 | 1/1.00 | `Based on the evidence provided, Archduchess Dolores of Austria's father is Archd` | `Princess Maria Immaculata of Bourbon-Two Sicilies` |
| 43eb7b380bde11eba7f7acde48001122 | internal_sampler_policy | Belfast | 1/1.00 | 1/1.00 | `Belfast.` | `Belfast.` |
| e5d895ee0bdd11eba7f7acde48001122 | internal_sampler_policy | Tamil | 1/1.00 | 1/1.00 | `Tamil.` | `Tamil.` |
| 286321f00bb011ebab90acde48001122 | internal_sampler_policy | Íñigo Vélez de Guevara, 7th Count of Oñate | 0/0.40 | 0/0.00 | `Based on the evidence provided, the father of Beltrán Vélez de Guevara, Marquis ` | `To answer the question, we need to trace the family relationships provided in th` |
| 5e60d12e0bda11eba7f7acde48001122 | internal_sampler_policy | Jerez de la Frontera | 0/0.33 | 1/1.00 | `Based on the evidence provided, the mother of Antonio González Flores, who is Lo` | `Jerez de la Frontera.` |
| d133120e0bdd11eba7f7acde48001122 | internal_sampler_policy | Queens | 1/1.00 | 1/1.00 | `Queens.` | `Queens.` |
| 5eff3f9a0bd911eba7f7acde48001122 | internal_sampler_policy | Nanjing | 1/1.00 | 1/1.00 | `Nanjing.` | `Nanjing.` |
| 87154f1e0bda11eba7f7acde48001122 | internal_sampler_policy | Polish–Lithuanian Commonwealth | 0/0.00 | 1/1.00 | `Based on the evidence provided, Aleksandra Marianna Wiesiołowska's father, Marek` | `Polish–Lithuanian Commonwealth.` |
| a6d861000bdb11eba7f7acde48001122 | internal_sampler_policy | Maurya dynasty | 0/0.21 | 1/1.00 | `Based on the evidence provided, Tivala's father is Ashoka, and Ashoka's country ` | `Maurya dynasty.` |
| 2002bf0c0bb011ebab90acde48001122 | internal_sampler_policy | Rupert | 0/0.00 | 1/1.00 | `Based on the evidence provided, Catherine of Pomerania, Countess Palatine of Neu` | `Rupert.` |
| 5d8037920bb011ebab90acde48001122 | internal_sampler_policy | Yi Jiang | 0/0.00 | 0/0.27 | `Based on the evidence provided, King Kang of Zhou's father is King Cheng of Zhou` | ` Yi Jiang, as she is listed as the mother of King Cheng of Zhou,` |
| 1d4139960bde11eba7f7acde48001122 | internal_sampler_policy | New Brunswick, New Jersey | 1/1.00 | 1/1.00 | `New Brunswick, New Jersey.` | `New Brunswick, New Jersey.` |
| 5a5718140bde11eba7f7acde48001122 | internal_sampler_policy | Bombay | 0/0.15 | 1/1.00 | `The place of death of the director of the film Kathputli (1971 Film) was Bombay.` | `Bombay.` |
| ce4f63cc0bdc11eba7f7acde48001122 | internal_sampler_policy | National Film School in Łódź | 0/0.09 | 1/1.00 | `Based on the evidence provided, the director of the film "Ręce Do Góry" is Jerzy` | `National Film School in Łódź.` |
| 671322a00bde11eba7f7acde48001122 | internal_sampler_policy | London | 1/1.00 | 1/1.00 | `London.` | `London.` |
| 231d667c0bda11eba7f7acde48001122 | internal_sampler_policy | Swedish | 1/1.00 | 1/1.00 | `Swedish.` | `Swedish.` |
| f86dd5180bdb11eba7f7acde48001122 | internal_sampler_policy | Davao | 0/0.09 | 1/1.00 | `The place of birth of the director of the film Aurora is Davao. This can be dedu` | `Davao.` |
| 39ca32a80bdd11eba7f7acde48001122 | internal_sampler_policy | 15 November 1784 | 0/0.00 | 1/1.00 | `Based on the evidence provided, the date of birth for Prince Napoléon Bonaparte'` | `15 November 1784` |
| 047992200bdc11eba7f7acde48001122 | internal_sampler_policy | Hollywood | 0/0.08 | 1/1.00 | `According to the evidence lines, the composer of "How Long Has This Been Going O` | `Hollywood.` |
| befbd60c0bdd11eba7f7acde48001122 | internal_sampler_policy | Harvard | 0/0.11 | 1/1.00 | `Based on the evidence provided, William Seward Burroughs II, the father of Willi` | `Harvard.` |
| c531e7560baf11ebab90acde48001122 | relation_path_then_decode | Marie Leszczyńska | 0/0.09 | 1/1.00 | `Based on the evidence provided, Marie Zéphyrine of France's paternal grandmother` | `Marie Leszczyńska` |
| 4c070b620bb011ebab90acde48001122 | relation_path_then_decode | Queen Sofía of Spain | 0/0.32 | 1/1.00 | `Based on the evidence provided, the maternal grandmother of Felipe de Marichalar` | `Queen Sofía of Spain` |
| 43208df60bde11eba7f7acde48001122 | internal_sampler_policy | French | 0/0.10 | 1/1.00 | `French. According to evidence line E1, Natalie Portman's spouse is Benjamin Mill` | `French.` |
| 987e4ee80baf11ebab90acde48001122 | relation_path_then_decode | Ndvungunye | 0/0.00 | 1/1.00 | `There is no direct evidence in the provided lines to state who the father-in-law` | `Ndvungunye` |
| 44e72de60bdb11eba7f7acde48001122 | internal_sampler_policy | Reykjavík | 1/1.00 | 1/1.00 | `Reykjavík.` | `Reykjavík.` |
| 2ec36c440bb011ebab90acde48001122 | relation_path_then_decode | Thomas de Beauchamp | 0/0.26 | 1/1.00 | `Based on the evidence provided, the paternal grandfather of Richard Beauchamp, 1` | `Thomas de Beauchamp` |
| b035afca0bd911eba7f7acde48001122 | internal_sampler_policy | María Barranco | 0/0.25 | 1/1.00 | `The spouse of the director of film Carol's Journey is Imanol Uribe, who is María` | `María Barranco.` |
| 051f62de0bde11eba7f7acde48001122 | internal_sampler_policy | Osterholz | 0/0.12 | 0/0.18 | `The question contains a distractor about Augustus William Lumley-Savile, but the` | `Osterholz. 

This can be inferred from the fact that Ernest Ferdinand` |
| 1734c9b60baf11ebab90acde48001122 | relation_path_then_decode | Agrippina the Elder | 0/0.00 | 1/1.00 | `There is no evidence provided that indicates who the mother-in-law of Lollia Pau` | `Agrippina the Elder` |
| 1187c9080bde11eba7f7acde48001122 | internal_sampler_policy | October 27, 1893 | 1/1.00 | 1/1.00 | `October 27, 1893.` | `October 27, 1893.` |
| 7de481100baf11ebab90acde48001122 | relation_path_then_decode | Lady Frances Manners | 0/0.09 | 1/1.00 | `Based on the evidence provided, Charles Willoughby, 10th Baron Willoughby of Par` | `Lady Frances Manners` |
| a9cc5f240bdb11eba7f7acde48001122 | internal_sampler_policy | Catherine Robbe-Grillet | 0/0.31 | 1/1.00 | `The spouse of the director of film Eden and After is Catherine Robbe-Grillet.` | `Catherine Robbe-Grillet.` |
| c51148bc0bdb11eba7f7acde48001122 | internal_sampler_policy | Ottoman Empire | 1/1.00 | 1/1.00 | `Ottoman Empire.` | `Ottoman Empire.` |
| be0a16240baf11ebab90acde48001122 | internal_sampler_policy | Princess Mary of Great Britain | 0/0.17 | 0/0.59 | `Based on the evidence provided, Prince William of Hesse-Kassel's father is Princ` | `Prince William of Hesse-Kassel's paternal grandmother is Princess Mary of Great ` |
| 2b81511c0bde11eba7f7acde48001122 | internal_sampler_policy | Washington | 0/0.14 | 1/1.00 | `According to the evidence lines, the presenter of Tim Russert (Talk Show) died i` | `Washington.` |
| ea9832140bd911eba7f7acde48001122 | internal_sampler_policy | Newport | 1/1.00 | 1/1.00 | `Newport.` | `Newport.` |
| 772c5c660bb011ebab90acde48001122 | relation_path_then_decode | Catherine of Braganza | 0/0.09 | 1/1.00 | `None of the provided evidence lines or distractors mention George Fitzroy, 1st D` | `Catherine of Braganza` |
| 0ac40d780bdb11eba7f7acde48001122 | internal_sampler_policy | University of British Columbia | 0/0.33 | 1/1.00 | `The director of the film "Ghost In The Machine" is Rachel Talalay, and according` | `University of British Columbia.` |
| 122b64480baf11ebab90acde48001122 | relation_path_then_decode | Gerberge of Lorraine | 0/0.09 | 1/1.00 | `Based on the evidence provided, we can deduce the following:

- Louis, Count of ` | `Gerberge of Lorraine` |
| e1f0c38c0bda11eba7f7acde48001122 | internal_sampler_policy | France | 0/0.10 | 0/0.20 | `France. Anne of Burgundy's father is John the Fearless, and the evidence states ` | `France. Anne of Burgundy's father is John the Fearless, and the` |
| ddacf7580baf11ebab90acde48001122 | relation_path_then_decode | Eleanor of Provence | 0/0.22 | 1/1.00 | `Based on the evidence provided, Eleanor of Provence is the mother of Edward I of` | `Eleanor of Provence` |
| d9b00ab80bdd11eba7f7acde48001122 | internal_sampler_policy | 2 August 1288 | 0/0.00 | 1/1.00 | `Based on the evidence provided, Joan of Châtillon, also known as Jeanne de Blois` | `2 August 1288.` |
| 6ebe05740bde11eba7f7acde48001122 | internal_sampler_policy | Hilandar | 1/1.00 | 1/1.00 | `Hilandar.` | `Hilandar.` |
| 700dfeea0baf11ebab90acde48001122 | internal_sampler_policy | Bernard-Roger, Count of Bigorre | 0/0.47 | 1/1.00 | `Based on the evidence provided, Sancho Ramírez's maternal grandfather is Bernard` | `Bernard-Roger, Count of Bigorre.` |
| c370b4540bd911eba7f7acde48001122 | internal_sampler_policy | Rasual Butler | 0/0.29 | 1/1.00 | `The spouse of the performer of the song Lolita (Leah LaBelle Song) is Rasual But` | `Rasual Butler.` |
| b3d918160bdd11eba7f7acde48001122 | internal_sampler_policy | Nine Network | 1/1.00 | 1/1.00 | `Nine Network.` | `Nine Network.` |
| 142afa360bde11eba7f7acde48001122 | internal_sampler_policy | Stampede Wrestling | 0/0.24 | 1/1.00 | `Based on the evidence provided, Diana Hart, Davey Boy Smith Jr.'s mother, studie` | `Stampede Wrestling.` |
| b8ef144a0bdd11eba7f7acde48001122 | internal_sampler_policy | British | 0/0.00 | 1/1.00 | `Based on the evidence provided, Thomas Lyon-Bowes, Lord Glamis's father is from ` | `British.` |
| 8c82acb20bda11eba7f7acde48001122 | internal_sampler_policy | United Kingdom | 0/0.24 | 1/1.00 | `The nationality of the performer of the song "Adore You" is United Kingdom, base` | `United Kingdom.` |
| 6ae076e40bde11eba7f7acde48001122 | internal_sampler_policy | US | 0/0.13 | 1/1.00 | `Based on the evidence provided, the father of Andrew Balding, Ian Balding, was b` | `US.` |
| 6b5393240bdc11eba7f7acde48001122 | internal_sampler_policy | National Film Award for Best Music Direction | 0/0.56 | 1/1.00 | `Based on the evidence provided, the composer of film Pataakha, Vishal Bhardwaj, ` | `National Film Award for Best Music Direction.` |
| 3d3bc0720bde11eba7f7acde48001122 | internal_sampler_policy | Queens | 1/1.00 | 1/1.00 | `Queens.` | `Queens.` |
| b411910a0bdd11eba7f7acde48001122 | relation_path_then_decode | Bowdoin College | 0/0.17 | 1/1.00 | `Based on the evidence provided, Henry C. Lord's father graduated from Bowdoin Co` | `Bowdoin College` |
| 7a1d9d7c0bb011ebab90acde48001122 | internal_sampler_policy | Pompey | 0/0.11 | 0/0.22 | `Based on the evidence provided, Cornelia's child is Julia, and Julia's spouse is` | `Pompey is Cornelia's child, and Julia is Cornelia's` |
| d9e3f4aa0bdc11eba7f7acde48001122 | internal_sampler_policy | April 30, 1939 | 0/0.00 | 1/1.00 | `The evidence does not provide the date of birth for Prince Bernhard of Orange-Na` | `April 30, 1939.` |
| 3068a40c0baf11ebab90acde48001122 | relation_path_then_decode | Sigrid the Haughty | 0/0.00 | 1/1.00 | `Based on the evidence provided, Ingegerd Olofsdotter of Sweden's paternal grandm` | `Sigrid the Haughty` |
| b0b7f3700bdb11eba7f7acde48001122 | internal_sampler_policy | Cross Plains | 0/0.18 | 1/1.00 | `The place of death of the creator of Conan the Adventurer (1992 TV series) was C` | `Cross Plains.` |
| 6900298c0bde11eba7f7acde48001122 | internal_sampler_policy | Sydney, Australia | 1/1.00 | 1/1.00 | `Sydney, Australia.` | `Sydney, Australia.` |
| 215f53a00bde11eba7f7acde48001122 | internal_sampler_policy | California | 1/1.00 | 1/1.00 | `California.` | `California.` |
| 9c24e2900bdd11eba7f7acde48001122 | internal_sampler_policy | Norwegian | 1/1.00 | 1/1.00 | `Norwegian.` | `Norwegian.` |
| 2c0d754e0bb011ebab90acde48001122 | internal_sampler_policy | Conrad II | 0/0.19 | 0/0.31 | `Based on the evidence provided, the paternal grandfather of Beatrice I, Abbess o` | `Conrad II, based on the evidence that Beatrice I's father is Henry` |
| 08de5d000baf11ebab90acde48001122 | internal_sampler_policy | Elizabeth of Nevers | 0/0.23 | 1/1.00 | `Based on the evidence provided, the paternal grandmother of John III, Duke of Cl` | `Elizabeth of Nevers.` |
| 096e14a20bde11eba7f7acde48001122 | internal_sampler_policy | Weston Park | 0/0.00 | 1/1.00 | `Based on the evidence provided, the place of death of George Thomas Orlando Brid` | `Weston Park.` |
| d4a23f020bdb11eba7f7acde48001122 | internal_sampler_policy | Qing dynasty | 0/0.18 | 0/0.31 | `Qianlong Emperor's nationality is the Qing dynasty. Given that the Qianlong Empe` | `Qianlong Emperor's nationality is Qing dynasty. Assuming the Qing dynasty was co` |
| 0bedb7e80bdc11eba7f7acde48001122 | internal_sampler_policy | tuberculosis | 0/0.20 | 0/0.20 | `John Middleton Murry's wife, Katherine Mansfield, died from tuberculosis.` | `John Middleton Murry's wife, Katherine Mansfield, died from tuberculosis.` |
| 96d29e2c0bdd11eba7f7acde48001122 | internal_sampler_policy | Roman Empire | 0/0.20 | 1/1.00 | `Based on the evidence provided, Anthemiolus's father, Anthemius, is from the Rom` | `Roman Empire` |
| 5c2a37a20bd911eba7f7acde48001122 | internal_sampler_policy | Arizona | 1/1.00 | 1/1.00 | `Arizona.` | `Arizona.` |
| 534cb9fe0baf11ebab90acde48001122 | internal_sampler_policy | Louis Philippe II, Duke of Orléans | 0/0.42 | 0/0.31 | `Based on the evidence provided, Charles d'Orléans, Duke of Penthièvre's paternal` | `To determine Charles d'Orléans, Duke of Penthièvre's` |
| 73c0065c0bda11eba7f7acde48001122 | internal_sampler_policy | Spanish | 1/1.00 | 0/0.14 | `Spanish.` | `Spanish. Maria of Aragon is cited as having Spanish citizenship, and she is` |
| 62ce8c8e0bde11eba7f7acde48001122 | internal_sampler_policy | Chinese | 0/0.14 | 1/1.00 | `The place of birth of Consort Liang's husband, Emperor Zhang of Han, is Chinese.` | `Chinese.` |
| bb8e4d040bda11eba7f7acde48001122 | internal_sampler_policy | Ashgabat | 0/0.15 | 1/1.00 | `According to the evidence provided, Muza Niyazova's husband, Saparmurat Niyazov,` | `Ashgabat.` |
| ea29ce5a0bd911eba7f7acde48001122 | internal_sampler_policy | Sangeet Natak Akademi Award | 0/0.42 | 1/1.00 | `Based on the evidence provided, the composer of the film Bhookh, Anil Biswas, wo` | `Sangeet Natak Akademi Award.` |
| 1f3ea3b00bb011ebab90acde48001122 | internal_sampler_policy | Louis III, Count of Chiny | 0/0.38 | 0/0.62 | `Based on the evidence provided, Joan, Countess of Chiny's paternal grandfather i` | `Louis III, Count of Chiny. This can be deduced from the evidence` |
| 253e36700bda11eba7f7acde48001122 | relation_path_then_decode | Rabat | 0/0.00 | 1/1.00 | `Based on the given evidence, we cannot determine the place of birth of the fathe` | `Rabat` |
| 3641d5c60bda11eba7f7acde48001122 | internal_sampler_policy | Coventry | 0/0.00 | 1/1.00 | `According to the evidence line E1, Ælfgar's mother is Godgifu. Evidence line E2 ` | `Coventry.` |
| 1869092c0bb011ebab90acde48001122 | relation_path_then_decode | Rukn al-Dawla | 0/0.20 | 1/1.00 | `Based on the evidence provided, Taj al-Dawla's paternal grandfather is Rukn al-D` | `Rukn al-Dawla` |
| 6e3e70200bde11eba7f7acde48001122 | internal_sampler_policy | China | 0/0.08 | 0/0.14 | `Based on the evidence provided, Dexter Young's mother is Connie Chan, and Connie` | `China. This is based on the evidence line E2 which states that Dexter Young` |
| 967b39ca0bdd11eba7f7acde48001122 | internal_sampler_policy | Efva Attling | 0/0.31 | 1/1.00 | `The spouse of the performer of the song "Ängeln i rummet" is Efva Attling.` | `Efva Attling.` |
| 3b9299900bdd11eba7f7acde48001122 | internal_sampler_policy | La Trinité | 1/1.00 | 1/1.00 | `La Trinité.` | `La Trinité.` |
| 1900f7600baf11ebab90acde48001122 | relation_path_then_decode | Hugh de Stafford, 2nd Earl of Stafford | 0/0.48 | 1/1.00 | `Based on the evidence provided, Thomas Stafford, 3rd Earl of Stafford's father i` | `Hugh de Stafford, 2nd Earl of Stafford` |
| 859991680bda11eba7f7acde48001122 | internal_sampler_policy | Västerås | 1/1.00 | 1/1.00 | `Västerås.` | `Västerås.` |
| 6fbdeee60bdc11eba7f7acde48001122 | internal_sampler_policy | Leopoldo Torre Nilsson | 0/0.35 | 0/0.55 | `The child of the director of the film "Lo que le pasó a Reynoso" is Leopoldo Tor` | `Leopoldo Torre Nilsson is the child of the director of the` |
| a0ae26f60baf11ebab90acde48001122 | internal_sampler_policy | Jules Lederer | 0/0.19 | 1/1.00 | `Based on the evidence provided, Margo Howard is Adam Coleman Howard's mother. He` | `Jules Lederer.` |
| 1d0cd6e80bdd11eba7f7acde48001122 | internal_sampler_policy | Paris | 1/1.00 | 1/1.00 | `Paris.` | `Paris.` |
| c818d9480baf11ebab90acde48001122 | relation_path_then_decode | Wigeric of Lotharingia | 0/0.08 | 1/1.00 | `Based on the evidence provided, Frederick of Luxembourg's paternal grandfather i` | `Wigeric of Lotharingia` |
| b26e04e80bdb11eba7f7acde48001122 | internal_sampler_policy | Daniel Alomía Robles | 1/1.00 | 1/1.00 | `Daniel Alomía Robles.` | `Daniel Alomía Robles.` |
| c19b72520bdb11eba7f7acde48001122 | internal_sampler_policy | Xi'an | 1/1.00 | 1/1.00 | `Xi'an` | `Xi'an` |
| eb7ece320bdd11eba7f7acde48001122 | internal_sampler_policy | Stony Brook University | 1/1.00 | 1/1.00 | `Stony Brook University.` | `Stony Brook University.` |
| 747175620bdb11eba7f7acde48001122 | internal_sampler_policy | Helsingfors | 1/1.00 | 1/1.00 | `Helsingfors.` | `Helsingfors.` |
| 9766cddc0bdc11eba7f7acde48001122 | internal_sampler_policy | Studio City | 1/1.00 | 1/1.00 | `Studio City.` | `Studio City.` |
| 36a3fe2a0baf11ebab90acde48001122 | internal_sampler_policy | Richard Burke, 2nd Earl of Clanricarde | 0/0.48 | 1/1.00 | `Based on the evidence provided, Richard Burke, 4th Earl of Clanricarde's paterna` | `Richard Burke, 2nd Earl of Clanricarde.` |
| c5315db80baf11ebab90acde48001122 | relation_path_then_decode | Bernard I, Margrave of Baden-Baden | 0/0.14 | 1/1.00 | `Based on the evidence provided, Jacob I of Baden is the father of John II of Bad` | `Bernard I, Margrave of Baden-Baden` |
| 8e07f1f00bda11eba7f7acde48001122 | internal_sampler_policy | Mapy Cortés | 0/0.25 | 1/1.00 | `The spouse of the director of the film My Three Merry Widows, Fernando Cortés, i` | `Mapy Cortés.` |
| d6be0cee0bdb11eba7f7acde48001122 | internal_sampler_policy | Akhetaten | 0/0.11 | 1/1.00 | `According to the evidence line E1, Meritaten's father is Akhenaten. Evidence lin` | `Akhetaten.` |
| 4aa187080baf11ebab90acde48001122 | relation_path_then_decode | Isabella of Angoulême | 0/0.07 | 1/1.00 | `Based on the evidence provided, there is no direct information about Edward I of` | `Isabella of Angoulême` |
| 11963eee0bb011ebab90acde48001122 | relation_path_then_decode | Henry Styleman | 0/0.27 | 1/1.00 | `Based on the evidence provided, Guy Le Strange's paternal grandfather is Henry L` | `Henry Styleman` |
| 77f3d9300bb011ebab90acde48001122 | internal_sampler_policy | Gaston IV of Foix | 0/0.32 | 1/1.00 | `Based on the evidence provided, Germaine of Foix's paternal grandfather is Gasto` | `Gaston IV of Foix.` |
| 0cd3bdea0bde11eba7f7acde48001122 | internal_sampler_policy | Myanmar Motion Picture Academy Awards | 0/0.50 | 1/1.00 | `The director of the film "Wearing Velvet Slippers Under A Golden Umbrella" won t` | `Myanmar Motion Picture Academy Awards.` |
| b3110a5e0bda11eba7f7acde48001122 | internal_sampler_policy | German | 1/1.00 | 1/1.00 | `German.` | `German.` |
| f64be57a0bdd11eba7f7acde48001122 | internal_sampler_policy | August 7, 2004 | 1/1.00 | 1/1.00 | `August 7, 2004.` | `August 7, 2004.` |
| a5b095c00bdd11eba7f7acde48001122 | internal_sampler_policy | California | 1/1.00 | 1/1.00 | `California.` | `California.` |
| 769106c40bda11eba7f7acde48001122 | internal_sampler_policy | laryngeal cancer | 0/0.17 | 0/0.36 | `The cause of death of the performer of the song "Oh boy, oh boy, oh boy!" is lar` | `Lasse Dahlquist's cause of death was laryngeal cancer. However` |
| 3a3c2efe0bdc11eba7f7acde48001122 | internal_sampler_policy | Germany | 0/0.10 | 1/1.00 | `Based on the evidence provided, Frederick Barbarossa's country of citizenship is` | `Germany.` |
| 3d03e0260bde11eba7f7acde48001122 | internal_sampler_policy | Christ's College, Cambridge | 0/0.27 | 1/1.00 | `Based on the evidence provided, George Lane-Fox's father, James Fox-Lane, was ed` | `Christ's College, Cambridge.` |
| 04b5e0320bdb11eba7f7acde48001122 | internal_sampler_policy | Weimar | 1/1.00 | 0/0.17 | `Weimar.` | `E2 indicates that Goethe's place of death was Weimar. Since Joh` |
| 4a9acefe0baf11ebab90acde48001122 | relation_path_then_decode | Marc Allégret | 0/0.08 | 1/1.00 | `Based on the evidence provided, Yves Allégret is the father of Catherine Allégre` | `Marc Allégret` |
| c8c9313a0baf11ebab90acde48001122 | relation_path_then_decode | Jerome, 4th Count de Salis-Soglio | 0/0.08 | 1/1.00 | `Based on the evidence provided, the paternal grandfather of George Fane De Salis` | `Jerome, 4th Count de Salis-Soglio` |
| c1b9c0ac0bdd11eba7f7acde48001122 | internal_sampler_policy | 23 February 1473 | 1/1.00 | 1/1.00 | `23 February 1473.` | `23 February 1473.` |
| ab18549a0bdc11eba7f7acde48001122 | internal_sampler_policy | Billy Ray Cyrus | 0/0.25 | 1/1.00 | `Based on the evidence provided, the composer of the song "I Miss You" is Miley C` | `Billy Ray Cyrus.` |
| 3705552a0bb011ebab90acde48001122 | internal_sampler_policy | Louis-Alexandre Berthier | 0/0.21 | 1/1.00 | `Based on the evidence provided, Alexandre Berthier, 3rd Prince of Wagram's pater` | `Louis-Alexandre Berthier.` |
| 2d907ba60bdc11eba7f7acde48001122 | internal_sampler_policy | New York | 1/1.00 | 1/1.00 | `New York` | `New York` |
| 1efc66b60bde11eba7f7acde48001122 | internal_sampler_policy | Forlì | 0/0.15 | 1/1.00 | `Based on the evidence provided, Bianca Riario's father, Girolamo Riario, died in` | `Forlì.` |
| 5f5002360bd911eba7f7acde48001122 | internal_sampler_policy | Hyderabad | 1/1.00 | 1/1.00 | `Hyderabad.` | `Hyderabad.` |
| 9e68cdc20bd911eba7f7acde48001122 | internal_sampler_policy | Gloria Loring | 1/1.00 | 1/1.00 | `Gloria Loring` | `Gloria Loring.` |
| 1655fd7a0bdd11eba7f7acde48001122 | relation_path_then_decode | Lancing College | 0/0.00 | 1/1.00 | `Based on the evidence provided, Princess Tamar Mikheilis Asuli Bagration-Imereti` | `Lancing College` |
| eeb017fa0bdd11eba7f7acde48001122 | internal_sampler_policy | Edinburgh | 1/1.00 | 1/1.00 | `Edinburgh.` | `Edinburgh.` |
| 565f05fc0bdc11eba7f7acde48001122 | internal_sampler_policy | St John's College | 0/0.26 | 1/1.00 | `Based on the evidence provided, Edmund Tudor, 1st Earl of Richmond's wife, Lady ` | `St John's College.` |
| ef4907cc0baf11ebab90acde48001122 | relation_path_then_decode | Kitiyakara Voralaksana | 0/0.00 | 1/1.00 | `Based on the evidence provided, we cannot directly determine Busba Kitiyakara's ` | `Kitiyakara Voralaksana` |
| ba773ad00bd911eba7f7acde48001122 | internal_sampler_policy | Yash Johar | 0/0.29 | 1/1.00 | `The father of the director of the film Ae Dil Hai Mushkil is Yash Johar.` | `Yash Johar.` |
| 90bad89e0bdb11eba7f7acde48001122 | internal_sampler_policy | San Juan, Puerto Rico | 1/1.00 | 1/1.00 | `San Juan, Puerto Rico.` | `San Juan, Puerto Rico.` |
| 07e964920bde11eba7f7acde48001122 | internal_sampler_policy | Pavia | 1/1.00 | 1/1.00 | `Pavia.` | `Pavia.` |
| 6c7f03240bdb11eba7f7acde48001122 | internal_sampler_policy | Évreux | 1/1.00 | 1/1.00 | `Évreux.` | `Évreux.` |
| e61479860bda11eba7f7acde48001122 | internal_sampler_policy | Reykjavík | 0/0.12 | 1/1.00 | `The place of birth of the performer of the song Pluto is Reykjavík, as evidenced` | `Reykjavík.` |
| dea2ea800bd911eba7f7acde48001122 | internal_sampler_policy | Munich | 1/1.00 | 1/1.00 | `Munich.` | `Munich.` |
| b7de2a860bd911eba7f7acde48001122 | internal_sampler_policy | Maureen O'Sullivan | 0/0.31 | 1/1.00 | `The spouse of the director of the film "West of Shanghai" is Maureen O'Sullivan.` | `Maureen O'Sullivan` |
| dbcd3f5e0bd911eba7f7acde48001122 | internal_sampler_policy | shot | 0/0.13 | 1/1.00 | `The cause of death of the composer of the song "Look at Me!" (XXXTentacion's son` | `shot.` |
| 0c0830a00baf11ebab90acde48001122 | internal_sampler_policy | Elizabeth the Cuman | 0/0.00 | 1/1.00 | `Based on the evidence provided, Constantine Palaiologos Komnenos Palaiologos's m` | `Elizabeth the Cuman.` |
| 960b5ec00bdd11eba7f7acde48001122 | internal_sampler_policy | Abilene | 1/1.00 | 1/1.00 | `Abilene.` | `Abilene.` |
| 077b294e0bdb11eba7f7acde48001122 | internal_sampler_policy | Tehran | 1/1.00 | 1/1.00 | `Tehran.` | `Tehran.` |
| 9e506db00bdc11eba7f7acde48001122 | relation_path_then_decode | Käbi Laretei | 0/0.00 | 1/1.00 | `Based on the evidence provided, the mother of the director Brenda Brave is Danie` | `Käbi Laretei` |
| bac99ab40bd911eba7f7acde48001122 | relation_path_then_decode | Great Pyramid of Giza | 0/0.36 | 1/1.00 | `According to the evidence line E2, the place of burial of Meritites I's husband,` | `Great Pyramid of Giza` |
| c3c94d0a0bdc11eba7f7acde48001122 | internal_sampler_policy | Víctor Bó | 0/0.20 | 0/0.33 | `Based on the evidence provided, Víctor Bó is the child of the director of the fi` | `Víctor Bó is the child of the director of the film La Le` |
| ab94845c0baf11ebab90acde48001122 | relation_path_then_decode | Theuderic I | 0/0.11 | 1/1.00 | `Based on the evidence provided, Wisigard's father-in-law is Theudebert I. Howeve` | `Theuderic I` |
| 6b3de52e0bdc11eba7f7acde48001122 | internal_sampler_policy | Kirchheim unter Teck | 0/0.00 | 1/1.00 | `Based on the evidence provided, the place of death of Duchess Maria Dorothea of ` | `Kirchheim unter Teck.` |
| 1bd49ae00bdd11eba7f7acde48001122 | internal_sampler_policy | Colorado | 1/1.00 | 1/1.00 | `Colorado.` | `Colorado.` |
| 1837ca440bdb11eba7f7acde48001122 | internal_sampler_policy | Viennese | 1/1.00 | 1/1.00 | `Viennese.` | `Viennese.` |
| 2dba81d80bde11eba7f7acde48001122 | internal_sampler_policy | hanged, drawn and quartered | 0/0.40 | 1/1.00 | `The cause of death of Eleanor de Clare's husband, Hugh Despenser the Younger, wa` | `Hanged, drawn and quartered.` |
| 9977d29c0bdc11eba7f7acde48001122 | internal_sampler_policy | illness | 0/0.10 | 1/1.00 | `The cause of death of the performer of the song "Voi Voi" is illness. The perfor` | ` illness` |
| 774fa4e20bdc11eba7f7acde48001122 | internal_sampler_policy | 21 June 1483 | 0/0.18 | 1/1.00 | `According to the evidence provided, Engelbert of Cleves, Count of Nevers's mothe` | `21 June 1483.` |
| c9c3137e0bd911eba7f7acde48001122 | internal_sampler_policy | Huntington's disease | 0/0.20 | 1/1.00 | `The performer of the song "Ludlow Massacre" died due to Huntington's disease. Ac` | `Huntington's disease.` |
| 0c585dbc0bde11eba7f7acde48001122 | internal_sampler_policy | Suffield, Connecticut | 1/1.00 | 1/1.00 | `Suffield, Connecticut.` | `Suffield, Connecticut.` |
| ad6e5c1c0baf11ebab90acde48001122 | relation_path_then_decode | Ragnild Magnusdotter | 0/0.00 | 1/1.00 | `Based on the evidence provided, Harald Kesja is the father of Olaf (Ii) Haraldse` | `Ragnild Magnusdotter` |
| 96fb4aee0baf11ebab90acde48001122 | relation_path_then_decode | Urraca of Castile | 0/0.07 | 1/1.00 | `Based on the evidence provided, we cannot determine Blanche of Portugal's patern` | `Urraca of Castile` |
| b3f0c5ce0bdd11eba7f7acde48001122 | internal_sampler_policy | Germany | 0/0.09 | 0/0.15 | `Germany. This is inferred from the evidence that Adelaide of Holland, Florent of` | `Germany. This is inferred from the evidence line E1, which states that Flo` |
| bc69662a0bdd11eba7f7acde48001122 | internal_sampler_policy | Poznań | 1/1.00 | 1/1.00 | `Poznań.` | `Poznań.` |
| b65877e20bda11eba7f7acde48001122 | internal_sampler_policy | Alena Mihulová | 0/0.33 | 1/1.00 | `The spouse of the director of film Noc Nevěsty is Alena Mihulová.` | `Alena Mihulová` |
| 2c43f3d40bde11eba7f7acde48001122 | internal_sampler_policy | Ischia | 0/0.10 | 1/1.00 | `According to the evidence lines, the composer of the film "Henry V" (1944 Film) ` | `Ischia.` |
| f97bacb20bdd11eba7f7acde48001122 | internal_sampler_policy | Paris | 0/0.10 | 1/1.00 | `According to the evidence lines, the director of film "The Gallant Lords of Bois` | `Paris.` |
| 3ccbcad20bda11eba7f7acde48001122 | internal_sampler_policy | Palos Verdes | 1/1.00 | 1/1.00 | `Palos Verdes.` | `Palos Verdes.` |
| 70ec660c0bdd11eba7f7acde48001122 | internal_sampler_policy | France | 1/1.00 | 1/1.00 | `France.` | `France.` |
| 7b52cb9e0bd911eba7f7acde48001122 | internal_sampler_policy | Naha, Okinawa | 1/1.00 | 1/1.00 | `Naha, Okinawa.` | `Naha, Okinawa.` |
| 4a053eb00bb011ebab90acde48001122 | internal_sampler_policy | Lady Anne Campbell | 0/0.24 | 1/1.00 | `Based on the evidence provided, Charles Gordon, 2nd Earl of Aboyne's paternal gr` | `Lady Anne Campbell.` |
| 850c2ecc0bda11eba7f7acde48001122 | internal_sampler_policy | Theni | 1/1.00 | 1/1.00 | `Theni.` | `Theni.` |
| e41c14820bd911eba7f7acde48001122 | internal_sampler_policy | Cahiers du cinéma | 1/1.00 | 1/1.00 | `Cahiers du cinéma.` | `Cahiers du cinéma.` |
| 20a118cc0bde11eba7f7acde48001122 | internal_sampler_policy | Johannesburg, South Africa | 1/1.00 | 1/1.00 | `Johannesburg, South Africa.` | `Johannesburg, South Africa.` |
| a703e1160bdd11eba7f7acde48001122 | internal_sampler_policy | Rimini | 1/1.00 | 1/1.00 | `Rimini.` | `Rimini.` |
| 7e73e6560bdd11eba7f7acde48001122 | internal_sampler_policy | Prostějov | 1/1.00 | 1/1.00 | `Prostějov.` | `Prostějov` |
| cff878c20bdb11eba7f7acde48001122 | internal_sampler_policy | Cebu | 1/1.00 | 1/1.00 | `Cebu.` | `Cebu.` |
| 133b785c0bda11eba7f7acde48001122 | internal_sampler_policy | Rome | 0/0.09 | 1/1.00 | `The place of death of the director of film Scugnizzi was Rome. This can be deduc` | `Rome.` |
| 81c9a46c0bb011ebab90acde48001122 | relation_path_then_decode | Joana de Prades | 0/0.00 | 1/1.00 | `The evidence provided does not contain information about who Juan Ramón II, Coun` | `Joana de Prades` |
| c81d185a0baf11ebab90acde48001122 | internal_sampler_policy | Henrietta Susanna Tracy | 0/0.32 | 1/1.00 | `Based on the evidence provided, the paternal grandmother of Sudeley Hanbury-Trac` | `Henrietta Susanna Tracy.` |
| 171e51c60bdd11eba7f7acde48001122 | internal_sampler_policy | Fårö | 0/0.10 | 1/1.00 | `Based on the evidence provided, the director of the film "Music in Darkness" is ` | `Fårö.` |
| 1c0dd3b00bdc11eba7f7acde48001122 | relation_path_then_decode | Polish-Lithuanian Commonwealth | 0/0.36 | 1/1.00 | `Poland, as Stanisław Koniecpolski is a citizen of the Polish-Lithuanian Commonwe` | `Polish-Lithuanian Commonwealth` |
| c77037480baf11ebab90acde48001122 | relation_path_then_decode | Archibald Acheson, 2nd Earl of Gosford | 0/0.26 | 1/1.00 | `Based on the evidence provided, we can trace the paternal lineage as follows:

-` | `Archibald Acheson, 2nd Earl of Gosford` |
| 27e835ee0bb011ebab90acde48001122 | internal_sampler_policy | Sir Arthur Gore, 2nd Baronet | 0/0.21 | 1/1.00 | `Based on the evidence provided, we cannot directly determine who Arthur Gore, 2n` | `Sir Arthur Gore, 2nd Baronet.` |
| d15be72e0bdd11eba7f7acde48001122 | internal_sampler_policy | Lewes | 1/1.00 | 1/1.00 | `Lewes.` | `Lewes.` |
| 5db7e2d80bdc11eba7f7acde48001122 | internal_sampler_policy | Bratislava | 1/1.00 | 1/1.00 | `Bratislava.` | `Bratislava.` |
| 49eb87280bdc11eba7f7acde48001122 | internal_sampler_policy | Westerland | 0/0.00 | 1/1.00 | `Based on the evidence provided, the director of the film Don Juan (1922) is Albe` | `Westerland.` |
| 5e418da00bda11eba7f7acde48001122 | internal_sampler_policy | London | 1/1.00 | 1/1.00 | `London.` | `London.` |
| d6b470160baf11ebab90acde48001122 | internal_sampler_policy | Infanta Maria Antonia of Portugal | 0/0.11 | 0/0.67 | `Based on the evidence provided, Archduessess Elisabeth of Austria (1922–1993) is` | `Infanta Maria Antonia of Portugal is the maternal grandmother of Archduchess` |
| 32ebe13e0bb011ebab90acde48001122 | relation_path_then_decode | Albert II, Prince of Anhalt-Zerbst | 0/0.32 | 1/1.00 | `Based on the given evidence, we can trace the lineage as follows:

- Albert IV, ` | `Albert II, Prince of Anhalt-Zerbst.` |
| a022d8580bdc11eba7f7acde48001122 | relation_path_then_decode | Ridley Scott | 0/0.10 | 1/1.00 | `Based on the evidence provided, the director of film Plunkett & Macleane is Jake` | `Ridley Scott` |
| 962889100baf11ebab90acde48001122 | relation_path_then_decode | Longqing | 0/0.00 | 1/1.00 | `There is no evidence provided about Wang Xijie or his father-in-law in the given` | `Longqing` |
| 314f72c20bde11eba7f7acde48001122 | internal_sampler_policy | United States | 0/0.17 | 1/1.00 | `The nationality of the director of film Rise Above: The Tribe 8 Documentary is U` | `United States.` |
| 702515e80bdd11eba7f7acde48001122 | internal_sampler_policy | India | 1/1.00 | 1/1.00 | `India.` | `India.` |
| 931a85420bdd11eba7f7acde48001122 | internal_sampler_policy | London | 0/0.13 | 1/1.00 | `Based on the evidence provided, Lord Patrick Crichton-Stuart's father, John Stua` | `London.` |
| 8cd3fe6c0baf11ebab90acde48001122 | internal_sampler_policy | Fíngen mac Áedo Duib | 0/0.08 | 0/0.13 | `Based on the evidence provided, there is no direct information about Colgú mac F` | `There is no evidence provided that directly states Colgú mac Faílbe` |
| 93dec34e0bdd11eba7f7acde48001122 | internal_sampler_policy | France | 1/1.00 | 1/1.00 | `France.` | `France.` |
| 475b89f80bb011ebab90acde48001122 | internal_sampler_policy | Thyra | 0/0.10 | 1/1.00 | `Based on the evidence provided, Thyra is the mother of Harald Bluetooth, and sin` | `Thyra.` |
| 86ae8b920baf11ebab90acde48001122 | internal_sampler_policy | Alexander III of Russia | 0/0.30 | 1/1.00 | `Based on the evidence provided, Prince Dmitri Alexandrovich of Russia's maternal` | `Alexander III of Russia.` |
| 9997225c0bda11eba7f7acde48001122 | internal_sampler_policy | Forest Lawn Memorial Park | 1/1.00 | 1/1.00 | `Forest Lawn Memorial Park.` | `Forest Lawn Memorial Park.` |
| 3f5194f00bb011ebab90acde48001122 | relation_path_then_decode | Prince Harald of Denmark | 0/0.29 | 1/1.00 | `Based on the evidence provided, we can deduce the following:

- Prince Harald of` | `Prince Harald of Denmark` |
| ae741c140bdc11eba7f7acde48001122 | relation_path_then_decode | Lezhë | 0/0.00 | 1/1.00 | `Based on the evidence provided, we cannot determine the place of burial of Gjon ` | `Lezhë` |
| 85dd56440baf11ebab90acde48001122 | relation_path_then_decode | Mark Hanna | 0/0.08 | 1/1.00 | `The evidence provided does not include information about Albert G. Simms's fathe` | `Mark Hanna` |
| 5a34b04e0bd911eba7f7acde48001122 | internal_sampler_policy | France | 0/0.08 | 1/1.00 | `Based on the evidence provided, Matilda of Frisia's husband, Henry I, is stated ` | `France.` |
| a9ef43f80baf11ebab90acde48001122 | internal_sampler_policy | Charles VI of France | 0/0.30 | 1/1.00 | `Based on the evidence provided, Joan of Valois, Duchess of Alençon's maternal gr` | `Charles VI of France.` |
| 0bbded440bda11eba7f7acde48001122 | internal_sampler_policy | Pakistan | 1/1.00 | 1/1.00 | `Pakistan.` | `Pakistan.` |
| 411de60c0bde11eba7f7acde48001122 | internal_sampler_policy | Oslo | 0/0.12 | 1/1.00 | `Based on the evidence provided, the mother of Emilie Hegh Arntzen, Hanne Hegh, w` | `Oslo.` |
| 2fcf02980bdc11eba7f7acde48001122 | internal_sampler_policy | American | 0/0.10 | 1/1.00 | `Based on the evidence provided, the director of the film "West 32nd" is Michael ` | `American.` |
| 24835b720bb011ebab90acde48001122 | relation_path_then_decode | Meresankh II | 0/0.00 | 1/1.00 | `Based on the evidence provided, Iynefer II's spouse is Nefertkau III, and Nefert` | `Meresankh II` |
| 0365ca8e0baf11ebab90acde48001122 | relation_path_then_decode | Farwah bint al-Qasim | 0/0.00 | 1/1.00 | `Based on the evidence provided, we cannot determine Isma'il ibn Ja'far's paterna` | `Farwah bint al-Qasim` |
| 0f3c04300bdd11eba7f7acde48001122 | internal_sampler_policy | Helsinki | 1/1.00 | 1/1.00 | `Helsinki.` | `Helsinki.` |
| c289098a0bdc11eba7f7acde48001122 | internal_sampler_policy | Valparaíso | 1/1.00 | 1/1.00 | `Valparaíso.` | `Valparaíso.` |
| dffa1f8a0bdd11eba7f7acde48001122 | internal_sampler_policy | Kingsbury, London | 0/0.17 | 1/1.00 | `According to the evidence line E1, XYZ has part Chris Squire. Evidence line E2 s` | `Kingsbury, London.` |
| 38ad21b40bdd11eba7f7acde48001122 | internal_sampler_policy | Königstein im Taunus | 1/1.00 | 1/1.00 | `Königstein im Taunus.` | `Königstein im Taunus.` |
| 956a70660bdb11eba7f7acde48001122 | relation_path_then_decode | 10 November 1871 | 0/0.00 | 1/1.00 | `According to the evidence provided, Prince Gustav of Thurn and Taxis's father, M` | `10 November 1871` |
| 1b911ab00bdb11eba7f7acde48001122 | internal_sampler_policy | Torgau | 1/1.00 | 1/1.00 | `Torgau.` | `Torgau.` |
| 258867240bdd11eba7f7acde48001122 | internal_sampler_policy | Winnipeg, Manitoba | 1/1.00 | 1/1.00 | `Winnipeg, Manitoba.` | `Winnipeg, Manitoba.` |
| d64d24180bd911eba7f7acde48001122 | internal_sampler_policy | Weston-super-Mare, Somerset | 1/1.00 | 1/1.00 | `Weston-super-Mare, Somerset.` | `Weston-super-Mare, Somerset.` |
| 9caa68c80bda11eba7f7acde48001122 | internal_sampler_policy | 20 April 1434 | 0/0.18 | 1/1.00 | `According to the evidence provided, the date of death of Siemowit V of Masovia's` | `20 April 1434` |
| 146c16520bdd11eba7f7acde48001122 | internal_sampler_policy | Florida Atlantic | 0/0.25 | 1/1.00 | `Based on the evidence provided, the director of the film Barracuda, Wayne Crawfo` | `Florida Atlantic.` |
| 57eac88c0bde11eba7f7acde48001122 | internal_sampler_policy | West Branch, Iowa | 1/1.00 | 1/1.00 | `West Branch, Iowa.` | `West Branch, Iowa.` |
| 086e57720bdb11eba7f7acde48001122 | internal_sampler_policy | British | 1/1.00 | 1/1.00 | `British.` | `British.` |
| 63d16c1c0bdb11eba7f7acde48001122 | internal_sampler_policy | Saqqara | 1/1.00 | 1/1.00 | `Saqqara.` | `Saqqara.` |
| 677658e80bde11eba7f7acde48001122 | internal_sampler_policy | Irish | 0/0.10 | 1/1.00 | `Based on the evidence provided, the composer of the song "Seconds" is Bono, and ` | `Irish.` |
| bead88300bdd11eba7f7acde48001122 | internal_sampler_policy | Celle | 0/0.09 | 1/1.00 | `Based on the evidence provided, the place of death of Princess Louise Auguste of` | `Celle.` |
| 1bfdd2d20bda11eba7f7acde48001122 | internal_sampler_policy | Otto Carlmar | 0/0.33 | 0/0.33 | `The spouse of the director of film På Solsiden is Otto Carlmar.` | `Otto Carlmar is the spouse of the director of film På Solsiden` |
| 8da9737a0bb011ebab90acde48001122 | relation_path_then_decode | Prince Yi Kang | 0/0.07 | 1/1.00 | `Based on the evidence provided, we cannot definitively determine who the paterna` | `Prince Yi Kang` |
| f9dcb4a60bda11eba7f7acde48001122 | internal_sampler_policy | Missoula, Montana | 0/0.22 | 1/1.00 | `Based on the evidence provided, the director of film Ronnie Rocket, David Lynch,` | `Missoula, Montana.` |
| 3cbd107e0bde11eba7f7acde48001122 | internal_sampler_policy | Fukuoka | 1/1.00 | 1/1.00 | `Fukuoka.` | `Fukuoka.` |
| 5e8240ea0bdd11eba7f7acde48001122 | internal_sampler_policy | Roma | 1/1.00 | 1/1.00 | `Roma.` | `Roma.` |
| 6638110e0bdb11eba7f7acde48001122 | relation_path_then_decode | Moscow, USSR | 0/0.00 | 1/1.00 | `Based on the evidence provided, we cannot directly determine the place of birth ` | `Moscow, USSR` |
| 3972d2b60baf11ebab90acde48001122 | relation_path_then_decode | Jeanne d'Albret | 0/0.00 | 1/1.00 | `Based on the evidence provided, we cannot determine Gaston, Duke of Orléans's pa` | `Jeanne d'Albret` |
| a8cbc4c40bdc11eba7f7acde48001122 | internal_sampler_policy | New York | 1/1.00 | 1/1.00 | `New York.` | `New York.` |
| 32e50df00bb011ebab90acde48001122 | internal_sampler_policy | Louis II | 0/0.00 | 1/1.00 | `Based on the evidence provided, Hermann I is the father-in-law of Sophia of Witt` | `Louis II.` |
| deb907f80bdd11eba7f7acde48001122 | internal_sampler_policy | Bohemia | 0/0.14 | 1/1.00 | `The place of death of Lambert I of Louvain's father, Reginar III, was Bohemia.` | `Bohemia.` |
| b81fbe620bdc11eba7f7acde48001122 | internal_sampler_policy | Gura Humorului | 1/1.00 | 1/1.00 | `Gura Humorului.` | `Gura Humorului.` |
| 3717c0600bde11eba7f7acde48001122 | internal_sampler_policy | Meran | 1/1.00 | 1/1.00 | `Meran.` | `Meran.` |
| 0f1ac1a00bdb11eba7f7acde48001122 | internal_sampler_policy | Grammy | 0/0.18 | 1/1.00 | `The performer of song Sunday Papers, Joe Jackson, earned a Grammy award.` | `Grammy.` |
| 8981e1ce0bb011ebab90acde48001122 | relation_path_then_decode | Charles Armand René de La Trémoille | 0/0.31 | 1/1.00 | `Based on the evidence provided, Charles Bretagne Marie de La Trémoille's paterna` | `Charles Armand René de La Trémoille` |
| 07388c7c0bb011ebab90acde48001122 | internal_sampler_policy | Peter I | 0/0.00 | 1/1.00 | `According to evidence line E1, Amadeus VII, Count of Savoy's mother is Bonne of ` | `Peter I.` |
| 6b55ac320bdb11eba7f7acde48001122 | internal_sampler_policy | 24 March 1927 | 0/0.00 | 1/1.00 | `According to the evidence provided, Princess Elisabeth of Saxe-Altenburg, who wa` | `24 March 1927.` |
| 424d56700bde11eba7f7acde48001122 | internal_sampler_policy | Ostrogothic Kingdom | 0/0.00 | 1/1.00 | `Based on the evidence provided, Audofleda's husband is Theodoric the Great, and ` | `Ostrogothic Kingdom.` |
| 5c0c69f80bdd11eba7f7acde48001122 | internal_sampler_policy | Kurdish | 1/1.00 | 1/1.00 | `Kurdish.` | `Kurdish.` |
| 29427eea0bdd11eba7f7acde48001122 | internal_sampler_policy | Liverpool | 0/0.00 | 1/1.00 | `According to the evidence line E1, the performer of the song "God" (performed by` | `Liverpool.` |
| bc633e2c0baf11ebab90acde48001122 | internal_sampler_policy | Louis, Grand Dauphin | 0/0.25 | 1/1.00 | `Based on the evidence provided, Maria Luisa of Savoy's father-in-law is Louis, G` | `Louis, Grand Dauphin.` |
| 2b4bd5020baf11ebab90acde48001122 | internal_sampler_policy | Kujō Michiie | 0/0.14 | 0/0.17 | `Based on the evidence provided, Kujō Yoritsune is the paternal grandfather of Ku` | `To answer the question "Who is the paternal grandfather of Kujō Yor` |
| 3647118c0bdd11eba7f7acde48001122 | internal_sampler_policy | Madrid | 0/0.10 | 1/1.00 | `Based on the evidence provided, the place of birth of the director of the film M` | `Madrid.` |
| ea1fc06c0bda11eba7f7acde48001122 | internal_sampler_policy | United Nations | 0/0.27 | 1/1.00 | `According to the evidence lines, Karin Stoltenberg's husband, Thorvald Stoltenbe` | `United Nations.` |
| 00c75ffc0bde11eba7f7acde48001122 | internal_sampler_policy | Paris | 0/0.00 | 1/1.00 | `According to the evidence line E1, the director of film Lettre Ouverte is Alex J` | `Paris.` |
| 019bed300bde11eba7f7acde48001122 | internal_sampler_policy | Galați | 0/0.00 | 1/1.00 | `Based on the evidence provided, the father of Ștefan I. Nenițescu, Ioan S. Neniț` | `Galați.` |
| 94198d580bb011ebab90acde48001122 | relation_path_then_decode | Mathilde of Bourbon | 0/0.07 | 1/1.00 | `Based on the evidence provided, William II, Count of Flanders's paternal grandmo` | `Mathilde of Bourbon` |
| 71d8e20e0bdb11eba7f7acde48001122 | internal_sampler_policy | London | 1/1.00 | 1/1.00 | `London.` | `London.` |
| e701105e0bdd11eba7f7acde48001122 | internal_sampler_policy | Königsberg | 0/0.12 | 1/1.00 | `The place of burial of Albert Frederick, Duke of Prussia's mother, Anna Marie of` | `Königsberg.` |
| b5e9ef2c0bdd11eba7f7acde48001122 | internal_sampler_policy | Homs | 0/0.15 | 1/1.00 | `The place of death of Juan Carlos Gumucio's wife, Marie Colvin, was Homs.` | `Homs.` |
| 48c8f7f80bdd11eba7f7acde48001122 | internal_sampler_policy | Alain Poiré | 0/0.29 | 1/1.00 | `The father of the director of the film "Gramps Is In The Resistance" is Alain Po` | `Alain Poiré.` |
| aa0370860bdb11eba7f7acde48001122 | internal_sampler_policy | Naha, Okinawa | 1/1.00 | 1/1.00 | `Naha, Okinawa.` | `Naha, Okinawa.` |
| a5bed06e0bdc11eba7f7acde48001122 | relation_path_then_decode | Byzantine | 0/0.12 | 1/1.00 | `Based on the evidence provided, Philip of Ibelin's mother, Maria Komnene, has a ` | `Byzantine` |
| 2294ccfc0bdc11eba7f7acde48001122 | internal_sampler_policy | August 8, 1975 | 1/1.00 | 1/1.00 | `August 8, 1975.` | `August 8, 1975.` |
| e8d8f7200bdd11eba7f7acde48001122 | internal_sampler_policy | Chuck Schumer | 0/0.36 | 0/0.36 | `Huma Abedin's husband, Anthony Weiner, works for Chuck Schumer.` | `Huma Abedin's husband, Anthony Weiner, works for Chuck Schumer.` |
| 844fe30c0bda11eba7f7acde48001122 | internal_sampler_policy | Florence | 0/0.00 | 1/1.00 | `According to the evidence line E1, Giacomo Feo's wife was Caterina Sforza. Evide` | `Florence.` |
| 2ec440560bb011ebab90acde48001122 | relation_path_then_decode | Ptolemy IX Lathyros | 0/0.21 | 1/1.00 | `Based on the evidence provided, Cleopatra IV is the mother of Antiochus X Eusebe` | `Ptolemy IX Lathyros` |
| c32ac4ca0bda11eba7f7acde48001122 | internal_sampler_policy | Helsingfors | 1/1.00 | 1/1.00 | `Helsingfors` | `Helsingfors` |
| 6021e2d80bde11eba7f7acde48001122 | internal_sampler_policy | Dutch | 0/0.00 | 0/0.17 | `Based on the evidence provided, Jan Baptist van Rensselaer's father, Kiliaen van` | `D1 Dutch. This can be inferred from E1 and E2, which` |
| b5b63b160bdb11eba7f7acde48001122 | internal_sampler_policy | Tisch | 1/1.00 | 1/1.00 | `Tisch.` | `Tisch.` |
| 4b1b91720bde11eba7f7acde48001122 | internal_sampler_policy | India | 0/0.10 | 0/0.18 | `Based on the evidence lines provided, Geodeung of Gaya's mother is Heo Hwang-ok,` | `India. This is because Heo Hwang-ok, who is the mother of` |
| 0458640a0bdd11eba7f7acde48001122 | internal_sampler_policy | leukemia | 1/1.00 | 1/1.00 | `Leukemia.` | `Leukemia.` |
| 94dd39d80bdd11eba7f7acde48001122 | internal_sampler_policy | Herstal | 1/1.00 | 1/1.00 | `Herstal.` | `Herstal.` |
| abc68a180bd911eba7f7acde48001122 | internal_sampler_policy | 22 January 1794 | 0/0.33 | 1/1.00 | `Based on the evidence provided, Lord Patrick Crichton-Stuart's father, John Stua` | `22 January 1794.` |
| 97ce0ec00baf11ebab90acde48001122 | relation_path_then_decode | Stanisław Leszczyński | 0/0.00 | 1/1.00 | `Based on the evidence provided, Anne "Henriette" of France is the mother of Mari` | `Stanisław Leszczyński` |
| 04a544a40bde11eba7f7acde48001122 | relation_path_then_decode | 3 August 979 | 0/0.00 | 1/1.00 | `Based on the evidence provided, the date of death of Gero II, Margrave of the Sa` | `3 August 979` |
| a08505d20bdc11eba7f7acde48001122 | relation_path_then_decode | Aldo Parisot | 0/0.25 | 1/1.00 | `Based on the evidence provided, the father of the director of film "Red 2" is Al` | `Aldo Parisot` |
| 464cfa460bd911eba7f7acde48001122 | internal_sampler_policy | Brooklyn | 0/0.11 | 1/1.00 | `According to the evidence lines, the director of film Thomas Jefferson (Film) is` | `Brooklyn.` |
| 982f8e440bdb11eba7f7acde48001122 | internal_sampler_policy | 1886 | 0/0.12 | 1/1.00 | `According to evidence line E2, Sigma Xi, the company that published American Sci` | `1886.` |
| 5142f59e0bda11eba7f7acde48001122 | relation_path_then_decode | Nevele | 0/0.00 | 1/1.00 | `Based on the evidence provided, we cannot determine the place of birth of Jo Pla` | `Nevele` |
| 041581680bdc11eba7f7acde48001122 | internal_sampler_policy | Manchester | 0/0.11 | 1/1.00 | `Based on the evidence provided, the place of birth of Gwilym Lloyd George's fath` | `Manchester.` |
| ad43c9300bdb11eba7f7acde48001122 | internal_sampler_policy | Tantallon Castle | 1/1.00 | 1/1.00 | `Tantallon Castle.` | `Tantallon Castle.` |
| 5839dbac0bde11eba7f7acde48001122 | internal_sampler_policy | American | 0/0.11 | 1/1.00 | `The nationality of the director of the film "They Call It Love" is American, as ` | `American.` |
| 22d296de0bde11eba7f7acde48001122 | internal_sampler_policy | Sochi | 1/1.00 | 1/1.00 | `Sochi.` | `Sochi.` |
| 9c3ff1040bdb11eba7f7acde48001122 | internal_sampler_policy | French | 1/1.00 | 1/1.00 | `French.` | `French.` |
| 81ca57e60bdc11eba7f7acde48001122 | internal_sampler_policy | Winnipeg, Manitoba | 1/1.00 | 1/1.00 | `Winnipeg, Manitoba.` | `Winnipeg, Manitoba.` |
| 30ee74680bde11eba7f7acde48001122 | internal_sampler_policy | Villafranca del Bierzo | 0/0.00 | 0/0.55 | `Based on the evidence provided, the father of Eleonora di Garzia di Toledo, Garc` | `Villafranca del Bierzo. However, the evidence provided does not` |
| f491b33e0bda11eba7f7acde48001122 | internal_sampler_policy | Jean Hersholt Humanitarian Award | 0/0.35 | 1/1.00 | `The director of the film "The Last Night of the Barbary Coast" got the Jean Hers` | `Jean Hersholt Humanitarian Award.` |
| c05e16a40bdd11eba7f7acde48001122 | relation_path_then_decode | stroke | 0/0.00 | 1/1.00 | `Princess Victoria Melita of Saxe-Coburg and Gotha, the wife of Grand Duke Kirill` | `stroke` |
| 5b637e060bb011ebab90acde48001122 | relation_path_then_decode | Princess Madeleine, Duchess of Hälsingland and Gästrikland | 0/0.13 | 1/1.00 | `Based on the provided evidence, we cannot determine Prince Nicolas of Sweden, Du` | `Princess Madeleine, Duchess of Hälsingland and Gästrikland` |
| 1a2188840bb011ebab90acde48001122 | relation_path_then_decode | Princess Augusta of Schwarzburg-Sondershausen | 0/0.24 | 1/1.00 | `Based on the evidence provided, Princess Augusta of Waldeck-Pyrmont's father is ` | `Princess Augusta of Schwarzburg-Sondershausen` |
| d1fd9cbe0bdc11eba7f7acde48001122 | internal_sampler_policy | Cahiers du cinéma | 1/1.00 | 1/1.00 | `Cahiers du cinéma.` | `Cahiers du cinéma.` |
| f6e2b9280bdd11eba7f7acde48001122 | internal_sampler_policy | China | 0/0.15 | 1/1.00 | `Based on the evidence provided, Mohammed Al-Modiahki's wife, Zhu Chen, is from C` | `China.` |
| e6688a7e0baf11ebab90acde48001122 | relation_path_then_decode | Charles I of Naples | 0/0.07 | 1/1.00 | `The evidence provided does not include information about Philip of Sicily's fath` | `Charles I of Naples` |
| 49ec1ade0bdd11eba7f7acde48001122 | internal_sampler_policy | Argentina | 0/0.00 | 1/1.00 | `According to the evidence lines, the director of the film "My Heidelberg, I Can ` | `Argentina.` |
| e4e02a240bda11eba7f7acde48001122 | relation_path_then_decode | Jacques Cousteau | 0/0.20 | 1/1.00 | `Jean-Michel Cousteau is the director of Wonders of the Sea 3D, and his father is` | `Jacques Cousteau` |
| c9b515020bda11eba7f7acde48001122 | internal_sampler_policy | Thessaloniki | 0/0.09 | 1/1.00 | `Based on the evidence provided, the place of death of Prince Christopher of Gree` | `Thessaloniki.` |
| 652d7dac0bdc11eba7f7acde48001122 | internal_sampler_policy | New York | 1/1.00 | 1/1.00 | `New York.` | `New York.` |
| 2b7db0200bde11eba7f7acde48001122 | relation_path_then_decode | University of Paris | 0/0.24 | 1/1.00 | `Based on the evidence provided, Charles Stewart, 3rd Duke of Richmond's father g` | `University of Paris` |
| 2935f1640bda11eba7f7acde48001122 | internal_sampler_policy | Nice | 1/1.00 | 1/1.00 | `Nice.` | `Nice.` |
| 437f3b9a0bdd11eba7f7acde48001122 | internal_sampler_policy | Hackney | 1/1.00 | 1/1.00 | `Hackney.` | `Hackney.` |
| 37c6703a0bdc11eba7f7acde48001122 | internal_sampler_policy | 1969 | 1/1.00 | 1/1.00 | `1969` | `1969` |
| 68cb7bc00bdd11eba7f7acde48001122 | internal_sampler_policy | Huahine | 0/0.13 | 1/1.00 | `According to the evidence lines, the place of death of Tamatoa VI's father, Ari'` | `Huahine.` |
| 74207b920bdd11eba7f7acde48001122 | internal_sampler_policy | Brighton | 0/0.10 | 1/1.00 | `According to the evidence, the director of the film "Old Man Drinking a Glass of` | `Brighton.` |
| 00c727580bde11eba7f7acde48001122 | internal_sampler_policy | 10 May 1912 | 0/0.00 | 1/1.00 | `The date of death of Henry St John, 18th Baron St John of Bletso's father, Beauc` | `10 May 1912.` |
| 77f41ab20bb011ebab90acde48001122 | internal_sampler_policy | John de Vere, 15th Earl of Oxford | 0/0.50 | 1/1.00 | `Based on the evidence provided, Edward de Vere, 17th Earl of Oxford's paternal g` | `John de Vere, 15th Earl of Oxford.` |
| b1b78c480bdd11eba7f7acde48001122 | internal_sampler_policy | Kreuzlingen | 0/0.10 | 1/1.00 | `Based on the evidence provided, the place of death of Alexander Carl Otto Westph` | `Kreuzlingen.` |
| 3c68e44c0bdc11eba7f7acde48001122 | internal_sampler_policy | Florence | 0/0.12 | 1/1.00 | `According to the evidence lines, the place of death of Alessandro Vitelli's fath` | `Florence.` |
| 027970120bdc11eba7f7acde48001122 | internal_sampler_policy | Århus | 1/1.00 | 1/1.00 | `Århus.` | `Århus.` |
| 94873b220bd911eba7f7acde48001122 | internal_sampler_policy | Florence | 0/0.11 | 1/1.00 | `Based on the evidence provided, the mother of Francis II of France, Catherine de` | `Florence.` |
