# EPKV Quality Evaluation

total: 100

## Macro metrics

| system | EM | contains | token F1 |
|---|---:|---:|---:|
| baseline | 0.300 | 0.700 | 0.395 |
| internal+relation policy | 0.910 | 0.980 | 0.931 |

## By winning layer

| layer | n | EM | contains | F1 |
|---|---:|---:|---:|---:|
| internal_sampler_policy | 80 | 0.887 | 0.975 | 0.914 |
| relation_path_then_decode | 20 | 1.000 | 1.000 | 1.000 |

## Rows

| qid | layer | gold | baseline EM/F1 | policy EM/F1 | baseline | policy |
|---|---|---|---:|---:|---|---|
| 8813f87c0bdd11eba7f7acde48001122 | internal_sampler_policy | Małgorzata Braunek | 0/0.33 | 0/0.40 | `The mother of the director of the film "Polish-Russian War" is Małgorzata Braune` | `Małgorzata Braunek is the mother of the director of the film` |
| e2a3bf2a0bdd11eba7f7acde48001122 | relation_path_then_decode | 12 June 1516 | 0/0.00 | 1/1.00 | `Based on the given evidence, the information provided does not directly state wh` | `12 June 1516` |
| dfe93efe0bdd11eba7f7acde48001122 | internal_sampler_policy | 1983 | 0/0.17 | 0/0.33 | `According to the evidence, Jean Martin's husband, William Black, died in 1983.` | `William Black died in 1983.` |
| 2207e9060bda11eba7f7acde48001122 | internal_sampler_policy | United States | 0/0.15 | 1/1.00 | `The nationality of the director of the film "World and Time Enough" is United St` | `United States` |
| 2002bf0c0bb011ebab90acde48001122 | internal_sampler_policy | Rupert | 0/0.00 | 1/1.00 | `Based on the evidence provided, Catherine of Pomerania, Countess Palatine of Neu` | `Rupert.` |
| c531e7560baf11ebab90acde48001122 | relation_path_then_decode | Marie Leszczyńska | 0/0.09 | 1/1.00 | `Based on the evidence provided, Marie Zéphyrine of France's paternal grandmother` | `Marie Leszczyńska` |
| a9cc5f240bdb11eba7f7acde48001122 | internal_sampler_policy | Catherine Robbe-Grillet | 0/0.31 | 1/1.00 | `The spouse of the director of film Eden and After is Catherine Robbe-Grillet.` | `Catherine Robbe-Grillet.` |
| 6ebe05740bde11eba7f7acde48001122 | internal_sampler_policy | Hilandar | 1/1.00 | 1/1.00 | `Hilandar.` | `Hilandar.` |
| 7a1d9d7c0bb011ebab90acde48001122 | internal_sampler_policy | Pompey | 0/0.11 | 0/0.22 | `Based on the evidence provided, Cornelia's child is Julia, and Julia's spouse is` | `Pompey is Cornelia's child, and Julia is Cornelia's` |
| 0bedb7e80bdc11eba7f7acde48001122 | internal_sampler_policy | tuberculosis | 0/0.20 | 0/0.20 | `John Middleton Murry's wife, Katherine Mansfield, died from tuberculosis.` | `John Middleton Murry's wife, Katherine Mansfield, died from tuberculosis.` |
| 1869092c0bb011ebab90acde48001122 | relation_path_then_decode | Rukn al-Dawla | 0/0.20 | 1/1.00 | `Based on the evidence provided, Taj al-Dawla's paternal grandfather is Rukn al-D` | `Rukn al-Dawla` |
| c19b72520bdb11eba7f7acde48001122 | internal_sampler_policy | Xi'an | 1/1.00 | 1/1.00 | `Xi'an` | `Xi'an` |
| 0cd3bdea0bde11eba7f7acde48001122 | internal_sampler_policy | Myanmar Motion Picture Academy Awards | 0/0.50 | 1/1.00 | `The director of the film "Wearing Velvet Slippers Under A Golden Umbrella" won t` | `Myanmar Motion Picture Academy Awards.` |
| b3110a5e0bda11eba7f7acde48001122 | internal_sampler_policy | German | 1/1.00 | 1/1.00 | `German.` | `German.` |
| 3705552a0bb011ebab90acde48001122 | internal_sampler_policy | Louis-Alexandre Berthier | 0/0.21 | 1/1.00 | `Based on the evidence provided, Alexandre Berthier, 3rd Prince of Wagram's pater` | `Louis-Alexandre Berthier.` |
| 07e964920bde11eba7f7acde48001122 | internal_sampler_policy | Pavia | 1/1.00 | 1/1.00 | `Pavia.` | `Pavia.` |
| c3c94d0a0bdc11eba7f7acde48001122 | internal_sampler_policy | Víctor Bó | 0/0.20 | 0/0.33 | `Based on the evidence provided, Víctor Bó is the child of the director of the fi` | `Víctor Bó is the child of the director of the film La Le` |
| 96fb4aee0baf11ebab90acde48001122 | relation_path_then_decode | Urraca of Castile | 0/0.07 | 1/1.00 | `Based on the evidence provided, we cannot determine Blanche of Portugal's patern` | `Urraca of Castile` |
| e41c14820bd911eba7f7acde48001122 | internal_sampler_policy | Cahiers du cinéma | 1/1.00 | 1/1.00 | `Cahiers du cinéma.` | `Cahiers du cinéma.` |
| 27e835ee0bb011ebab90acde48001122 | internal_sampler_policy | Sir Arthur Gore, 2nd Baronet | 0/0.21 | 1/1.00 | `Based on the evidence provided, we cannot directly determine who Arthur Gore, 2n` | `Sir Arthur Gore, 2nd Baronet.` |
| 931a85420bdd11eba7f7acde48001122 | internal_sampler_policy | London | 0/0.13 | 1/1.00 | `Based on the evidence provided, Lord Patrick Crichton-Stuart's father, John Stua` | `London.` |
| 0bbded440bda11eba7f7acde48001122 | internal_sampler_policy | Pakistan | 1/1.00 | 1/1.00 | `Pakistan.` | `Pakistan.` |
| 258867240bdd11eba7f7acde48001122 | internal_sampler_policy | Winnipeg, Manitoba | 1/1.00 | 1/1.00 | `Winnipeg, Manitoba.` | `Winnipeg, Manitoba.` |
| f9dcb4a60bda11eba7f7acde48001122 | internal_sampler_policy | Missoula, Montana | 0/0.22 | 1/1.00 | `Based on the evidence provided, the director of film Ronnie Rocket, David Lynch,` | `Missoula, Montana.` |
| 3cbd107e0bde11eba7f7acde48001122 | internal_sampler_policy | Fukuoka | 1/1.00 | 1/1.00 | `Fukuoka.` | `Fukuoka.` |
| 5e8240ea0bdd11eba7f7acde48001122 | internal_sampler_policy | Roma | 1/1.00 | 1/1.00 | `Roma.` | `Roma.` |
| 6638110e0bdb11eba7f7acde48001122 | relation_path_then_decode | Moscow, USSR | 0/0.00 | 1/1.00 | `Based on the evidence provided, we cannot directly determine the place of birth ` | `Moscow, USSR.` |
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
| e8d8f7200bdd11eba7f7acde48001122 | internal_sampler_policy | Chuck Schumer | 0/0.36 | 1/1.00 | `Huma Abedin's husband, Anthony Weiner, works for Chuck Schumer.` | `Chuck Schumer.` |
| 844fe30c0bda11eba7f7acde48001122 | internal_sampler_policy | Florence | 0/0.00 | 1/1.00 | `According to the evidence line E1, Giacomo Feo's wife was Caterina Sforza. Evide` | `Florence.` |
| 2ec440560bb011ebab90acde48001122 | relation_path_then_decode | Ptolemy IX Lathyros | 0/0.21 | 1/1.00 | `Based on the evidence provided, Cleopatra IV is the mother of Antiochus X Eusebe` | `Ptolemy IX Lathyros` |
| c32ac4ca0bda11eba7f7acde48001122 | internal_sampler_policy | Helsingfors | 1/1.00 | 1/1.00 | `Helsingfors` | `Helsingfors.` |
| 6021e2d80bde11eba7f7acde48001122 | relation_path_then_decode | Dutch | 0/0.00 | 1/1.00 | `Based on the evidence provided, Jan Baptist van Rensselaer's father, Kiliaen van` | `Dutch` |
| b5b63b160bdb11eba7f7acde48001122 | internal_sampler_policy | Tisch | 1/1.00 | 1/1.00 | `Tisch.` | `Tisch.` |
| 4b1b91720bde11eba7f7acde48001122 | internal_sampler_policy | India | 0/0.10 | 0/0.18 | `Based on the evidence lines provided, Geodeung of Gaya's mother is Heo Hwang-ok,` | `India. This can be inferred from the fact that Heo Hwang-ok,` |
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
| 5839dbac0bde11eba7f7acde48001122 | internal_sampler_policy | American | 0/0.11 | 1/1.00 | `The nationality of the director of the film "They Call It Love" is American, as ` | `American` |
| 22d296de0bde11eba7f7acde48001122 | internal_sampler_policy | Sochi | 1/1.00 | 1/1.00 | `Sochi.` | `Sochi.` |
| 9c3ff1040bdb11eba7f7acde48001122 | internal_sampler_policy | French | 1/1.00 | 1/1.00 | `French.` | `French.` |
| 81ca57e60bdc11eba7f7acde48001122 | internal_sampler_policy | Winnipeg, Manitoba | 1/1.00 | 1/1.00 | `Winnipeg, Manitoba.` | `Winnipeg, Manitoba.` |
| 30ee74680bde11eba7f7acde48001122 | internal_sampler_policy | Villafranca del Bierzo | 0/0.00 | 1/1.00 | `Based on the evidence provided, the father of Eleonora di Garzia di Toledo, Garc` | `Villafranca del Bierzo.` |
| f491b33e0bda11eba7f7acde48001122 | internal_sampler_policy | Jean Hersholt Humanitarian Award | 0/0.35 | 1/1.00 | `The director of the film "The Last Night of the Barbary Coast" got the Jean Hers` | `Jean Hersholt Humanitarian Award.` |
| c05e16a40bdd11eba7f7acde48001122 | relation_path_then_decode | stroke | 0/0.00 | 1/1.00 | `Princess Victoria Melita of Saxe-Coburg and Gotha, the wife of Grand Duke Kirill` | `stroke` |
| 5b637e060bb011ebab90acde48001122 | internal_sampler_policy | Princess Madeleine, Duchess of Hälsingland and Gästrikland | 0/0.13 | 0/0.10 | `Based on the provided evidence, we cannot determine Prince Nicolas of Sweden, Du` | `There is no evidence provided about Prince Nicolas of Sweden, Duke of Ångerman` |
| 1a2188840bb011ebab90acde48001122 | relation_path_then_decode | Princess Augusta of Schwarzburg-Sondershausen | 0/0.24 | 1/1.00 | `Based on the evidence provided, Princess Augusta of Waldeck-Pyrmont's father is ` | `Princess Augusta of Schwarzburg-Sondershausen` |
| d1fd9cbe0bdc11eba7f7acde48001122 | internal_sampler_policy | Cahiers du cinéma | 1/1.00 | 1/1.00 | `Cahiers du cinéma.` | `Cahiers du cinéma.` |
| f6e2b9280bdd11eba7f7acde48001122 | internal_sampler_policy | China | 0/0.15 | 1/1.00 | `Based on the evidence provided, Mohammed Al-Modiahki's wife, Zhu Chen, is from C` | `China.` |
| e6688a7e0baf11ebab90acde48001122 | relation_path_then_decode | Charles I of Naples | 0/0.07 | 1/1.00 | `The evidence provided does not include information about Philip of Sicily's fath` | `Charles I of Naples` |
| 49ec1ade0bdd11eba7f7acde48001122 | internal_sampler_policy | Argentina | 0/0.00 | 1/1.00 | `According to the evidence lines, the director of the film "My Heidelberg, I Can ` | `Argentina.` |
| e4e02a240bda11eba7f7acde48001122 | relation_path_then_decode | Jacques Cousteau | 0/0.20 | 1/1.00 | `Jean-Michel Cousteau is the director of Wonders of the Sea 3D, and his father is` | `Jacques Cousteau` |
| c9b515020bda11eba7f7acde48001122 | internal_sampler_policy | Thessaloniki | 0/0.09 | 1/1.00 | `Based on the evidence provided, the place of death of Prince Christopher of Gree` | `Thessaloniki.` |
| 652d7dac0bdc11eba7f7acde48001122 | internal_sampler_policy | New York | 1/1.00 | 1/1.00 | `New York.` | `New York` |
| 2b7db0200bde11eba7f7acde48001122 | relation_path_then_decode | University of Paris | 0/0.24 | 1/1.00 | `Based on the evidence provided, Charles Stewart, 3rd Duke of Richmond's father g` | `University of Paris` |
| 2935f1640bda11eba7f7acde48001122 | internal_sampler_policy | Nice | 1/1.00 | 1/1.00 | `Nice.` | `Nice.` |
| 437f3b9a0bdd11eba7f7acde48001122 | internal_sampler_policy | Hackney | 1/1.00 | 1/1.00 | `Hackney.` | `Hackney.` |
| 37c6703a0bdc11eba7f7acde48001122 | internal_sampler_policy | 1969 | 1/1.00 | 1/1.00 | `1969` | `1969` |
| 68cb7bc00bdd11eba7f7acde48001122 | internal_sampler_policy | Huahine | 0/0.13 | 1/1.00 | `According to the evidence lines, the place of death of Tamatoa VI's father, Ari'` | `Huahine.` |
| 74207b920bdd11eba7f7acde48001122 | internal_sampler_policy | Brighton | 0/0.10 | 1/1.00 | `According to the evidence, the director of the film "Old Man Drinking a Glass of` | `Brighton.` |
| 00c727580bde11eba7f7acde48001122 | internal_sampler_policy | 10 May 1912 | 0/0.00 | 1/1.00 | `The date of death of Henry St John, 18th Baron St John of Bletso's father, Beauc` | `10 May 1912.` |
| 77f41ab20bb011ebab90acde48001122 | internal_sampler_policy | John de Vere, 15th Earl of Oxford | 0/0.50 | 1/1.00 | `Based on the evidence provided, Edward de Vere, 17th Earl of Oxford's paternal g` | `John de Vere, 15th Earl of Oxford.` |
| b1b78c480bdd11eba7f7acde48001122 | internal_sampler_policy | Kreuzlingen | 0/0.10 | 0/0.20 | `Based on the evidence provided, the place of death of Alexander Carl Otto Westph` | `Kreuzlingen. However, the evidence provided does not directly state the place` |
| 3c68e44c0bdc11eba7f7acde48001122 | internal_sampler_policy | Florence | 0/0.12 | 1/1.00 | `According to the evidence lines, the place of death of Alessandro Vitelli's fath` | `Florence.` |
| 027970120bdc11eba7f7acde48001122 | internal_sampler_policy | Århus | 1/1.00 | 1/1.00 | `Århus.` | `Århus.` |
| 94873b220bd911eba7f7acde48001122 | internal_sampler_policy | Florence | 0/0.11 | 1/1.00 | `Based on the evidence provided, the mother of Francis II of France, Catherine de` | `Florence.` |
