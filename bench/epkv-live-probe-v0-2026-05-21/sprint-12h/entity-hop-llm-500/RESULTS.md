# Entity-Hop Retrieval

total: 500
corpus_docs: 56687

## Retrieval

| metric | value |
|---|---:|
| support_title_recall | 0.727 |
| full_support_recall | 0.454 |
| answer_string_present_rate | 0.786 |

## Answer quality

| condition | EM | contains | F1 |
|---|---:|---:|---:|
| bge_ref | 0.018 | 0.032 | 0.037 |
| entity_hop_path_prompt | 0.216 | 0.306 | 0.324 |
| entity_hop_strong | 0.172 | 0.288 | 0.285 |

## Rows

| qid | gold | support | answer in docs | bge | hop strong | path | extract | ecd |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| 8813f87c0bdd11eba7f7acde48001122 | Małgorzata Braunek | 0.67 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| e2a3bf2a0bdd11eba7f7acde48001122 | 12 June 1516 | 0.67 | 1 | 0/0.00 | 0/0.00 | 1/1.00 |  |  |
| 0cd3bdea0bde11eba7f7acde48001122 | Myanmar Motion Picture Academy Awards | 1.00 | 1 | 0/0.00 | 0/0.80 | 0/0.80 |  |  |
| f9dcb4a60bda11eba7f7acde48001122 | Missoula, Montana | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 8981e1ce0bb011ebab90acde48001122 | Charles Armand René de La Trémoille | 1.00 | 1 | 0/0.60 | 0/0.40 | 1/1.00 |  |  |
| 019bed300bde11eba7f7acde48001122 | Galați | 0.50 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 2ec440560bb011ebab90acde48001122 | Ptolemy IX Lathyros | 0.33 | 0 | 0/0.33 | 0/0.40 | 0/0.00 |  |  |
| 464cfa460bd911eba7f7acde48001122 | Brooklyn | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| c05e16a40bdd11eba7f7acde48001122 | stroke | 1.00 | 1 | 0/0.11 | 0/0.00 | 0/0.00 |  |  |
| 2935f1640bda11eba7f7acde48001122 | Nice | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| dfe93efe0bdd11eba7f7acde48001122 | 1983 | 0.25 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 2207e9060bda11eba7f7acde48001122 | United States | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 2002bf0c0bb011ebab90acde48001122 | Rupert | 0.67 | 1 | 0/0.00 | 0/0.50 | 0/0.50 |  |  |
| c531e7560baf11ebab90acde48001122 | Marie Leszczyńska | 0.00 | 0 | 0/0.00 | 0/0.11 | 0/0.00 |  |  |
| a9cc5f240bdb11eba7f7acde48001122 | Catherine Robbe-Grillet | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 6ebe05740bde11eba7f7acde48001122 | Hilandar | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 7a1d9d7c0bb011ebab90acde48001122 | Pompey | 0.25 | 1 | 0/0.40 | 0/0.00 | 0/0.00 |  |  |
| 0bedb7e80bdc11eba7f7acde48001122 | tuberculosis | 1.00 | 1 | 0/0.00 | 0/0.20 | 0/0.29 |  |  |
| 1869092c0bb011ebab90acde48001122 | Rukn al-Dawla | 1.00 | 1 | 1/1.00 | 1/1.00 | 1/1.00 |  |  |
| c19b72520bdb11eba7f7acde48001122 | Xi'an | 1.00 | 1 | 0/0.00 | 0/0.67 | 1/1.00 |  |  |
| b3110a5e0bda11eba7f7acde48001122 | German | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 3705552a0bb011ebab90acde48001122 | Louis-Alexandre Berthier | 0.67 | 1 | 0/0.50 | 0/0.00 | 0/0.00 |  |  |
| 07e964920bde11eba7f7acde48001122 | Pavia | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| c3c94d0a0bdc11eba7f7acde48001122 | Víctor Bó | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 96fb4aee0baf11ebab90acde48001122 | Urraca of Castile | 0.33 | 1 | 0/0.67 | 0/0.00 | 0/0.33 |  |  |
| e41c14820bd911eba7f7acde48001122 | Cahiers du cinéma | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 27e835ee0bb011ebab90acde48001122 | Sir Arthur Gore, 2nd Baronet | 0.67 | 1 | 0/0.80 | 0/0.80 | 0/0.80 |  |  |
| 931a85420bdd11eba7f7acde48001122 | London | 0.33 | 0 | 0/0.50 | 0/0.00 | 0/0.00 |  |  |
| 0bbded440bda11eba7f7acde48001122 | Pakistan | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 258867240bdd11eba7f7acde48001122 | Winnipeg, Manitoba | 0.50 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 3cbd107e0bde11eba7f7acde48001122 | Fukuoka | 0.00 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 5e8240ea0bdd11eba7f7acde48001122 | Roma | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 6638110e0bdb11eba7f7acde48001122 | Moscow, USSR | 1.00 | 1 | 1/1.00 | 1/1.00 | 1/1.00 |  |  |
| 3972d2b60baf11ebab90acde48001122 | Jeanne d'Albret | 0.50 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| a8cbc4c40bdc11eba7f7acde48001122 | New York | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 32e50df00bb011ebab90acde48001122 | Louis II | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| deb907f80bdd11eba7f7acde48001122 | Bohemia | 0.50 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| b81fbe620bdc11eba7f7acde48001122 | Gura Humorului | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 3717c0600bde11eba7f7acde48001122 | Meran | 1.00 | 1 | 0/0.00 | 0/0.33 | 0/0.29 |  |  |
| 0f1ac1a00bdb11eba7f7acde48001122 | Grammy | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 07388c7c0bb011ebab90acde48001122 | Peter I | 1.00 | 1 | 0/0.29 | 0/0.00 | 0/0.57 |  |  |
| 6b55ac320bdb11eba7f7acde48001122 | 24 March 1927 | 0.50 | 1 | 0/0.50 | 0/0.00 | 0/0.00 |  |  |
| 424d56700bde11eba7f7acde48001122 | Ostrogothic Kingdom | 0.00 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 5c0c69f80bdd11eba7f7acde48001122 | Kurdish | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 29427eea0bdd11eba7f7acde48001122 | Liverpool | 0.67 | 1 | 1/1.00 | 1/1.00 | 1/1.00 |  |  |
| bc633e2c0baf11ebab90acde48001122 | Louis, Grand Dauphin | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 2b4bd5020baf11ebab90acde48001122 | Kujō Michiie | 0.67 | 1 | 1/1.00 | 0/0.50 | 1/1.00 |  |  |
| 3647118c0bdd11eba7f7acde48001122 | Madrid | 0.67 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| ea1fc06c0bda11eba7f7acde48001122 | United Nations | 0.50 | 1 | 0/0.00 | 0/0.00 | 1/1.00 |  |  |
| 00c75ffc0bde11eba7f7acde48001122 | Paris | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 94198d580bb011ebab90acde48001122 | Mathilde of Bourbon | 0.50 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 71d8e20e0bdb11eba7f7acde48001122 | London | 0.67 | 1 | 1/1.00 | 1/1.00 | 1/1.00 |  |  |
| e701105e0bdd11eba7f7acde48001122 | Königsberg | 0.67 | 1 | 0/0.00 | 0/0.50 | 0/0.50 |  |  |
| b5e9ef2c0bdd11eba7f7acde48001122 | Homs | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 48c8f7f80bdd11eba7f7acde48001122 | Alain Poiré | 0.67 | 1 | 0/0.50 | 1/1.00 | 1/1.00 |  |  |
| aa0370860bdb11eba7f7acde48001122 | Naha, Okinawa | 0.67 | 1 | 0/0.00 | 0/0.80 | 0/0.80 |  |  |
| a5bed06e0bdc11eba7f7acde48001122 | Byzantine | 0.25 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 2294ccfc0bdc11eba7f7acde48001122 | August 8, 1975 | 1.00 | 1 | 1/1.00 | 0/0.55 | 1/1.00 |  |  |
| e8d8f7200bdd11eba7f7acde48001122 | Chuck Schumer | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 844fe30c0bda11eba7f7acde48001122 | Florence | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| c32ac4ca0bda11eba7f7acde48001122 | Helsingfors | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 6021e2d80bde11eba7f7acde48001122 | Dutch | 0.33 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| b5b63b160bdb11eba7f7acde48001122 | Tisch | 1.00 | 1 | 0/0.00 | 0/0.22 | 0/0.22 |  |  |
| 4b1b91720bde11eba7f7acde48001122 | India | 0.33 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 0458640a0bdd11eba7f7acde48001122 | leukemia | 0.00 | 0 | 0/0.67 | 0/0.00 | 0/0.00 |  |  |
| 94dd39d80bdd11eba7f7acde48001122 | Herstal | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| abc68a180bd911eba7f7acde48001122 | 22 January 1794 | 0.67 | 1 | 0/0.00 | 0/0.46 | 0/0.00 |  |  |
| 97ce0ec00baf11ebab90acde48001122 | Stanisław Leszczyński | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 04a544a40bde11eba7f7acde48001122 | 3 August 979 | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.50 |  |  |
| a08505d20bdc11eba7f7acde48001122 | Aldo Parisot | 0.00 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 982f8e440bdb11eba7f7acde48001122 | 1886 | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 5142f59e0bda11eba7f7acde48001122 | Nevele | 1.00 | 1 | 1/1.00 | 1/1.00 | 1/1.00 |  |  |
| 041581680bdc11eba7f7acde48001122 | Manchester | 0.67 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| ad43c9300bdb11eba7f7acde48001122 | Tantallon Castle | 0.50 | 0 | 0/0.57 | 0/0.00 | 0/0.29 |  |  |
| 5839dbac0bde11eba7f7acde48001122 | American | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 22d296de0bde11eba7f7acde48001122 | Sochi | 0.33 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 9c3ff1040bdb11eba7f7acde48001122 | French | 0.50 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 81ca57e60bdc11eba7f7acde48001122 | Winnipeg, Manitoba | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 30ee74680bde11eba7f7acde48001122 | Villafranca del Bierzo | 0.50 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| f491b33e0bda11eba7f7acde48001122 | Jean Hersholt Humanitarian Award | 1.00 | 1 | 0/0.00 | 0/0.11 | 1/1.00 |  |  |
| 5b637e060bb011ebab90acde48001122 | Princess Madeleine, Duchess of Hälsingland and Gästrikland | 0.67 | 1 | 0/0.44 | 0/0.44 | 0/0.44 |  |  |
| 1a2188840bb011ebab90acde48001122 | Princess Augusta of Schwarzburg-Sondershausen | 0.33 | 0 | 0/0.50 | 0/0.50 | 0/0.50 |  |  |
| d1fd9cbe0bdc11eba7f7acde48001122 | Cahiers du cinéma | 1.00 | 1 | 0/0.00 | 0/0.00 | 1/1.00 |  |  |
| f6e2b9280bdd11eba7f7acde48001122 | China | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| e6688a7e0baf11ebab90acde48001122 | Charles I of Naples | 1.00 | 1 | 0/0.67 | 0/0.32 | 0/0.67 |  |  |
| 49ec1ade0bdd11eba7f7acde48001122 | Argentina | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| e4e02a240bda11eba7f7acde48001122 | Jacques Cousteau | 1.00 | 1 | 0/0.50 | 0/0.50 | 0/0.50 |  |  |
| c9b515020bda11eba7f7acde48001122 | Thessaloniki | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 652d7dac0bdc11eba7f7acde48001122 | New York | 1.00 | 1 | 0/0.00 | 0/0.80 | 0/0.80 |  |  |
| 2b7db0200bde11eba7f7acde48001122 | University of Paris | 0.67 | 1 | 0/0.10 | 0/0.00 | 0/0.00 |  |  |
| 437f3b9a0bdd11eba7f7acde48001122 | Hackney | 0.25 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 37c6703a0bdc11eba7f7acde48001122 | 1969 | 1.00 | 1 | 0/0.00 | 0/0.67 | 1/1.00 |  |  |
| 68cb7bc00bdd11eba7f7acde48001122 | Huahine | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 74207b920bdd11eba7f7acde48001122 | Brighton | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 00c727580bde11eba7f7acde48001122 | 10 May 1912 | 0.50 | 0 | 1/1.00 | 0/0.00 | 0/0.00 |  |  |
| 77f41ab20bb011ebab90acde48001122 | John de Vere, 15th Earl of Oxford | 1.00 | 1 | 0/0.86 | 1/1.00 | 1/1.00 |  |  |
| b1b78c480bdd11eba7f7acde48001122 | Kreuzlingen | 1.00 | 1 | 1/1.00 | 1/1.00 | 0/0.00 |  |  |
| 3c68e44c0bdc11eba7f7acde48001122 | Florence | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 027970120bdc11eba7f7acde48001122 | Århus | 1.00 | 1 | 0/0.00 | 0/0.40 | 0/0.00 |  |  |
| 94873b220bd911eba7f7acde48001122 | Florence | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| ece1bdae0bdb11eba7f7acde48001122 | British | 0.33 | 0 | 0/0.00 | 0/0.00 | 1/1.00 |  |  |
| 2fd031c00bde11eba7f7acde48001122 | State University of New York at Purchase | 0.25 | 0 | 0/0.00 | 0/0.09 | 0/0.09 |  |  |
| 09b7d46a0bda11eba7f7acde48001122 | 2 September 1770 | 1.00 | 1 | 0/0.00 | 1/1.00 | 0/0.50 |  |  |
| 61d1f6900bde11eba7f7acde48001122 | 1080 | 0.50 | 1 | 0/0.00 | 0/0.00 | 1/1.00 |  |  |
| c3c76b780bd911eba7f7acde48001122 | 30 June 1963 | 1.00 | 1 | 0/0.00 | 0/0.55 | 0/1.00 |  |  |
| 2e13ff240bde11eba7f7acde48001122 | Wales | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| c40d35580bda11eba7f7acde48001122 | Rosario | 1.00 | 1 | 0/0.00 | 0/0.40 | 0/0.40 |  |  |
| 2cf578340bde11eba7f7acde48001122 | 1701 | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 79675c6e0bd911eba7f7acde48001122 | German | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 30885e540bb011ebab90acde48001122 | Franz Joseph I | 1.00 | 1 | 0/0.00 | 0/0.67 | 0/0.00 |  |  |
| 6e4854a00bde11eba7f7acde48001122 | Amman | 0.25 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 421b26d80bb011ebab90acde48001122 | Princess Maria Immaculata of Bourbon-Two Sicilies | 1.00 | 1 | 0/0.00 | 0/0.18 | 0/0.18 |  |  |
| 43eb7b380bde11eba7f7acde48001122 | Belfast | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| e5d895ee0bdd11eba7f7acde48001122 | Tamil | 0.33 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 286321f00bb011ebab90acde48001122 | Íñigo Vélez de Guevara, 7th Count of Oñate | 1.00 | 1 | 0/0.00 | 0/0.50 | 1/1.00 |  |  |
| 5e60d12e0bda11eba7f7acde48001122 | Jerez de la Frontera | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| d133120e0bdd11eba7f7acde48001122 | Queens | 1.00 | 1 | 0/0.00 | 0/0.67 | 0/0.67 |  |  |
| 5eff3f9a0bd911eba7f7acde48001122 | Nanjing | 0.50 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 87154f1e0bda11eba7f7acde48001122 | Polish–Lithuanian Commonwealth | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| a6d861000bdb11eba7f7acde48001122 | Maurya dynasty | 0.50 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 5d8037920bb011ebab90acde48001122 | Yi Jiang | 1.00 | 1 | 0/0.00 | 0/0.80 | 0/0.80 |  |  |
| 1d4139960bde11eba7f7acde48001122 | New Brunswick, New Jersey | 0.25 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 5a5718140bde11eba7f7acde48001122 | Bombay | 0.25 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| ce4f63cc0bdc11eba7f7acde48001122 | National Film School in Łódź | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 671322a00bde11eba7f7acde48001122 | London | 0.50 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 231d667c0bda11eba7f7acde48001122 | Swedish | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| f86dd5180bdb11eba7f7acde48001122 | Davao | 0.67 | 1 | 0/0.00 | 0/0.67 | 0/0.67 |  |  |
| 39ca32a80bdd11eba7f7acde48001122 | 15 November 1784 | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 047992200bdc11eba7f7acde48001122 | Hollywood | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| befbd60c0bdd11eba7f7acde48001122 | Harvard | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 4c070b620bb011ebab90acde48001122 | Queen Sofía of Spain | 0.67 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 43208df60bde11eba7f7acde48001122 | French | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 987e4ee80baf11ebab90acde48001122 | Ndvungunye | 0.50 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 44e72de60bdb11eba7f7acde48001122 | Reykjavík | 0.67 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 2ec36c440bb011ebab90acde48001122 | Thomas de Beauchamp | 0.25 | 0 | 0/0.00 | 0/0.67 | 0/0.44 |  |  |
| b035afca0bd911eba7f7acde48001122 | María Barranco | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.50 |  |  |
| 051f62de0bde11eba7f7acde48001122 | Osterholz | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 1734c9b60baf11ebab90acde48001122 | Agrippina the Elder | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 1187c9080bde11eba7f7acde48001122 | October 27, 1893 | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 7de481100baf11ebab90acde48001122 | Lady Frances Manners | 0.67 | 1 | 0/0.00 | 0/0.33 | 0/0.33 |  |  |
| c51148bc0bdb11eba7f7acde48001122 | Ottoman Empire | 0.67 | 1 | 0/0.00 | 0/0.67 | 0/0.67 |  |  |
| be0a16240baf11ebab90acde48001122 | Princess Mary of Great Britain | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 2b81511c0bde11eba7f7acde48001122 | Washington | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| ea9832140bd911eba7f7acde48001122 | Newport | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 772c5c660bb011ebab90acde48001122 | Catherine of Braganza | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.25 |  |  |
| 0ac40d780bdb11eba7f7acde48001122 | University of British Columbia | 0.67 | 1 | 0/0.00 | 0/0.35 | 0/0.00 |  |  |
| 122b64480baf11ebab90acde48001122 | Gerberge of Lorraine | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| e1f0c38c0bda11eba7f7acde48001122 | France | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| ddacf7580baf11ebab90acde48001122 | Eleanor of Provence | 0.33 | 0 | 0/0.00 | 0/0.33 | 0/0.33 |  |  |
| d9b00ab80bdd11eba7f7acde48001122 | 2 August 1288 | 0.33 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 700dfeea0baf11ebab90acde48001122 | Bernard-Roger, Count of Bigorre | 1.00 | 1 | 0/0.00 | 0/0.22 | 0/0.25 |  |  |
| c370b4540bd911eba7f7acde48001122 | Rasual Butler | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| b3d918160bdd11eba7f7acde48001122 | Nine Network | 0.67 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 142afa360bde11eba7f7acde48001122 | Stampede Wrestling | 0.50 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| b8ef144a0bdd11eba7f7acde48001122 | British | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 8c82acb20bda11eba7f7acde48001122 | United Kingdom | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 6ae076e40bde11eba7f7acde48001122 | US | 0.50 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 6b5393240bdc11eba7f7acde48001122 | National Film Award for Best Music Direction | 1.00 | 1 | 0/0.00 | 0/0.40 | 0/0.40 |  |  |
| 3d3bc0720bde11eba7f7acde48001122 | Queens | 0.67 | 1 | 0/0.00 | 0/0.33 | 0/0.33 |  |  |
| b411910a0bdd11eba7f7acde48001122 | Bowdoin College | 0.00 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| d9e3f4aa0bdc11eba7f7acde48001122 | April 30, 1939 | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 3068a40c0baf11ebab90acde48001122 | Sigrid the Haughty | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| b0b7f3700bdb11eba7f7acde48001122 | Cross Plains | 0.67 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 6900298c0bde11eba7f7acde48001122 | Sydney, Australia | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 215f53a00bde11eba7f7acde48001122 | California | 0.25 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 9c24e2900bdd11eba7f7acde48001122 | Norwegian | 0.50 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 2c0d754e0bb011ebab90acde48001122 | Conrad II | 0.67 | 1 | 0/0.00 | 0/0.67 | 0/0.67 |  |  |
| 08de5d000baf11ebab90acde48001122 | Elizabeth of Nevers | 1.00 | 1 | 0/0.00 | 0/0.33 | 0/0.33 |  |  |
| 096e14a20bde11eba7f7acde48001122 | Weston Park | 1.00 | 1 | 0/0.00 | 0/0.80 | 0/0.00 |  |  |
| d4a23f020bdb11eba7f7acde48001122 | Qing dynasty | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 96d29e2c0bdd11eba7f7acde48001122 | Roman Empire | 0.50 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 5c2a37a20bd911eba7f7acde48001122 | Arizona | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 534cb9fe0baf11ebab90acde48001122 | Louis Philippe II, Duke of Orléans | 0.50 | 1 | 0/0.00 | 0/0.40 | 0/0.40 |  |  |
| 73c0065c0bda11eba7f7acde48001122 | Spanish | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 62ce8c8e0bde11eba7f7acde48001122 | Chinese | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| bb8e4d040bda11eba7f7acde48001122 | Ashgabat | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| ea29ce5a0bd911eba7f7acde48001122 | Sangeet Natak Akademi Award | 0.25 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 1f3ea3b00bb011ebab90acde48001122 | Louis III, Count of Chiny | 1.00 | 1 | 0/0.00 | 0/0.60 | 1/1.00 |  |  |
| 253e36700bda11eba7f7acde48001122 | Rabat | 0.67 | 1 | 0/0.00 | 0/0.67 | 0/0.67 |  |  |
| 3641d5c60bda11eba7f7acde48001122 | Coventry | 0.50 | 1 | 0/0.00 | 0/0.00 | 1/1.00 |  |  |
| 6e3e70200bde11eba7f7acde48001122 | China | 0.50 | 1 | 0/0.00 | 0/0.00 | 1/1.00 |  |  |
| 967b39ca0bdd11eba7f7acde48001122 | Efva Attling | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 3b9299900bdd11eba7f7acde48001122 | La Trinité | 0.67 | 1 | 0/0.00 | 0/0.31 | 1/1.00 |  |  |
| 1900f7600baf11ebab90acde48001122 | Hugh de Stafford, 2nd Earl of Stafford | 0.00 | 1 | 0/0.00 | 1/1.00 | 0/0.92 |  |  |
| 859991680bda11eba7f7acde48001122 | Västerås | 1.00 | 1 | 0/0.00 | 0/0.67 | 0/0.67 |  |  |
| 6fbdeee60bdc11eba7f7acde48001122 | Leopoldo Torre Nilsson | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.33 |  |  |
| a0ae26f60baf11ebab90acde48001122 | Jules Lederer | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 1d0cd6e80bdd11eba7f7acde48001122 | Paris | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| c818d9480baf11ebab90acde48001122 | Wigeric of Lotharingia | 0.50 | 0 | 0/0.00 | 0/0.20 | 0/0.00 |  |  |
| b26e04e80bdb11eba7f7acde48001122 | Daniel Alomía Robles | 0.67 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| eb7ece320bdd11eba7f7acde48001122 | Stony Brook University | 0.67 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 747175620bdb11eba7f7acde48001122 | Helsingfors | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 9766cddc0bdc11eba7f7acde48001122 | Studio City | 1.00 | 1 | 0/0.00 | 0/0.80 | 0/0.80 |  |  |
| 36a3fe2a0baf11ebab90acde48001122 | Richard Burke, 2nd Earl of Clanricarde | 1.00 | 1 | 0/0.00 | 1/1.00 | 0/0.67 |  |  |
| c5315db80baf11ebab90acde48001122 | Bernard I, Margrave of Baden-Baden | 0.33 | 0 | 0/0.00 | 0/0.80 | 0/0.67 |  |  |
| 8e07f1f00bda11eba7f7acde48001122 | Mapy Cortés | 1.00 | 1 | 0/0.00 | 0/0.00 | 1/1.00 |  |  |
| d6be0cee0bdb11eba7f7acde48001122 | Akhetaten | 0.50 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 4aa187080baf11ebab90acde48001122 | Isabella of Angoulême | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.33 |  |  |
| 11963eee0bb011ebab90acde48001122 | Henry Styleman | 0.67 | 1 | 0/0.00 | 0/0.57 | 0/0.00 |  |  |
| 77f3d9300bb011ebab90acde48001122 | Gaston IV of Foix | 1.00 | 1 | 0/0.00 | 0/0.89 | 0/0.89 |  |  |
| f64be57a0bdd11eba7f7acde48001122 | August 7, 2004 | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| a5b095c00bdd11eba7f7acde48001122 | California | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 769106c40bda11eba7f7acde48001122 | laryngeal cancer | 0.50 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 3a3c2efe0bdc11eba7f7acde48001122 | Germany | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 3d03e0260bde11eba7f7acde48001122 | Christ's College, Cambridge | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 04b5e0320bdb11eba7f7acde48001122 | Weimar | 0.25 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 4a9acefe0baf11ebab90acde48001122 | Marc Allégret | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| c8c9313a0baf11ebab90acde48001122 | Jerome, 4th Count de Salis-Soglio | 0.67 | 1 | 0/0.00 | 0/0.22 | 0/0.80 |  |  |
| c1b9c0ac0bdd11eba7f7acde48001122 | 23 February 1473 | 0.50 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| ab18549a0bdc11eba7f7acde48001122 | Billy Ray Cyrus | 0.67 | 1 | 0/0.00 | 0/0.40 | 0/0.40 |  |  |
| 2d907ba60bdc11eba7f7acde48001122 | New York | 1.00 | 1 | 0/0.00 | 0/0.67 | 0/0.67 |  |  |
| 1efc66b60bde11eba7f7acde48001122 | Forlì | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 5f5002360bd911eba7f7acde48001122 | Hyderabad | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 9e68cdc20bd911eba7f7acde48001122 | Gloria Loring | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 1655fd7a0bdd11eba7f7acde48001122 | Lancing College | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| eeb017fa0bdd11eba7f7acde48001122 | Edinburgh | 0.50 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 565f05fc0bdc11eba7f7acde48001122 | St John's College | 0.00 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| ef4907cc0baf11ebab90acde48001122 | Kitiyakara Voralaksana | 0.50 | 0 | 0/0.00 | 0/0.29 | 0/0.00 |  |  |
| ba773ad00bd911eba7f7acde48001122 | Yash Johar | 1.00 | 1 | 0/0.00 | 0/0.50 | 0/0.50 |  |  |
| 90bad89e0bdb11eba7f7acde48001122 | San Juan, Puerto Rico | 1.00 | 1 | 0/0.00 | 1/1.00 | 0/0.73 |  |  |
| 6c7f03240bdb11eba7f7acde48001122 | Évreux | 0.67 | 1 | 0/0.00 | 1/1.00 | 0/0.00 |  |  |
| e61479860bda11eba7f7acde48001122 | Reykjavík | 0.67 | 1 | 0/0.00 | 0/0.00 | 1/1.00 |  |  |
| dea2ea800bd911eba7f7acde48001122 | Munich | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| b7de2a860bd911eba7f7acde48001122 | Maureen O'Sullivan | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| dbcd3f5e0bd911eba7f7acde48001122 | shot | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 0c0830a00baf11ebab90acde48001122 | Elizabeth the Cuman | 0.25 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 960b5ec00bdd11eba7f7acde48001122 | Abilene | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 077b294e0bdb11eba7f7acde48001122 | Tehran | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.67 |  |  |
| 9e506db00bdc11eba7f7acde48001122 | Käbi Laretei | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| bac99ab40bd911eba7f7acde48001122 | Great Pyramid of Giza | 0.50 | 0 | 0/0.00 | 0/0.40 | 0/0.40 |  |  |
| ab94845c0baf11ebab90acde48001122 | Theuderic I | 1.00 | 1 | 0/0.00 | 0/0.50 | 0/0.50 |  |  |
| 6b3de52e0bdc11eba7f7acde48001122 | Kirchheim unter Teck | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 1bd49ae00bdd11eba7f7acde48001122 | Colorado | 0.67 | 1 | 0/0.00 | 0/0.50 | 0/0.50 |  |  |
| 1837ca440bdb11eba7f7acde48001122 | Viennese | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 2dba81d80bde11eba7f7acde48001122 | hanged, drawn and quartered | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 9977d29c0bdc11eba7f7acde48001122 | illness | 1.00 | 1 | 0/0.00 | 0/0.29 | 0/0.17 |  |  |
| 774fa4e20bdc11eba7f7acde48001122 | 21 June 1483 | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| c9c3137e0bd911eba7f7acde48001122 | Huntington's disease | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 0c585dbc0bde11eba7f7acde48001122 | Suffield, Connecticut | 0.67 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| ad6e5c1c0baf11ebab90acde48001122 | Ragnild Magnusdotter | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| b3f0c5ce0bdd11eba7f7acde48001122 | Germany | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| bc69662a0bdd11eba7f7acde48001122 | Poznań | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| b65877e20bda11eba7f7acde48001122 | Alena Mihulová | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 2c43f3d40bde11eba7f7acde48001122 | Ischia | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| f97bacb20bdd11eba7f7acde48001122 | Paris | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 3ccbcad20bda11eba7f7acde48001122 | Palos Verdes | 0.25 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 70ec660c0bdd11eba7f7acde48001122 | France | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 7b52cb9e0bd911eba7f7acde48001122 | Naha, Okinawa | 0.67 | 1 | 0/0.00 | 0/0.80 | 0/0.80 |  |  |
| 4a053eb00bb011ebab90acde48001122 | Lady Anne Campbell | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 850c2ecc0bda11eba7f7acde48001122 | Theni | 1.00 | 1 | 0/0.00 | 0/0.25 | 0/0.25 |  |  |
| 20a118cc0bde11eba7f7acde48001122 | Johannesburg, South Africa | 0.25 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| a703e1160bdd11eba7f7acde48001122 | Rimini | 0.50 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 7e73e6560bdd11eba7f7acde48001122 | Prostějov | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| cff878c20bdb11eba7f7acde48001122 | Cebu | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 133b785c0bda11eba7f7acde48001122 | Rome | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 81c9a46c0bb011ebab90acde48001122 | Joana de Prades | 0.50 | 1 | 0/0.00 | 0/0.67 | 0/0.67 |  |  |
| c81d185a0baf11ebab90acde48001122 | Henrietta Susanna Tracy | 0.67 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 171e51c60bdd11eba7f7acde48001122 | Fårö | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 1c0dd3b00bdc11eba7f7acde48001122 | Polish-Lithuanian Commonwealth | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| c77037480baf11ebab90acde48001122 | Archibald Acheson, 2nd Earl of Gosford | 0.67 | 1 | 0/0.00 | 0/0.00 | 1/1.00 |  |  |
| d15be72e0bdd11eba7f7acde48001122 | Lewes | 1.00 | 1 | 0/0.00 | 0/0.00 | 1/1.00 |  |  |
| 5db7e2d80bdc11eba7f7acde48001122 | Bratislava | 0.00 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 49eb87280bdc11eba7f7acde48001122 | Westerland | 0.67 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 5e418da00bda11eba7f7acde48001122 | London | 0.67 | 1 | 0/0.00 | 0/0.33 | 1/1.00 |  |  |
| d6b470160baf11ebab90acde48001122 | Infanta Maria Antonia of Portugal | 0.67 | 1 | 0/0.00 | 0/0.22 | 0/0.22 |  |  |
| 32ebe13e0bb011ebab90acde48001122 | Albert II, Prince of Anhalt-Zerbst | 1.00 | 1 | 0/0.00 | 1/1.00 | 0/0.60 |  |  |
| a022d8580bdc11eba7f7acde48001122 | Ridley Scott | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 962889100baf11ebab90acde48001122 | Longqing | 0.50 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 314f72c20bde11eba7f7acde48001122 | United States | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 702515e80bdd11eba7f7acde48001122 | India | 0.67 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 8cd3fe6c0baf11ebab90acde48001122 | Fíngen mac Áedo Duib | 1.00 | 1 | 0/0.00 | 0/0.75 | 0/0.75 |  |  |
| 93dec34e0bdd11eba7f7acde48001122 | France | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 475b89f80bb011ebab90acde48001122 | Thyra | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 86ae8b920baf11ebab90acde48001122 | Alexander III of Russia | 1.00 | 1 | 0/0.00 | 0/0.89 | 0/0.60 |  |  |
| 9997225c0bda11eba7f7acde48001122 | Forest Lawn Memorial Park | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 3f5194f00bb011ebab90acde48001122 | Prince Harald of Denmark | 1.00 | 1 | 0/0.00 | 0/0.50 | 0/0.50 |  |  |
| ae741c140bdc11eba7f7acde48001122 | Lezhë | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 85dd56440baf11ebab90acde48001122 | Mark Hanna | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 5a34b04e0bd911eba7f7acde48001122 | France | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| a9ef43f80baf11ebab90acde48001122 | Charles VI of France | 0.50 | 1 | 0/0.00 | 0/0.89 | 1/1.00 |  |  |
| 411de60c0bde11eba7f7acde48001122 | Oslo | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 2fcf02980bdc11eba7f7acde48001122 | American | 0.33 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 24835b720bb011ebab90acde48001122 | Meresankh II | 0.50 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 0365ca8e0baf11ebab90acde48001122 | Farwah bint al-Qasim | 1.00 | 1 | 0/0.00 | 0/0.33 | 0/0.33 |  |  |
| 0f3c04300bdd11eba7f7acde48001122 | Helsinki | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| c289098a0bdc11eba7f7acde48001122 | Valparaíso | 1.00 | 1 | 0/0.00 | 0/0.67 | 0/0.67 |  |  |
| dffa1f8a0bdd11eba7f7acde48001122 | Kingsbury, London | 0.67 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 38ad21b40bdd11eba7f7acde48001122 | Königstein im Taunus | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 956a70660bdb11eba7f7acde48001122 | 10 November 1871 | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 1b911ab00bdb11eba7f7acde48001122 | Torgau | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| d64d24180bd911eba7f7acde48001122 | Weston-super-Mare, Somerset | 0.25 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 9caa68c80bda11eba7f7acde48001122 | 20 April 1434 | 0.50 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 146c16520bdd11eba7f7acde48001122 | Florida Atlantic | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 57eac88c0bde11eba7f7acde48001122 | West Branch, Iowa | 0.50 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 086e57720bdb11eba7f7acde48001122 | British | 0.67 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 63d16c1c0bdb11eba7f7acde48001122 | Saqqara | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 677658e80bde11eba7f7acde48001122 | Irish | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| bead88300bdd11eba7f7acde48001122 | Celle | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 1bfdd2d20bda11eba7f7acde48001122 | Otto Carlmar | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.50 |  |  |
| 8da9737a0bb011ebab90acde48001122 | Prince Yi Kang | 0.50 | 0 | 0/0.00 | 0/0.67 | 0/0.00 |  |  |
| 5ff9cc8c0baf11ebab90acde48001122 | Sir Thomas Lawley, 1st Baronet | 1.00 | 1 | 0/0.00 | 1/1.00 | 0/0.83 |  |  |
| 215df1140bb011ebab90acde48001122 | John Lyon, 3rd Lord Glamis | 0.50 | 1 | 0/0.00 | 0/0.80 | 0/0.80 |  |  |
| 7620acb80bde11eba7f7acde48001122 | University of California | 0.50 | 0 | 0/0.00 | 0/0.11 | 0/0.00 |  |  |
| 3d2336700bb011ebab90acde48001122 | Marie I de Coucy, Countess of Soissons | 0.67 | 1 | 0/0.00 | 0/0.20 | 0/0.20 |  |  |
| d082dda80bdd11eba7f7acde48001122 | UCLA | 0.50 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| fb1d2b4a0bdd11eba7f7acde48001122 | France | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| d52aa2a20bdb11eba7f7acde48001122 | Strasbourg | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 7f20efa00baf11ebab90acde48001122 | Maria Amalia of Naples and Sicily | 0.67 | 1 | 0/0.00 | 1/1.00 | 0/0.20 |  |  |
| 9946e9180bda11eba7f7acde48001122 | Paris | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 32eca0e20bb011ebab90acde48001122 | Louise d'Aumont | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| a457e11c0bdb11eba7f7acde48001122 | Gisela Elsner | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 6ce7c6c00bdb11eba7f7acde48001122 | 1323 | 0.50 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 3617c14e0bdc11eba7f7acde48001122 | 16 August 1932 | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 3ae059580bdb11eba7f7acde48001122 | Albuquerque, New Mexico | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 8145e4de0baf11ebab90acde48001122 | Germanicus | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 7250010e0bdb11eba7f7acde48001122 | Wawel Cathedral | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 6842323e0bb011ebab90acde48001122 | Christian August of Holstein-Gottorp, Prince of Eutin | 0.50 | 0 | 0/0.00 | 0/0.00 | 0/0.18 |  |  |
| bffe56600bdd11eba7f7acde48001122 | Swiss | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 914033c60baf11ebab90acde48001122 | Odo II, Count of Blois | 1.00 | 1 | 0/0.00 | 0/0.20 | 0/0.22 |  |  |
| f7ddb2ce0bdd11eba7f7acde48001122 | Warsaw | 0.50 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 525193fc0bb011ebab90acde48001122 | Jacques | 0.33 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 1848f4920bde11eba7f7acde48001122 | Konya | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 8b884d040bd911eba7f7acde48001122 | San Ferdinando di Puglia | 1.00 | 1 | 0/0.00 | 0/0.89 | 0/0.89 |  |  |
| bef95be60bda11eba7f7acde48001122 | Pyay | 0.50 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 579db8dc0baf11ebab90acde48001122 | Iyasu I | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.40 |  |  |
| cdb8b7540bd911eba7f7acde48001122 | Westwood Village Memorial Park Cemetery | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 5deff9420bdd11eba7f7acde48001122 | 25 July 1182 | 1.00 | 1 | 0/0.00 | 0/0.50 | 1/1.00 |  |  |
| 84b900aa0bdd11eba7f7acde48001122 | Camas | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| b42a916c0bda11eba7f7acde48001122 | Polish–Lithuanian Commonwealth | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| c1d45a9e0baf11ebab90acde48001122 | Connla Cáem | 0.67 | 1 | 0/0.00 | 1/1.00 | 0/0.00 |  |  |
| 725b8d040bda11eba7f7acde48001122 | 27 June 1497 | 0.50 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| e30de52a0bd911eba7f7acde48001122 | Santiago del Estero | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| e81fc36c0bd911eba7f7acde48001122 | QV66 | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| f6e6ddfc0bae11ebab90acde48001122 | Frederick VIII, Duke of Schleswig-Holstein | 1.00 | 1 | 0/0.00 | 0/0.20 | 0/0.40 |  |  |
| b8e03e4c0bd911eba7f7acde48001122 | American | 0.50 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 22457b2c0bda11eba7f7acde48001122 | Saffron Walden | 1.00 | 1 | 0/0.00 | 0/0.25 | 0/0.00 |  |  |
| f99150ee0bdd11eba7f7acde48001122 | English | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 361b56400bde11eba7f7acde48001122 | Bakersfield | 0.50 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 1eb681500bde11eba7f7acde48001122 | Rohan Marley | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| ce103d440bd911eba7f7acde48001122 | Theni | 1.00 | 1 | 0/0.00 | 0/0.25 | 0/0.25 |  |  |
| 6398d2d00bdb11eba7f7acde48001122 | Argentine | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 14552e680bda11eba7f7acde48001122 | Rome | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 5b6fc7880bdd11eba7f7acde48001122 | Annelise Hovmand | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 64ed06f40bdd11eba7f7acde48001122 | Rudolstadt | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 6e02089c0bde11eba7f7acde48001122 | German | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 579389860bda11eba7f7acde48001122 | Béziers | 1.00 | 1 | 0/0.00 | 0/0.67 | 0/0.67 |  |  |
| 1ccc20e00bdc11eba7f7acde48001122 | Dortmund University of Applied Sciences and Arts | 0.33 | 0 | 0/0.00 | 0/0.09 | 0/0.10 |  |  |
| 77cecc800bb011ebab90acde48001122 | Elizabeth Stewart | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 4e4d44440bd911eba7f7acde48001122 | Parkinson | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 48ad0aca0bb011ebab90acde48001122 | Roger Mortimer, 1st Earl of March | 0.33 | 0 | 0/0.00 | 0/0.31 | 0/0.00 |  |  |
| 9d3c3b060bdd11eba7f7acde48001122 | English | 0.25 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 5b44ffb00bda11eba7f7acde48001122 | Paris | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 60acf35c0bdc11eba7f7acde48001122 | Fearless Nadia | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 8ede14580bdd11eba7f7acde48001122 | Dresden | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 184d5d440bb011ebab90acde48001122 | Siemowit III, Duke of Masovia | 0.67 | 1 | 0/0.00 | 0/0.29 | 0/0.80 |  |  |
| 13476e200bdd11eba7f7acde48001122 | Berlin | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 183f6cc40bde11eba7f7acde48001122 | British | 0.33 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 9ab966100bdd11eba7f7acde48001122 | Commercy | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 8109b3800bda11eba7f7acde48001122 | 17 November 1845 | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 5d46fb540baf11ebab90acde48001122 | Elisabeth Farnese | 0.25 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 9affe3e40bdb11eba7f7acde48001122 | Přerov | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| ccf4967c0bdd11eba7f7acde48001122 | American | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| ded710180bdd11eba7f7acde48001122 | Neapolitan | 0.33 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 91e7e3780baf11ebab90acde48001122 | Kim Jong-il | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 96bf78ee0bdb11eba7f7acde48001122 | Öndörkhaan | 0.50 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| df6ec5f60bd911eba7f7acde48001122 | New York | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 58e236320baf11ebab90acde48001122 | Fernando García de Hita | 0.67 | 1 | 0/0.00 | 0/0.33 | 0/0.33 |  |  |
| 2bde31980bde11eba7f7acde48001122 | American | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 129b312e0baf11ebab90acde48001122 | Sir Paul Gore, 1st Baronet | 0.50 | 1 | 0/0.00 | 0/0.80 | 1/1.00 |  |  |
| 43c8e38e0bde11eba7f7acde48001122 | Virginia Bourbon del Monte | 1.00 | 1 | 0/0.00 | 0/0.33 | 0/0.33 |  |  |
| 5750bfd20bdc11eba7f7acde48001122 | Jean Harlow | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| f6f9fbdc0bd911eba7f7acde48001122 | Italy | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 33c3fd3e0bde11eba7f7acde48001122 | Brno | 0.67 | 1 | 0/0.00 | 1/1.00 | 0/0.00 |  |  |
| 421c46760bb011ebab90acde48001122 | Archduke Joseph, Palatine of Hungary | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.22 |  |  |
| b583abd20baf11ebab90acde48001122 | 'Adud al-Dawla | 1.00 | 1 | 0/0.00 | 0/0.50 | 0/0.50 |  |  |
| 3685f31a0bde11eba7f7acde48001122 | Academy of Fine Arts Vienna | 0.50 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 9b03b5fc0bd911eba7f7acde48001122 | Austrian | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| a59539480bdc11eba7f7acde48001122 | Mills College | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 17ba791a0bde11eba7f7acde48001122 | French | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| af7c73c80bdb11eba7f7acde48001122 | National Film School in Łódź | 0.67 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 845645da0bda11eba7f7acde48001122 | São Paulo | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 08d00bcc0bde11eba7f7acde48001122 | 14 September 1964 | 0.50 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| e6a74e020bdd11eba7f7acde48001122 | Memphis | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| ad66091e0bdb11eba7f7acde48001122 | Southampton | 0.25 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| db787f5c0bdc11eba7f7acde48001122 | British | 0.25 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 9a1b06b60bdb11eba7f7acde48001122 | Florida Atlantic | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| b60fd6a20bdc11eba7f7acde48001122 | Total Nonstop Action Wrestling | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 64d2a3ae0bdd11eba7f7acde48001122 | 3 June 1801 | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| c5ae29fc0bdb11eba7f7acde48001122 | Writtle | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 169e179a0bb011ebab90acde48001122 | Muryeong | 0.50 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 5c04f9c00bb011ebab90acde48001122 | Richard de Umfraville | 1.00 | 1 | 0/0.00 | 0/0.67 | 1/1.00 |  |  |
| 6a701bca0bb011ebab90acde48001122 | Joanna of Hainaut | 0.50 | 1 | 0/0.00 | 0/0.33 | 0/0.67 |  |  |
| 61964be60bb011ebab90acde48001122 | Anne Gore | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 2de3495a0bda11eba7f7acde48001122 | Hunsur | 1.00 | 1 | 0/0.00 | 0/0.20 | 0/0.00 |  |  |
| bbaa84b60bd911eba7f7acde48001122 | Hanover | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| abaff0940bdb11eba7f7acde48001122 | Mymensingh Medical College | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| f29525d60bdd11eba7f7acde48001122 | Jaffna, Sri Lanka | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 8d91732e0bb011ebab90acde48001122 | Albert I, Prince of Anhalt-Zerbst | 1.00 | 1 | 0/0.00 | 0/0.22 | 0/0.22 |  |  |
| 16e632b80bde11eba7f7acde48001122 | Roman | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 71dbcd8e0bdb11eba7f7acde48001122 | Tanis | 0.67 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 791396a60bd911eba7f7acde48001122 | BRIT Awards | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.50 |  |  |
| 95fc33400bd911eba7f7acde48001122 | French | 0.67 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 8cdc97de0bdc11eba7f7acde48001122 | San Diego | 0.67 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| cef85d800bda11eba7f7acde48001122 | Parkinson's disease | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 68bb42e00bd911eba7f7acde48001122 | Yale | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| de7c73480bdc11eba7f7acde48001122 | Jerseyville | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 0a65b7300bb011ebab90acde48001122 | Joseph, Duke of Saxe-Altenburg | 1.00 | 1 | 0/0.00 | 0/0.25 | 0/0.62 |  |  |
| 2db288200bde11eba7f7acde48001122 | New York | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 2c95284e0bde11eba7f7acde48001122 | Foshan | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 8171f7920bda11eba7f7acde48001122 | pneumonia | 0.50 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 02912df60baf11ebab90acde48001122 | Eleanor of Aquitaine | 0.67 | 1 | 0/0.00 | 0/0.67 | 0/0.67 |  |  |
| 6a37394e0bde11eba7f7acde48001122 | Mississauga | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 410ea9b20bde11eba7f7acde48001122 | Esparza | 0.00 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| c09c7c060baf11ebab90acde48001122 | Princess Therese of Nassau-Weilburg | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.22 |  |  |
| c92dac4e0bd911eba7f7acde48001122 | Kassel | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 42359f760bde11eba7f7acde48001122 | Bronx | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| f9db61ba0bd911eba7f7acde48001122 | Army | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| bc096c180bdb11eba7f7acde48001122 | 20 June 1634 | 0.67 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 602729aa0bde11eba7f7acde48001122 | Bakersfield, California | 0.50 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 37f8b9d20bdc11eba7f7acde48001122 | November 7, 1916 | 1.00 | 1 | 0/0.00 | 0/0.00 | 1/1.00 |  |  |
| 593381a80bdd11eba7f7acde48001122 | St. Peter's Basilica | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| fc2f7e460bda11eba7f7acde48001122 | Rēzekne | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| f4a616ac0bae11ebab90acde48001122 | Adelaide, Countess of Soissons | 1.00 | 1 | 0/0.00 | 1/1.00 | 0/0.00 |  |  |
| 1f38945c0bb011ebab90acde48001122 | George III, Count of Erbach-Breuberg | 1.00 | 1 | 0/0.00 | 0/0.40 | 1/1.00 |  |  |
| 1bb538ec0bda11eba7f7acde48001122 | Leningrad | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 9b08d2780bdc11eba7f7acde48001122 | Japan | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| f66993ce0bae11ebab90acde48001122 | Anna of Eppstein-Königstein | 0.67 | 1 | 0/0.00 | 0/0.33 | 0/0.00 |  |  |
| 8879d5b60bb011ebab90acde48001122 | Grand Duke Paul Alexandrovich of Russia | 0.33 | 0 | 0/0.00 | 0/0.67 | 0/0.67 |  |  |
| 06d9b7aa0bde11eba7f7acde48001122 | Moreno Valley | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 9042c21c0bdd11eba7f7acde48001122 | 31 January 1330 | 0.67 | 1 | 0/0.00 | 0/0.31 | 0/0.00 |  |  |
| 0234f1ec0bde11eba7f7acde48001122 | Lao | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 61e86d5a0bdc11eba7f7acde48001122 | Hong Kong Academy for Performing Arts | 0.50 | 1 | 0/0.00 | 0/0.00 | 0/0.11 |  |  |
| 6b62ba5a0bde11eba7f7acde48001122 | United Kingdom | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 0464f5040bdc11eba7f7acde48001122 | Cahiers du cinéma | 1.00 | 1 | 0/0.00 | 0/0.00 | 1/1.00 |  |  |
| 7fcdac2e0bda11eba7f7acde48001122 | Parkinson | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 471af9880bdd11eba7f7acde48001122 | London | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 89db525e0bdd11eba7f7acde48001122 | Madrid | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| e5c738900bdc11eba7f7acde48001122 | New York | 1.00 | 1 | 0/0.00 | 0/0.67 | 0/0.67 |  |  |
| 8bccf6360bdc11eba7f7acde48001122 | Leicester | 0.50 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| ea862fd00baf11ebab90acde48001122 | Hirini Moko Mead | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 0b1244de0bdb11eba7f7acde48001122 | Coral Gables, Florida | 0.67 | 1 | 0/0.00 | 1/1.00 | 0/0.80 |  |  |
| 60c67bce0bdc11eba7f7acde48001122 | French | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 36f7185c0bdd11eba7f7acde48001122 | German | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 62fc67720bdd11eba7f7acde48001122 | New York | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 4554d82a0bd911eba7f7acde48001122 | Hagfors | 1.00 | 1 | 0/0.00 | 0/0.67 | 1/1.00 |  |  |
| 3f5c3d7e0bb011ebab90acde48001122 | Henry VIII the Sparrow | 1.00 | 1 | 0/0.00 | 1/1.00 | 0/0.33 |  |  |
| 4096c23c0bdc11eba7f7acde48001122 | San Ferdinando di Puglia | 0.67 | 1 | 0/0.00 | 0/0.89 | 0/0.89 |  |  |
| fde3a7880bdc11eba7f7acde48001122 | 7 September 1868 | 1.00 | 1 | 0/0.00 | 0/0.00 | 1/1.00 |  |  |
| 788976e40baf11ebab90acde48001122 | Joan of Acre | 1.00 | 1 | 0/0.00 | 0/0.25 | 0/0.00 |  |  |
| 1011a79c0bde11eba7f7acde48001122 | Northamptonshire | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 2895660a0bde11eba7f7acde48001122 | Khenifra | 0.50 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 4a9c5bde0baf11ebab90acde48001122 | Elisabeth Dorothea of Saxe-Gotha-Altenburg | 1.00 | 1 | 0/0.00 | 0/0.50 | 1/1.00 |  |  |
| cecadcce0bdb11eba7f7acde48001122 | Alençon | 1.00 | 1 | 0/0.00 | 0/0.67 | 0/0.67 |  |  |
| 327a14420baf11ebab90acde48001122 | Louis X of France | 1.00 | 1 | 0/0.00 | 0/0.25 | 0/0.25 |  |  |
| 82af24340bdc11eba7f7acde48001122 | Branson, Missouri | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| b6a50cf60bda11eba7f7acde48001122 | Toungoo Empire | 0.50 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 330614b80bde11eba7f7acde48001122 | Peabody Conservatory | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| c8ecc2800bdc11eba7f7acde48001122 | Santa Barbara, California | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 39bd87c80bde11eba7f7acde48001122 | 1969 | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| e084363c0bda11eba7f7acde48001122 | January 26, 1955 | 1.00 | 1 | 0/0.00 | 0/0.00 | 1/1.00 |  |  |
| 84d024380bdd11eba7f7acde48001122 | Hamburg, Germany | 0.67 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 88d450740bdb11eba7f7acde48001122 | Ekushey Padak | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 5a79e5060bde11eba7f7acde48001122 | Tower | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 5fa12b860bdc11eba7f7acde48001122 | Bogotá | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 5b04767e0bdb11eba7f7acde48001122 | 4 January 1790 | 0.67 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 8da198100bda11eba7f7acde48001122 | Père Lachaise Cemetery | 0.50 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 6c7b27ac0bb011ebab90acde48001122 | Adolph I | 0.00 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 3f8aca640bdc11eba7f7acde48001122 | Cardross | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| e86cef4e0bdd11eba7f7acde48001122 | Munich | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| e15b1fe20baf11ebab90acde48001122 | Ansegisel | 0.33 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 799ec8c80bdb11eba7f7acde48001122 | Buenos Aires | 1.00 | 1 | 0/0.00 | 0/0.57 | 0/0.57 |  |  |
| 53e18b8c0bb011ebab90acde48001122 | William Henry Fellowes | 0.50 | 1 | 0/0.00 | 0/0.80 | 1/1.00 |  |  |
| 123d4cf40bdb11eba7f7acde48001122 | Liverpool | 0.67 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 65e000ee0bdc11eba7f7acde48001122 | 1947 | 0.50 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 4a0422f00bb011ebab90acde48001122 | Frederick Francis III, Grand Duke of Mecklenburg-Schwerin | 1.00 | 1 | 0/0.00 | 0/0.36 | 1/1.00 |  |  |
| f414cc960bdc11eba7f7acde48001122 | Forest Lawn Memorial Park | 1.00 | 1 | 0/0.00 | 0/0.80 | 0/0.80 |  |  |
| c8104dcc0bdd11eba7f7acde48001122 | 3 February 1735 | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.33 |  |  |
| f3c9cb920baf11ebab90acde48001122 | Drusus Julius Caesar | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 69b5d9640bdc11eba7f7acde48001122 | Kreuth | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 4ed186f00bde11eba7f7acde48001122 | Macedonia | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| fa3a75300baf11ebab90acde48001122 | Casimir I of Oświęcim | 0.50 | 1 | 0/0.00 | 0/0.00 | 0/0.44 |  |  |
| 1bacbdfe0bdd11eba7f7acde48001122 | Kırklareli | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 23f9d9580bdb11eba7f7acde48001122 | Buenos Aires | 1.00 | 1 | 0/0.00 | 0/0.57 | 0/0.80 |  |  |
| 8b68595a0bdd11eba7f7acde48001122 | Pennsylvania | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 21f924140baf11ebab90acde48001122 | Honoré IV, Prince of Monaco | 0.67 | 1 | 0/0.00 | 0/0.67 | 0/0.67 |  |  |
| df13ddf40bdd11eba7f7acde48001122 | Sasaram | 1.00 | 1 | 0/0.00 | 0/0.00 | 1/1.00 |  |  |
| ea6738c60bd911eba7f7acde48001122 | 1 October 1844 | 1.00 | 1 | 0/0.00 | 0/0.00 | 1/1.00 |  |  |
| 3d682f700bdb11eba7f7acde48001122 | German | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 48ba7ee20bda11eba7f7acde48001122 | Ariane Ascaride | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| f325411c0bdc11eba7f7acde48001122 | Bouxwiller | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 0c0b964c0bdb11eba7f7acde48001122 | Eva-Riitta Siitonen | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| d61d801e0bd911eba7f7acde48001122 | Rudolf Hausner | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 619580300bb011ebab90acde48001122 | John George I, Duke of Saxe-Eisenach | 0.00 | 1 | 0/0.00 | 0/0.17 | 0/0.20 |  |  |
| 4165dd540bde11eba7f7acde48001122 | China University of Political Science and Law | 0.67 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 0cc593140bde11eba7f7acde48001122 | KV35 | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| e1b201da0bdd11eba7f7acde48001122 | Coimbra | 0.67 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 48b07de00bb011ebab90acde48001122 | Frederick Francis I, Grand Duke of Mecklenburg-Schwerin | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| bb5b1ade0bd911eba7f7acde48001122 | Amman | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| d61d3fd20bd911eba7f7acde48001122 | New York | 1.00 | 1 | 0/0.00 | 0/0.67 | 0/0.36 |  |  |
| 16ef62f20bde11eba7f7acde48001122 | Great Britain | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
