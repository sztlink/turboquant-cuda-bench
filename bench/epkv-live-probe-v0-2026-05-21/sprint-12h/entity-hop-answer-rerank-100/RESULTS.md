# Entity-Hop Answer Rerank

total: 100

| condition | EM | contains | F1 |
|---|---:|---:|---:|
| bge_ref | 0.090 | 0.160 | 0.185 |
| strong | 0.190 | 0.310 | 0.290 |
| path_prompt | 0.250 | 0.340 | 0.330 |
| rerank | 0.240 | 0.350 | 0.325 |

## Win/loss

```json
{
  "rerank_wins_vs_path": 2,
  "rerank_losses_vs_path": 3,
  "rerank_wins_vs_bge": 17,
  "rerank_losses_vs_bge": 2,
  "disagreements": 57
}
```

## Rows

| idx | gold | path | strong | rerank | selected | output |
|---:|---|---:|---:|---:|---|---|
| 0 | Małgorzata Braunek | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Małgorzata Braunek` |
| 1 | 12 June 1516 | 1/1.00 | 0/0.00 | 1/1.00 | C1 | `12 June 1516` |
| 2 | Myanmar Motion Picture Academy Awards | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Myanmar Motion Picture Academy Awards` |
| 3 | Missoula, Montana | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `The question is about the director of the film "Ronnie Rocket," but the passages do not pr` |
| 4 | Charles Armand René de La Trémoille | 1/1.00 | 0/0.40 | 1/1.00 | C1 | `Charles Armand René de La Trémoille` |
| 5 | Galați | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Galați` |
| 6 | Ptolemy IX Lathyros | 0/0.33 | 0/0.40 | 0/0.33 | PATH_FALLBACK | `Antiochus IX Cyzicenus` |
| 7 | Brooklyn | 0/0.00 | 0/0.00 | 0/0.00 | C1|C2 | `1953` |
| 8 | stroke | 0/0.00 | 0/0.00 | 0/0.00 | C1|C9 | `Princess Victoria Melita of Saxe-Coburg and Gotha died on 2 March 1936` |
| 9 | Nice | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Nice` |
| 10 | 1983 | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `2004` |
| 11 | United States | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `American` |
| 12 | Rupert | 0/0.50 | 0/0.40 | 0/0.40 | UNKNOWN | `Rupert III of the Palatinate` |
| 13 | Marie Leszczyńska | 0/0.00 | 0/0.11 | 0/0.00 | PATH_FALLBACK | `Margaret of Artois` |
| 14 | Catherine Robbe-Grillet | 0/0.00 | 1/1.00 | 1/1.00 | C3|C1|C2 | `Catherine Robbe-Grillet` |
| 15 | Hilandar | 0/0.00 | 0/0.00 | 0/0.00 | UNKNOWN | `Sirmium` |
| 16 | Pompey | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Scribonia (wife of Crassus)` |
| 17 | tuberculosis | 0/0.29 | 0/0.20 | 0/0.29 | C2 | `Katherine Mansfield died of extrapulmonary tuberculosis` |
| 18 | Rukn al-Dawla | 0/0.50 | 1/1.00 | 1/1.00 | C2 | `Rukn al-Dawla` |
| 19 | Xi'an | 0/0.67 | 0/0.67 | 0/0.67 | PATH_FALLBACK | `Xi'an, Shaanxi` |
| 20 | German | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Russia` |
| 21 | Louis-Alexandre Berthier | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `William Montagu Douglas Scott, 6th Duke of Buccleuch` |
| 22 | Pavia | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Forlì` |
| 23 | Víctor Bó | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Isabel Sarli` |
| 24 | Urraca of Castile | 0/0.33 | 0/0.00 | 0/0.33 | PATH_FALLBACK | `Eleanor of Viseu` |
| 25 | Cahiers du cinéma | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `House of Lords` |
| 26 | Sir Arthur Gore, 2nd Baronet | 0/0.80 | 0/0.80 | 0/0.80 | PATH_FALLBACK | `Sir Arthur Gore, 1st Baronet` |
| 27 | London | 0/0.50 | 1/1.00 | 0/0.50 | UNKNOWN | `Grosvenor Square, London` |
| 28 | Pakistan | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `India` |
| 29 | Winnipeg, Manitoba | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `South Porcupine, Ontario` |
| 30 | Fukuoka | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Worksop, Nottinghamshire` |
| 31 | Roma | 0/0.00 | 0/0.00 | 0/0.00 | UNKNOWN | `1913–1995` |
| 32 | Moscow, USSR | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Moscow, USSR` |
| 33 | Jeanne d'Albret | 0/0.00 | 0/0.00 | 0/0.00 | C2 | `Marie de' Medici` |
| 34 | New York | 0/0.00 | 0/0.00 | 0/0.00 | C1|UNKNOWN | `Jersey Shore` |
| 35 | Louis II | 0/0.00 | 0/0.00 | 0/0.00 | UNKNOWN | `Hermann I of Thuringia` |
| 36 | Bohemia | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Duchy of Hainaut` |
| 37 | Gura Humorului | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Palos Verdes Estates, California, USA` |
| 38 | Meran | 0/0.29 | 0/0.33 | 0/0.29 | C1 | `Obermais, Meran, County of Tyrol, Austria–Hungary` |
| 39 | Grammy | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `No award mentioned for Joe Jackson in the passages related to "Sunday Papers".` |
| 40 | Peter I | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Louis of Piedmont` |
| 41 | 24 March 1927 | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `18 July 1918` |
| 42 | Ostrogothic Kingdom | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Ostrogoths` |
| 43 | Kurdish | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Place of origin` |
| 44 | Liverpool | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Liverpool` |
| 45 | Louis, Grand Dauphin | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Philip V of Spain` |
| 46 | Kujō Michiie | 1/1.00 | 0/0.50 | 1/1.00 | C2|C1|UNKNOWN | `Kujō Michiie` |
| 47 | Madrid | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Madrid` |
| 48 | United Nations | 1/1.00 | 0/0.50 | 0/0.50 | C2 | `United Nations High Commissioner for Refugees` |
| 49 | Paris | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Alexandria, Egypt` |
| 50 | Mathilde of Bourbon | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Tiburge de Sarenom` |
| 51 | London | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `London` |
| 52 | Königsberg | 0/0.50 | 0/0.50 | 0/0.50 | PATH_FALLBACK | `Gurievsk near Königsberg` |
| 53 | Homs | 0/0.00 | 0/0.00 | 0/0.00 | UNKNOWN | `Rome, Italy` |
| 54 | Alain Poiré | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Alain Poiré` |
| 55 | Naha, Okinawa | 0/0.80 | 0/0.80 | 0/0.80 | PATH_FALLBACK | `Naha, Okinawa, Japan` |
| 56 | Byzantine | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Greek` |
| 57 | August 8, 1975 | 1/1.00 | 0/0.55 | 1/1.00 | C2|C1 | `August 8, 1975` |
| 58 | Chuck Schumer | 0/0.00 | 0/0.00 | 0/0.00 | C3|C1 | `Anthony Weiner` |
| 59 | Florence | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Forlì` |
| 60 | Helsingfors | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Place of origin` |
| 61 | Dutch | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Netherlands` |
| 62 | Tisch | 0/0.22 | 0/0.00 | 0/0.22 | C1|C2|UNKNOWN | `Tisch School of the Arts of New York University` |
| 63 | India | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Korean` |
| 64 | leukemia | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `No information available about Alex Matthiessen's father's cause of death.` |
| 65 | Herstal | 0/0.00 | 0/0.00 | 0/0.00 | UNKNOWN | `Francia` |
| 66 | 22 January 1794 | 0/0.00 | 0/0.00 | 0/0.00 | C1 | `six months before Lord Patrick Crichton-Stuart was born` |
| 67 | Stanisław Leszczyński | 0/0.00 | 0/0.00 | 0/0.00 | C10|UNKNOWN | `King Louis XIV of France` |
| 68 | 3 August 979 | 0/0.00 | 0/0.00 | 0/0.00 | C2 | `1 September 1015` |
| 69 | Aldo Parisot | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Kriv Stenders` |
| 70 | 1886 | 1/1.00 | 0/0.00 | 1/1.00 | C1|C2 | `1886` |
| 71 | Nevele | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Nevele` |
| 72 | Manchester | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Manchester` |
| 73 | Tantallon Castle | 0/0.29 | 0/0.00 | 0/0.29 | C1 | `Douglas Castle, Douglas, South Lanarkshire` |
| 74 | American | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `German` |
| 75 | Sochi | 0/0.00 | 0/0.00 | 0/0.00 | C2 | `Hong Kong` |
| 76 | French | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Canada` |
| 77 | Winnipeg, Manitoba | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Winnipeg, Manitoba` |
| 78 | Villafranca del Bierzo | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Florence` |
| 79 | Jean Hersholt Humanitarian Award | 1/1.00 | 0/0.62 | 1/1.00 | UNKNOWN | `Jean Hersholt Humanitarian Award` |
| 80 | Princess Madeleine, Duchess of Hälsingland and Gästrikland | 0/0.44 | 0/0.44 | 0/0.44 | PATH_FALLBACK | `Princess Madeleine` |
| 81 | Princess Augusta of Schwarzburg-Sondershausen | 0/0.50 | 0/0.50 | 0/0.50 | PATH_FALLBACK | `Princess Emma of Anhalt-Bernburg-Schaumburg-Hoym` |
| 82 | Cahiers du cinéma | 1/1.00 | 0/0.00 | 0/0.00 | C2 | `France` |
| 83 | China | 0/0.00 | 0/0.00 | 0/0.00 | C1 | `Qatar` |
| 84 | Charles I of Naples | 0/0.10 | 0/0.25 | 0/0.10 | PATH_FALLBACK | `Philip of Sicily's father is not directly mentioned in the passages provided. However, bas` |
| 85 | Argentina | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Argentina` |
| 86 | Jacques Cousteau | 0/0.50 | 0/0.50 | 0/0.50 | PATH_FALLBACK | `Jean-Michel Cousteau` |
| 87 | Thessaloniki | 0/0.00 | 0/0.00 | 0/0.00 | UNKNOWN | `assassinated in 1913` |
| 88 | New York | 0/0.00 | 0/0.00 | 0/0.00 | UNKNOWN | `Boston, Massachusetts` |
| 89 | University of Paris | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `N/A` |
| 90 | Hackney | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Place of birth` |
| 91 | 1969 | 1/1.00 | 0/0.67 | 0/0.67 | C2|C1 | `December 1969` |
| 92 | Huahine | 1/1.00 | 0/0.50 | 1/1.00 | PATH_FALLBACK | `Huahine` |
| 93 | Brighton | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Death not mentioned` |
| 94 | 10 May 1912 | 0/0.00 | 0/0.00 | 0/0.00 | C2|UNKNOWN | `20 April 1757` |
| 95 | John de Vere, 15th Earl of Oxford | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `John de Vere, 15th Earl of Oxford` |
| 96 | Kreuzlingen | 0/0.00 | 1/1.00 | 0/0.00 | C6|C8 | `Berlin` |
| 97 | Florence | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Città di Castello` |
| 98 | Århus | 0/0.40 | 0/0.40 | 0/0.40 | PATH_FALLBACK | `Århus, Region Midtjylland, Denmark` |
| 99 | Florence | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Florence` |
