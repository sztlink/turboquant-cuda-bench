# Entity-Hop Soft Multi-Candidate Policy

total: 100

| condition | EM | contains | F1 |
|---|---:|---:|---:|
| bge_ref | 0.090 | 0.160 | 0.185 |
| path_prompt | 0.250 | 0.340 | 0.330 |
| soft_policy | 0.220 | 0.320 | 0.320 |

## Win/loss

```json
{
  "soft_wins_vs_path": 1,
  "soft_losses_vs_path": 4,
  "soft_wins_vs_bge": 16,
  "soft_losses_vs_bge": 3
}
```

## Rows

| idx | gold | path | soft | candidates | soft output |
|---:|---|---:|---:|---:|---|
| 0 | Małgorzata Braunek | 1/1.00 | 1/1.00 | 12 | `Małgorzata Braunek` |
| 1 | 12 June 1516 | 1/1.00 | 1/1.00 | 10 | `12 June 1516` |
| 2 | Myanmar Motion Picture Academy Awards | 1/1.00 | 0/0.80 | 12 | `Myanmar Motion Picture Academy Awards-winning` |
| 3 | Missoula, Montana | 0/0.00 | 0/0.00 | 12 | `The question cannot be answered with the given passages and candidate entity graph. There ` |
| 4 | Charles Armand René de La Trémoille | 1/1.00 | 0/0.67 | 8 | `Charles Louis Bretagne de La Trémoille` |
| 5 | Galați | 1/1.00 | 1/1.00 | 12 | `Galați` |
| 6 | Ptolemy IX Lathyros | 0/0.33 | 0/0.33 | 12 | `Antiochus IX Cyzicenus` |
| 7 | Brooklyn | 0/0.00 | 0/0.00 | 12 | `Ken Burns was born in 1953.` |
| 8 | stroke | 0/0.00 | 0/0.00 | 12 | `Princess Victoria Melita of Saxe-Coburg and Gotha died on 2 March 1936` |
| 9 | Nice | 1/1.00 | 1/1.00 | 12 | `Nice` |
| 10 | 1983 | 0/0.00 | 0/0.00 | 12 | `2004` |
| 11 | United States | 0/0.00 | 0/0.00 | 12 | `American` |
| 12 | Rupert | 0/0.50 | 0/0.50 | 11 | `Rupert of Germany` |
| 13 | Marie Leszczyńska | 0/0.00 | 0/0.00 | 12 | `Margaret of Artois` |
| 14 | Catherine Robbe-Grillet | 0/0.00 | 0/0.00 | 12 | `Martha De Laurentiis` |
| 15 | Hilandar | 0/0.00 | 0/0.00 | 12 | `Serbia` |
| 16 | Pompey | 0/0.00 | 0/0.00 | 12 | `Scribonia (wife of Crassus)` |
| 17 | tuberculosis | 0/0.29 | 0/0.22 | 12 | `Katherine Mansfield died of extrapulmonary tuberculosis in 1923.` |
| 18 | Rukn al-Dawla | 0/0.50 | 0/0.50 | 11 | `Adud al-Dawla` |
| 19 | Xi'an | 0/0.67 | 1/1.00 | 12 | `Xi'an` |
| 20 | German | 0/0.00 | 0/0.00 | 12 | `Russia` |
| 21 | Louis-Alexandre Berthier | 0/0.00 | 0/0.00 | 8 | `William Montagu Douglas Scott, 6th Duke of Buccleuch` |
| 22 | Pavia | 0/0.00 | 0/0.00 | 11 | `Forlì` |
| 23 | Víctor Bó | 0/0.00 | 0/0.00 | 12 | `Isabel Sarli` |
| 24 | Urraca of Castile | 0/0.33 | 0/0.33 | 12 | `Eleanor of Viseu` |
| 25 | Cahiers du cinéma | 0/0.00 | 0/0.00 | 12 | `House of Lords` |
| 26 | Sir Arthur Gore, 2nd Baronet | 0/0.80 | 0/0.80 | 10 | `Sir Arthur Gore, 1st Baronet` |
| 27 | London | 0/0.50 | 0/0.50 | 9 | `Grosvenor Square, London` |
| 28 | Pakistan | 0/0.00 | 0/0.00 | 12 | `India` |
| 29 | Winnipeg, Manitoba | 0/0.00 | 0/0.00 | 12 | `South Porcupine, Ontario` |
| 30 | Fukuoka | 0/0.00 | 0/0.00 | 12 | `Worksop, Nottinghamshire` |
| 31 | Roma | 0/0.00 | 0/0.00 | 12 | `Antonio Leonviola died in Italy.` |
| 32 | Moscow, USSR | 1/1.00 | 1/1.00 | 9 | `Moscow, USSR` |
| 33 | Jeanne d'Albret | 0/0.00 | 0/0.00 | 12 | `Eleanor of Navarre` |
| 34 | New York | 0/0.00 | 0/0.00 | 12 | `The passage does not provide the birthplace of the director of The Half-Way Girl. The dire` |
| 35 | Louis II | 0/0.00 | 0/0.00 | 12 | `Albert I, Duke of Bavaria` |
| 36 | Bohemia | 0/0.00 | 0/0.00 | 12 | `Duchy of Hainaut` |
| 37 | Gura Humorului | 0/0.00 | 0/0.00 | 12 | `Palos Verdes Estates, California, USA` |
| 38 | Meran | 0/0.29 | 0/0.29 | 12 | `Obermais, Meran, County of Tyrol, Austria–Hungary` |
| 39 | Grammy | 0/0.00 | 0/0.00 | 12 | `N/A` |
| 40 | Peter I | 0/0.00 | 0/0.00 | 12 | `Louis of Piedmont` |
| 41 | 24 March 1927 | 0/0.00 | 0/0.00 | 12 | `18 July 1918` |
| 42 | Ostrogothic Kingdom | 0/0.00 | 0/0.00 | 12 | `Ostrogoths` |
| 43 | Kurdish | 0/0.00 | 0/0.00 | 12 | `Place of origin` |
| 44 | Liverpool | 1/1.00 | 1/1.00 | 12 | `Liverpool` |
| 45 | Louis, Grand Dauphin | 0/0.00 | 0/0.00 | 12 | `Philip V of Spain` |
| 46 | Kujō Michiie | 1/1.00 | 1/1.00 | 12 | `Kujō Michiie` |
| 47 | Madrid | 1/1.00 | 1/1.00 | 12 | `Madrid` |
| 48 | United Nations | 1/1.00 | 1/1.00 | 12 | `United Nations` |
| 49 | Paris | 0/0.00 | 0/0.00 | 11 | `Alexandria, Egypt` |
| 50 | Mathilde of Bourbon | 0/0.00 | 0/0.00 | 12 | `Tiburge de Sarenom` |
| 51 | London | 1/1.00 | 1/1.00 | 12 | `London` |
| 52 | Königsberg | 0/0.50 | 0/0.50 | 12 | `Gurievsk near Königsberg` |
| 53 | Homs | 0/0.00 | 0/0.00 | 12 | `Stony Brook University` |
| 54 | Alain Poiré | 1/1.00 | 0/0.50 | 12 | `Jean-Marie Poiré` |
| 55 | Naha, Okinawa | 0/0.80 | 0/0.80 | 12 | `Naha, Okinawa, Japan` |
| 56 | Byzantine | 0/0.00 | 0/0.00 | 10 | `Greek` |
| 57 | August 8, 1975 | 1/1.00 | 1/1.00 | 12 | `August 8, 1975` |
| 58 | Chuck Schumer | 0/0.00 | 0/0.00 | 12 | `Anthony Weiner worked as a Democratic congressman.` |
| 59 | Florence | 0/0.00 | 0/0.00 | 12 | `Forlì` |
| 60 | Helsingfors | 0/0.00 | 0/0.00 | 12 | `Place of origin` |
| 61 | Dutch | 0/0.00 | 0/0.00 | 10 | `Netherlands` |
| 62 | Tisch | 0/0.22 | 0/0.22 | 12 | `Tisch School of the Arts of New York University` |
| 63 | India | 0/0.00 | 0/0.00 | 12 | `Korean` |
| 64 | leukemia | 0/0.00 | 0/0.00 | 12 | `The information about Alex Matthiessen's father's cause of death is not provided in the gi` |
| 65 | Herstal | 0/0.00 | 0/0.00 | 12 | `Place of origin` |
| 66 | 22 January 1794 | 0/0.00 | 0/0.00 | 10 | `six months before Lord Patrick Crichton-Stuart was born` |
| 67 | Stanisław Leszczyński | 0/0.00 | 0/0.00 | 12 | `King Louis XIV of France` |
| 68 | 3 August 979 | 0/0.00 | 0/0.00 | 12 | `13 March 993` |
| 69 | Aldo Parisot | 0/0.00 | 0/0.00 | 12 | `Kriv Stenders` |
| 70 | 1886 | 1/1.00 | 1/1.00 | 12 | `1886` |
| 71 | Nevele | 1/1.00 | 1/1.00 | 12 | `Nevele` |
| 72 | Manchester | 1/1.00 | 1/1.00 | 12 | `Manchester` |
| 73 | Tantallon Castle | 0/0.29 | 0/0.29 | 12 | `Douglas Castle, Douglas, South Lanarkshire` |
| 74 | American | 0/0.00 | 0/0.00 | 12 | `German` |
| 75 | Sochi | 0/0.00 | 0/0.00 | 12 | `Place of origin` |
| 76 | French | 0/0.00 | 0/0.00 | 12 | `Canada` |
| 77 | Winnipeg, Manitoba | 1/1.00 | 1/1.00 | 12 | `Winnipeg, Manitoba` |
| 78 | Villafranca del Bierzo | 0/0.00 | 0/0.00 | 12 | `Florence` |
| 79 | Jean Hersholt Humanitarian Award | 1/1.00 | 1/1.00 | 12 | `Jean Hersholt Humanitarian Award` |
| 80 | Princess Madeleine, Duchess of Hälsingland and Gästrikland | 0/0.44 | 0/0.44 | 12 | `Princess Madeleine` |
| 81 | Princess Augusta of Schwarzburg-Sondershausen | 0/0.50 | 0/0.50 | 12 | `Princess Emma of Anhalt-Bernburg-Schaumburg-Hoym` |
| 82 | Cahiers du cinéma | 1/1.00 | 1/1.00 | 12 | `Cahiers du cinéma` |
| 83 | China | 0/0.00 | 0/0.00 | 10 | `Qatar` |
| 84 | Charles I of Naples | 0/0.10 | 0/0.29 | 12 | `Beatrice of Provence` |
| 85 | Argentina | 1/1.00 | 1/1.00 | 12 | `Argentina` |
| 86 | Jacques Cousteau | 0/0.50 | 0/0.50 | 12 | `Jean-Michel Cousteau` |
| 87 | Thessaloniki | 0/0.00 | 0/0.00 | 12 | `Assassination in 1913` |
| 88 | New York | 0/0.00 | 0/0.00 | 12 | `Place of birth` |
| 89 | University of Paris | 0/0.00 | 0/0.00 | 12 | `N/A` |
| 90 | Hackney | 0/0.00 | 0/0.00 | 12 | `Place of birth` |
| 91 | 1969 | 1/1.00 | 0/0.67 | 12 | `December 1969` |
| 92 | Huahine | 1/1.00 | 1/1.00 | 12 | `Huahine` |
| 93 | Brighton | 0/0.00 | 0/0.00 | 12 | `Death information not provided for George Albert Smith.` |
| 94 | 10 May 1912 | 0/0.00 | 0/0.00 | 5 | `20 April 1805` |
| 95 | John de Vere, 15th Earl of Oxford | 1/1.00 | 1/1.00 | 11 | `John de Vere, 15th Earl of Oxford` |
| 96 | Kreuzlingen | 0/0.00 | 0/0.00 | 11 | `Berlin` |
| 97 | Florence | 0/0.00 | 0/0.00 | 10 | `Città di Castello` |
| 98 | Århus | 0/0.40 | 0/0.40 | 12 | `Århus, Region Midtjylland, Denmark` |
| 99 | Florence | 1/1.00 | 1/1.00 | 12 | `Florence` |
