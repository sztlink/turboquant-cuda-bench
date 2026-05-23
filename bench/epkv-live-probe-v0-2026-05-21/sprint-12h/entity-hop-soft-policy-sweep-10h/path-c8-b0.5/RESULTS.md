# Entity-Hop Soft Multi-Candidate Policy

total: 100

| condition | EM | contains | F1 |
|---|---:|---:|---:|
| bge_ref | 0.090 | 0.160 | 0.185 |
| path_prompt | 0.250 | 0.340 | 0.330 |
| soft_policy | 0.220 | 0.320 | 0.309 |

## Win/loss

```json
{
  "soft_wins_vs_path": 0,
  "soft_losses_vs_path": 3,
  "soft_wins_vs_bge": 16,
  "soft_losses_vs_bge": 3
}
```

## Rows

| idx | gold | path | soft | candidates | soft output |
|---:|---|---:|---:|---:|---|
| 0 | Małgorzata Braunek | 1/1.00 | 1/1.00 | 8 | `Małgorzata Braunek` |
| 1 | 12 June 1516 | 1/1.00 | 1/1.00 | 8 | `12 June 1516` |
| 2 | Myanmar Motion Picture Academy Awards | 1/1.00 | 0/0.80 | 8 | `Myanmar Motion Picture Academy Awards-winning` |
| 3 | Missoula, Montana | 0/0.00 | 0/0.00 | 8 | `The question cannot be answered with the given passages and candidate entity graph. There ` |
| 4 | Charles Armand René de La Trémoille | 1/1.00 | 1/1.00 | 8 | `Charles Armand René de La Trémoille` |
| 5 | Galați | 1/1.00 | 0/0.00 | 8 | `Bucharest` |
| 6 | Ptolemy IX Lathyros | 0/0.33 | 0/0.33 | 8 | `Antiochus IX Cyzicenus` |
| 7 | Brooklyn | 0/0.00 | 0/0.00 | 8 | `Ken Burns was born in 1953.` |
| 8 | stroke | 0/0.00 | 0/0.00 | 8 | `Princess Victoria Melita of Saxe-Coburg and Gotha died on 2 March 1936` |
| 9 | Nice | 1/1.00 | 1/1.00 | 8 | `Nice` |
| 10 | 1983 | 0/0.00 | 0/0.00 | 8 | `2004` |
| 11 | United States | 0/0.00 | 0/0.00 | 8 | `American` |
| 12 | Rupert | 0/0.50 | 0/0.50 | 8 | `Rupert of Germany` |
| 13 | Marie Leszczyńska | 0/0.00 | 0/0.00 | 8 | `Margaret of Artois` |
| 14 | Catherine Robbe-Grillet | 0/0.00 | 0/0.00 | 8 | `Martha De Laurentiis` |
| 15 | Hilandar | 0/0.00 | 0/0.00 | 8 | `Serbia` |
| 16 | Pompey | 0/0.00 | 0/0.00 | 8 | `Scribonia (wife of Crassus)` |
| 17 | tuberculosis | 0/0.29 | 0/0.29 | 8 | `Katherine Mansfield died of extrapulmonary tuberculosis.` |
| 18 | Rukn al-Dawla | 0/0.50 | 0/0.50 | 8 | `Adud al-Dawla` |
| 19 | Xi'an | 0/0.67 | 0/0.67 | 8 | `Xi'an, Shaanxi` |
| 20 | German | 0/0.00 | 0/0.00 | 8 | `Russia` |
| 21 | Louis-Alexandre Berthier | 0/0.00 | 0/0.00 | 8 | `William Montagu Douglas Scott, 6th Duke of Buccleuch` |
| 22 | Pavia | 0/0.00 | 0/0.00 | 8 | `Forlì` |
| 23 | Víctor Bó | 0/0.00 | 0/0.00 | 8 | `Isabel Sarli` |
| 24 | Urraca of Castile | 0/0.33 | 0/0.33 | 8 | `Eleanor of Viseu` |
| 25 | Cahiers du cinéma | 0/0.00 | 0/0.00 | 8 | `House of Lords` |
| 26 | Sir Arthur Gore, 2nd Baronet | 0/0.80 | 0/0.80 | 8 | `Sir Arthur Gore, 1st Baronet` |
| 27 | London | 0/0.50 | 0/0.50 | 8 | `Grosvenor Square, London` |
| 28 | Pakistan | 0/0.00 | 0/0.00 | 8 | `India` |
| 29 | Winnipeg, Manitoba | 0/0.00 | 0/0.00 | 8 | `South Porcupine, Ontario` |
| 30 | Fukuoka | 0/0.00 | 0/0.00 | 8 | `Worksop, Nottinghamshire` |
| 31 | Roma | 0/0.00 | 0/0.00 | 8 | `Antonio Leonviola` |
| 32 | Moscow, USSR | 1/1.00 | 1/1.00 | 8 | `Moscow, USSR` |
| 33 | Jeanne d'Albret | 0/0.00 | 0/0.00 | 8 | `Eleanor of Navarre` |
| 34 | New York | 0/0.00 | 0/0.00 | 8 | `The passage does not provide the birthplace of the director of The Half-Way Girl. The dire` |
| 35 | Louis II | 0/0.00 | 0/0.00 | 8 | `Albert I, Duke of Bavaria` |
| 36 | Bohemia | 0/0.00 | 0/0.00 | 8 | `Duchy of Hainaut` |
| 37 | Gura Humorului | 0/0.00 | 0/0.00 | 8 | `Palos Verdes Estates, California, USA` |
| 38 | Meran | 0/0.29 | 0/0.29 | 8 | `Obermais, Meran, County of Tyrol, Austria–Hungary` |
| 39 | Grammy | 0/0.00 | 0/0.00 | 8 | `No award mentioned for Joe Jackson in the given passages.` |
| 40 | Peter I | 0/0.00 | 0/0.00 | 8 | `Louis of Piedmont` |
| 41 | 24 March 1927 | 0/0.00 | 0/0.00 | 8 | `18 July 1918` |
| 42 | Ostrogothic Kingdom | 0/0.00 | 0/0.00 | 8 | `Ostrogoths` |
| 43 | Kurdish | 0/0.00 | 0/0.00 | 8 | `Place of origin` |
| 44 | Liverpool | 1/1.00 | 1/1.00 | 8 | `Liverpool` |
| 45 | Louis, Grand Dauphin | 0/0.00 | 0/0.00 | 8 | `Philip V of Spain` |
| 46 | Kujō Michiie | 1/1.00 | 1/1.00 | 8 | `Kujō Michiie` |
| 47 | Madrid | 1/1.00 | 0/0.00 | 8 | `Place of birth` |
| 48 | United Nations | 1/1.00 | 1/1.00 | 8 | `United Nations` |
| 49 | Paris | 0/0.00 | 0/0.00 | 8 | `Alexandria, Egypt` |
| 50 | Mathilde of Bourbon | 0/0.00 | 0/0.00 | 8 | `Tiburge de Sarenom` |
| 51 | London | 1/1.00 | 1/1.00 | 8 | `London` |
| 52 | Königsberg | 0/0.50 | 0/0.50 | 8 | `Gurievsk near Königsberg` |
| 53 | Homs | 0/0.00 | 0/0.00 | 8 | `Stony Brook University` |
| 54 | Alain Poiré | 1/1.00 | 1/1.00 | 8 | `Alain Poiré` |
| 55 | Naha, Okinawa | 0/0.80 | 0/0.80 | 8 | `Naha, Okinawa, Japan` |
| 56 | Byzantine | 0/0.00 | 0/0.00 | 8 | `Greek` |
| 57 | August 8, 1975 | 1/1.00 | 1/1.00 | 8 | `August 8, 1975` |
| 58 | Chuck Schumer | 0/0.00 | 0/0.00 | 8 | `Anthony Weiner worked as a Democratic congressman.` |
| 59 | Florence | 0/0.00 | 0/0.00 | 8 | `Forlì` |
| 60 | Helsingfors | 0/0.00 | 0/0.00 | 8 | `Place of origin` |
| 61 | Dutch | 0/0.00 | 0/0.00 | 8 | `Netherlands` |
| 62 | Tisch | 0/0.22 | 0/0.22 | 8 | `Tisch School of the Arts of New York University` |
| 63 | India | 0/0.00 | 0/0.00 | 8 | `Korean` |
| 64 | leukemia | 0/0.00 | 0/0.00 | 8 | `No information provided in the passages about Alex Matthiessen's father's cause of death.` |
| 65 | Herstal | 0/0.00 | 0/0.00 | 8 | `Place of origin` |
| 66 | 22 January 1794 | 0/0.00 | 0/0.00 | 8 | `six months before Lord Patrick Crichton-Stuart was born` |
| 67 | Stanisław Leszczyński | 0/0.00 | 0/0.00 | 8 | `King Louis XIV of France` |
| 68 | 3 August 979 | 0/0.00 | 0/0.00 | 8 | `1015` |
| 69 | Aldo Parisot | 0/0.00 | 0/0.00 | 8 | `Kriv Stenders` |
| 70 | 1886 | 1/1.00 | 1/1.00 | 8 | `1886` |
| 71 | Nevele | 1/1.00 | 1/1.00 | 8 | `Nevele` |
| 72 | Manchester | 1/1.00 | 1/1.00 | 8 | `Manchester` |
| 73 | Tantallon Castle | 0/0.29 | 0/0.29 | 8 | `Douglas Castle, Douglas, South Lanarkshire` |
| 74 | American | 0/0.00 | 0/0.00 | 8 | `German` |
| 75 | Sochi | 0/0.00 | 0/0.00 | 8 | `Place of origin` |
| 76 | French | 0/0.00 | 0/0.00 | 8 | `Canada` |
| 77 | Winnipeg, Manitoba | 1/1.00 | 1/1.00 | 8 | `Winnipeg, Manitoba` |
| 78 | Villafranca del Bierzo | 0/0.00 | 0/0.00 | 8 | `Florence` |
| 79 | Jean Hersholt Humanitarian Award | 1/1.00 | 1/1.00 | 8 | `Jean Hersholt Humanitarian Award` |
| 80 | Princess Madeleine, Duchess of Hälsingland and Gästrikland | 0/0.44 | 0/0.44 | 8 | `Princess Madeleine` |
| 81 | Princess Augusta of Schwarzburg-Sondershausen | 0/0.50 | 0/0.50 | 8 | `Princess Emma of Anhalt-Bernburg-Schaumburg-Hoym` |
| 82 | Cahiers du cinéma | 1/1.00 | 1/1.00 | 8 | `Cahiers du cinéma` |
| 83 | China | 0/0.00 | 0/0.00 | 8 | `Qatar` |
| 84 | Charles I of Naples | 0/0.10 | 0/0.29 | 8 | `Beatrice of Provence` |
| 85 | Argentina | 1/1.00 | 1/1.00 | 8 | `Argentina` |
| 86 | Jacques Cousteau | 0/0.50 | 0/0.50 | 8 | `Jean-Michel Cousteau` |
| 87 | Thessaloniki | 0/0.00 | 0/0.00 | 8 | `Assassination in 1913` |
| 88 | New York | 0/0.00 | 0/0.00 | 8 | `Place of birth` |
| 89 | University of Paris | 0/0.00 | 0/0.00 | 8 | `N/A` |
| 90 | Hackney | 0/0.00 | 0/0.00 | 8 | `Place of origin` |
| 91 | 1969 | 1/1.00 | 1/1.00 | 8 | `1969` |
| 92 | Huahine | 1/1.00 | 1/1.00 | 8 | `Huahine` |
| 93 | Brighton | 0/0.00 | 0/0.00 | 8 | `Death not mentioned` |
| 94 | 10 May 1912 | 0/0.00 | 0/0.00 | 5 | `20 April 1805` |
| 95 | John de Vere, 15th Earl of Oxford | 1/1.00 | 1/1.00 | 8 | `John de Vere, 15th Earl of Oxford` |
| 96 | Kreuzlingen | 0/0.00 | 0/0.00 | 8 | `Berlin` |
| 97 | Florence | 0/0.00 | 0/0.00 | 8 | `Città di Castello` |
| 98 | Århus | 0/0.40 | 0/0.40 | 8 | `Århus, Region Midtjylland, Denmark` |
| 99 | Florence | 1/1.00 | 1/1.00 | 8 | `Florence` |
