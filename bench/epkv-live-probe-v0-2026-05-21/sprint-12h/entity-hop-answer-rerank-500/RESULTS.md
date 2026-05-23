# Entity-Hop Answer Rerank

total: 500

| condition | EM | contains | F1 |
|---|---:|---:|---:|
| bge_ref | 0.018 | 0.032 | 0.037 |
| strong | 0.172 | 0.288 | 0.285 |
| path_prompt | 0.216 | 0.306 | 0.324 |
| rerank | 0.212 | 0.308 | 0.322 |

## Win/loss

```json
{
  "rerank_wins_vs_path": 5,
  "rerank_losses_vs_path": 7,
  "rerank_wins_vs_bge": 99,
  "rerank_losses_vs_bge": 2,
  "disagreements": 268
}
```

## Rows

| idx | gold | path | strong | rerank | selected | output |
|---:|---|---:|---:|---:|---|---|
| 0 | Małgorzata Braunek | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Małgorzata Braunek` |
| 1 | 12 June 1516 | 1/1.00 | 0/0.00 | 1/1.00 | C1 | `12 June 1516` |
| 2 | Myanmar Motion Picture Academy Awards | 0/0.80 | 0/0.80 | 0/0.80 | PATH_FALLBACK | `Myanmar Motion Picture Academy Awards-winning` |
| 3 | Missoula, Montana | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `January 20, 1946` |
| 4 | Charles Armand René de La Trémoille | 1/1.00 | 0/0.40 | 1/1.00 | C1 | `Charles Armand René de La Trémoille` |
| 5 | Galați | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Bucharest` |
| 6 | Ptolemy IX Lathyros | 0/0.00 | 0/0.40 | 0/0.00 | C3 | `Antiochus VII Sidetes` |
| 7 | Brooklyn | 0/0.00 | 0/0.00 | 0/0.00 | C1|C2|UNKNOWN | `Ken Burns` |
| 8 | stroke | 0/0.00 | 0/0.00 | 0/0.00 | C7|C8 | `Princess Victoria Melita of Saxe-Coburg and Gotha died on 2 March 1936` |
| 9 | Nice | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Nice` |
| 10 | 1983 | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `2004` |
| 11 | United States | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `American` |
| 12 | Rupert | 0/0.50 | 0/0.50 | 0/0.50 | PATH_FALLBACK | `Rupert of Germany` |
| 13 | Marie Leszczyńska | 0/0.00 | 0/0.11 | 0/0.00 | PATH_FALLBACK | `Margaret of Artois` |
| 14 | Catherine Robbe-Grillet | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Catherine Robbe-Grillet` |
| 15 | Hilandar | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Serbia` |
| 16 | Pompey | 0/0.00 | 0/0.00 | 0/0.00 | C2 | `Julia (daughter of Cornelia and mother of Caesar's child-in-law)` |
| 17 | tuberculosis | 0/0.29 | 0/0.20 | 0/0.29 | C2 | `Katherine Mansfield died of extrapulmonary tuberculosis` |
| 18 | Rukn al-Dawla | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Rukn al-Dawla` |
| 19 | Xi'an | 1/1.00 | 0/0.67 | 0/0.67 | C2 | `Xi'an, Shaanxi` |
| 20 | German | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Württemberg` |
| 21 | Louis-Alexandre Berthier | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `William Montagu Douglas Scott, 6th Duke of Buccleuch` |
| 22 | Pavia | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Forlì` |
| 23 | Víctor Bó | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Isabel Sarli` |
| 24 | Urraca of Castile | 0/0.33 | 0/0.00 | 0/0.33 | PATH_FALLBACK | `Eleanor of Viseu` |
| 25 | Cahiers du cinéma | 0/0.00 | 0/0.00 | 0/0.00 | C1|C7|UNKNOWN | `House of Lords` |
| 26 | Sir Arthur Gore, 2nd Baronet | 0/0.80 | 0/0.80 | 0/0.80 | PATH_FALLBACK | `Sir Arthur Gore, 1st Baronet` |
| 27 | London | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `The passages do not provide information about the birthplace of Lord Patrick Crichton-Stua` |
| 28 | Pakistan | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `India` |
| 29 | Winnipeg, Manitoba | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `South Porcupine, Ontario` |
| 30 | Fukuoka | 0/0.00 | 0/0.00 | 0/0.00 | C1 | `Worksop, Nottinghamshire` |
| 31 | Roma | 0/0.00 | 0/0.00 | 0/0.00 | UNKNOWN | `1913–1995` |
| 32 | Moscow, USSR | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Moscow, USSR` |
| 33 | Jeanne d'Albret | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Eleanor of Navarre` |
| 34 | New York | 0/0.00 | 0/0.00 | 0/0.00 | C1|UNKNOWN | `Jersey Shore` |
| 35 | Louis II | 0/0.00 | 0/0.00 | 0/0.00 | C1|C6|C10 | `Albert IV, Duke of Austria` |
| 36 | Bohemia | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Duchy of Hainaut` |
| 37 | Gura Humorului | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Palos Verdes Estates, California, USA` |
| 38 | Meran | 0/0.29 | 0/0.33 | 0/0.29 | C1 | `Obermais, Meran, County of Tyrol, Austria–Hungary` |
| 39 | Grammy | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `No award mentioned for Joe Jackson regarding "Sunday Papers".` |
| 40 | Peter I | 0/0.57 | 0/0.00 | 0/0.57 | PATH_FALLBACK | `Peter I, Duke of Bourbon` |
| 41 | 24 March 1927 | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `1915` |
| 42 | Ostrogothic Kingdom | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `France` |
| 43 | Kurdish | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Place of origin` |
| 44 | Liverpool | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Liverpool` |
| 45 | Louis, Grand Dauphin | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Philip V of Spain` |
| 46 | Kujō Michiie | 1/1.00 | 0/0.50 | 1/1.00 | C2|C1|UNKNOWN | `Kujō Michiie` |
| 47 | Madrid | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Madrid` |
| 48 | United Nations | 1/1.00 | 0/0.00 | 1/1.00 | C1|C2|UNKNOWN | `United Nations` |
| 49 | Paris | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Alexandria, Egypt` |
| 50 | Mathilde of Bourbon | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Tiburge de Sarenom` |
| 51 | London | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `London` |
| 52 | Königsberg | 0/0.50 | 0/0.50 | 0/0.50 | PATH_FALLBACK | `Gurievsk near Königsberg` |
| 53 | Homs | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Syria` |
| 54 | Alain Poiré | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Alain Poiré` |
| 55 | Naha, Okinawa | 0/0.80 | 0/0.80 | 0/0.80 | PATH_FALLBACK | `Naha, Okinawa, Japan` |
| 56 | Byzantine | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Greek` |
| 57 | August 8, 1975 | 1/1.00 | 0/0.55 | 1/1.00 | C2|C1 | `August 8, 1975` |
| 58 | Chuck Schumer | 0/0.00 | 0/0.00 | 0/0.00 | C3|C1 | `Anthony Weiner` |
| 59 | Florence | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Forlì` |
| 60 | Helsingfors | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Place of origin` |
| 61 | Dutch | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Netherlands` |
| 62 | Tisch | 0/0.22 | 0/0.22 | 0/0.22 | PATH_FALLBACK | `Tisch School of the Arts of New York University` |
| 63 | India | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Korean` |
| 64 | leukemia | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `N/A` |
| 65 | Herstal | 0/0.00 | 0/0.00 | 0/0.00 | C2|UNKNOWN | `Francia` |
| 66 | 22 January 1794 | 0/0.00 | 0/0.46 | 0/0.00 | C1 | `six months before Lord Patrick Crichton-Stuart was born` |
| 67 | Stanisław Leszczyński | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `King Louis XIV of France` |
| 68 | 3 August 979 | 0/0.50 | 0/0.00 | 0/0.50 | C1 | `979` |
| 69 | Aldo Parisot | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Kriv Stenders` |
| 70 | 1886 | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `1886` |
| 71 | Nevele | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Nevele` |
| 72 | Manchester | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Manchester` |
| 73 | Tantallon Castle | 0/0.29 | 0/0.00 | 0/0.00 | C1|C2 | `Douglas, South Lanarkshire` |
| 74 | American | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `German` |
| 75 | Sochi | 0/0.00 | 0/0.00 | 0/0.00 | C2 | `Russia` |
| 76 | French | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Canada` |
| 77 | Winnipeg, Manitoba | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Winnipeg, Manitoba` |
| 78 | Villafranca del Bierzo | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Florence` |
| 79 | Jean Hersholt Humanitarian Award | 1/1.00 | 0/0.11 | 1/1.00 | PATH_FALLBACK | `Jean Hersholt Humanitarian Award` |
| 80 | Princess Madeleine, Duchess of Hälsingland and Gästrikland | 0/0.44 | 0/0.44 | 0/0.44 | PATH_FALLBACK | `Princess Madeleine` |
| 81 | Princess Augusta of Schwarzburg-Sondershausen | 0/0.50 | 0/0.50 | 0/0.50 | PATH_FALLBACK | `Princess Emma of Anhalt-Bernburg-Schaumburg-Hoym` |
| 82 | Cahiers du cinéma | 1/1.00 | 0/0.00 | 1/1.00 | PATH_FALLBACK | `Cahiers du cinéma` |
| 83 | China | 0/0.00 | 0/0.00 | 0/0.00 | C1 | `Qatar` |
| 84 | Charles I of Naples | 0/0.67 | 0/0.32 | 0/0.67 | C1|C2|UNKNOWN | `King Charles I of Sicily` |
| 85 | Argentina | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Argentina` |
| 86 | Jacques Cousteau | 0/0.50 | 0/0.50 | 0/0.50 | PATH_FALLBACK | `Jean-Michel Cousteau` |
| 87 | Thessaloniki | 0/0.00 | 0/0.00 | 0/0.00 | UNKNOWN | `assassinated in 1913` |
| 88 | New York | 0/0.80 | 0/0.80 | 0/0.80 | PATH_FALLBACK | `New York City` |
| 89 | University of Paris | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `N/A` |
| 90 | Hackney | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Place of origin` |
| 91 | 1969 | 1/1.00 | 0/0.67 | 0/0.67 | C2|C4 | `December 1969` |
| 92 | Huahine | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Angoulême` |
| 93 | Brighton | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Death not mentioned` |
| 94 | 10 May 1912 | 0/0.00 | 0/0.00 | 0/0.00 | C2 | `20 April 1767` |
| 95 | John de Vere, 15th Earl of Oxford | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `John de Vere, 15th Earl of Oxford` |
| 96 | Kreuzlingen | 0/0.00 | 1/1.00 | 0/0.00 | C4 | `Berlin` |
| 97 | Florence | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Città di Castello` |
| 98 | Århus | 0/0.00 | 0/0.40 | 0/0.40 | C2 | `Århus, Region Midtjylland, Denmark` |
| 99 | Florence | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Florence` |
| 100 | British | 1/1.00 | 0/0.00 | 0/0.00 | C1|C2 | `French` |
| 101 | State University of New York at Purchase | 0/0.09 | 0/0.09 | 0/0.09 | PATH_FALLBACK | `No information provided in the passages about the director of Desolation Angels (1995 Film` |
| 102 | 2 September 1770 | 0/0.50 | 1/1.00 | 1/1.00 | C2 | `2 September 1770` |
| 103 | 1080 | 1/1.00 | 0/0.00 | 1/1.00 | PATH_FALLBACK | `1080` |
| 104 | 30 June 1963 | 0/1.00 | 0/0.55 | 0/1.00 | C1|C2 | `June 30, 1963` |
| 105 | Wales | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Place of origin` |
| 106 | Rosario | 0/0.40 | 0/0.40 | 0/0.40 | PATH_FALLBACK | `Rosario, Santa Fe Province` |
| 107 | 1701 | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `1653` |
| 108 | German | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Germany` |
| 109 | Franz Joseph I | 0/0.00 | 0/0.67 | 0/0.00 | UNKNOWN | `Johann Josef Adam` |
| 110 | Amman | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Baghdad` |
| 111 | Princess Maria Immaculata of Bourbon-Two Sicilies | 0/0.18 | 0/0.18 | 0/0.18 | PATH_FALLBACK | `Archduke Leopold Salvator of Austria` |
| 112 | Belfast | 0/0.00 | 0/0.00 | 0/0.00 | C1|C2|C6|UNKNOWN | `Kenneth Branagh` |
| 113 | Tamil | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `The information provided does not specify the birthplace of the composer of the film Love ` |
| 114 | Íñigo Vélez de Guevara, 7th Count of Oñate | 1/1.00 | 0/0.50 | 1/1.00 | PATH_FALLBACK | `Íñigo Vélez de Guevara, 7th Count of Oñate` |
| 115 | Jerez de la Frontera | 0/0.00 | 0/0.00 | 0/0.00 | C1 | `Spain` |
| 116 | Queens | 0/0.67 | 0/0.67 | 0/0.67 | PATH_FALLBACK | `Hollis, Queens` |
| 117 | Nanjing | 0/0.00 | 0/0.00 | 0/0.00 | C2 | `Beiping (modern Beijing)` |
| 118 | Polish–Lithuanian Commonwealth | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Poland` |
| 119 | Maurya dynasty | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `India` |
| 120 | Yi Jiang | 0/0.80 | 0/0.80 | 0/0.80 | PATH_FALLBACK | `Queen Yi Jiang` |
| 121 | New Brunswick, New Jersey | 0/0.00 | 0/0.00 | 0/0.00 | C2 | `Roy Mack` |
| 122 | Bombay | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Place of origin` |
| 123 | National Film School in Łódź | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `National Film School in Łódź` |
| 124 | London | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Place of origin` |
| 125 | Swedish | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Swedish` |
| 126 | Davao | 0/0.67 | 0/0.67 | 0/0.67 | PATH_FALLBACK | `Davao City` |
| 127 | 15 November 1784 | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `The information provided does not contain Prince Napoléon Bonaparte's father's birthday.` |
| 128 | Hollywood | 0/0.00 | 0/0.00 | 0/0.00 | C2 | `Oslo` |
| 129 | Harvard | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `The passages do not provide information about where William S. Burroughs Jr.'s father stud` |
| 130 | Queen Sofía of Spain | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Queen Sofía of Spain` |
| 131 | French | 0/0.00 | 0/0.00 | 0/0.00 | C1 | `France` |
| 132 | Ndvungunye | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Sobhuza I` |
| 133 | Reykjavík | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Reykjavík` |
| 134 | Thomas de Beauchamp | 0/0.44 | 0/0.67 | 0/0.44 | PATH_FALLBACK | `William de Beauchamp, 1st Baron Bergavenny` |
| 135 | María Barranco | 0/0.50 | 0/0.00 | 1/1.00 | C1|C2 | `María Barranco` |
| 136 | Osterholz | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Braunschweig` |
| 137 | Agrippina the Elder | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `No information provided in the passages about Lollia Paulina's mother-in-law.` |
| 138 | October 27, 1893 | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `1913` |
| 139 | Lady Frances Manners | 0/0.33 | 0/0.33 | 0/0.33 | PATH_FALLBACK | `Lady Margaret Clinton` |
| 140 | Ottoman Empire | 0/0.67 | 0/0.67 | 0/0.67 | PATH_FALLBACK | `Ottoman` |
| 141 | Princess Mary of Great Britain | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Princess Mary of Great Britain` |
| 142 | Washington | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `June 13, 2008` |
| 143 | Newport | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Place of birth` |
| 144 | Catherine of Braganza | 0/0.25 | 0/0.00 | 0/0.25 | UNKNOWN | `Barbara Villiers, Countess of Castlemaine` |
| 145 | University of British Columbia | 0/0.00 | 0/0.35 | 0/0.00 | 20th Century Fox | `20th Century Fox` |
| 146 | Gerberge of Lorraine | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Gerberge of Lorraine` |
| 147 | France | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `French` |
| 148 | Eleanor of Provence | 0/0.33 | 0/0.33 | 0/0.33 | PATH_FALLBACK | `Eleanor de Clare` |
| 149 | 2 August 1288 | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `1241` |
| 150 | Bernard-Roger, Count of Bigorre | 0/0.25 | 0/0.22 | 0/0.25 | UNKNOWN | `Sancho I of León` |
| 151 | Rasual Butler | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `The Singer` |
| 152 | Nine Network | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `The Nine Network` |
| 153 | Stampede Wrestling | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Brownwood` |
| 154 | British | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Scotland` |
| 155 | United Kingdom | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `English` |
| 156 | US | 0/0.00 | 0/0.00 | 0/0.00 | UNKNOWN | `Berkshire` |
| 157 | National Film Award for Best Music Direction | 0/0.40 | 0/0.40 | 0/0.40 | PATH_FALLBACK | `Filmfare RD Burman Award for New Music Talent` |
| 158 | Queens | 0/0.33 | 0/0.33 | 0/0.33 | PATH_FALLBACK | `South Jamaica, Queens, New York` |
| 159 | Bowdoin College | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `N/A` |
| 160 | April 30, 1939 | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `1939-04-30` |
| 161 | Sigrid the Haughty | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Estrid of the Obotrites` |
| 162 | Cross Plains | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Albania` |
| 163 | Sydney, Australia | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Sydney, Australia` |
| 164 | California | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Mexico` |
| 165 | Norwegian | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `American` |
| 166 | Conrad II | 0/0.67 | 0/0.67 | 0/0.67 | PATH_FALLBACK | `Conrad II of Germany` |
| 167 | Elizabeth of Nevers | 0/0.33 | 0/0.33 | 0/0.33 | UNKNOWN | `Mathilde of Hesse` |
| 168 | Weston Park | 0/0.00 | 0/0.80 | 0/0.00 | UNKNOWN | `Youghal` |
| 169 | Qing dynasty | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Han Chinese` |
| 170 | Roman Empire | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Canada` |
| 171 | Arizona | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Palma` |
| 172 | Louis Philippe II, Duke of Orléans | 0/0.40 | 0/0.40 | 0/0.40 | PATH_FALLBACK | `Louis XIV of France` |
| 173 | Spanish | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Aragonese` |
| 174 | Chinese | 0/0.00 | 0/0.00 | 0/0.00 | C2|UNKNOWN | `Emperor Zhang of Han` |
| 175 | Ashgabat | 0/0.00 | 0/0.00 | 0/0.00 | C2 | `21 December 2006` |
| 176 | Sangeet Natak Akademi Award | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Oscar` |
| 177 | Louis III, Count of Chiny | 1/1.00 | 0/0.60 | 1/1.00 | C9|C10 | `Louis III, Count of Chiny` |
| 178 | Rabat | 0/0.67 | 0/0.67 | 0/0.67 | PATH_FALLBACK | `Rabat, Morocco` |
| 179 | Coventry | 1/1.00 | 0/0.00 | 1/1.00 | PATH_FALLBACK | `Coventry` |
| 180 | China | 1/1.00 | 0/0.00 | 1/1.00 | C1 | `China` |
| 181 | Efva Attling | 0/0.00 | 0/0.00 | 0/0.00 | C1|C2 | `Eva Dahlgren` |
| 182 | La Trinité | 1/1.00 | 0/0.31 | 1/1.00 | C1|C2|C6 | `La Trinité` |
| 183 | Hugh de Stafford, 2nd Earl of Stafford | 0/0.92 | 1/1.00 | 1/1.00 | C2 | `Hugh de Stafford, 2nd Earl of Stafford` |
| 184 | Västerås | 0/0.67 | 0/0.67 | 0/0.67 | PATH_FALLBACK | `Västerås, Sweden` |
| 185 | Leopoldo Torre Nilsson | 0/0.33 | 0/0.00 | 0/0.00 | C1|UNKNOWN | `Floren Delbene` |
| 186 | Jules Lederer | 0/0.00 | 0/0.00 | 0/0.00 | C8|C9|C10|C12 | `Herodes Atticus` |
| 187 | Paris | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Paris` |
| 188 | Wigeric of Lotharingia | 0/0.00 | 0/0.20 | 0/0.00 | PATH_FALLBACK | `Otto I, Holy Roman Emperor` |
| 189 | Daniel Alomía Robles | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Daniel Alomía Robles` |
| 190 | Stony Brook University | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Stony Brook University` |
| 191 | Helsingfors | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Place of birth` |
| 192 | Studio City | 0/0.80 | 0/0.80 | 0/0.80 | PATH_FALLBACK | `Studio City, Cal.` |
| 193 | Richard Burke, 2nd Earl of Clanricarde | 0/0.67 | 1/1.00 | 0/0.67 | C2 | `Ulick Burke, 3rd Earl of Clanricarde` |
| 194 | Bernard I, Margrave of Baden-Baden | 0/0.67 | 0/0.80 | 0/0.67 | C1 | `Jacob I of Baden-Baden` |
| 195 | Mapy Cortés | 1/1.00 | 0/0.00 | 1/1.00 | C1 | `Mapy Cortés` |
| 196 | Akhetaten | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Akhenaten` |
| 197 | Isabella of Angoulême | 0/0.33 | 0/0.00 | 0/0.33 | PATH_FALLBACK | `Eleanor of Castile` |
| 198 | Henry Styleman | 0/0.00 | 0/0.57 | 0/0.00 | PATH_FALLBACK | `William the Conqueror` |
| 199 | Gaston IV of Foix | 0/0.89 | 0/0.89 | 0/0.89 | PATH_FALLBACK | `Count Gaston IV of Foix` |
| 200 | August 7, 2004 | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `August 7, 2004` |
| 201 | California | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `The information provided does not specify the birthplace of John Beal, the composer of the` |
| 202 | laryngeal cancer | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `N/A` |
| 203 | Germany | 0/0.00 | 0/0.00 | 0/0.00 | C1 | `German` |
| 204 | Christ's College, Cambridge | 0/0.00 | 0/0.00 | 1/1.00 | C7 | `Christ's College, Cambridge` |
| 205 | Weimar | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Dresden` |
| 206 | Marc Allégret | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Charles II of England` |
| 207 | Jerome, 4th Count de Salis-Soglio | 0/0.80 | 0/0.22 | 0/0.80 | C1 | `Jerome, 2nd Count de Salis-Soglio` |
| 208 | 23 February 1473 | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `949` |
| 209 | Billy Ray Cyrus | 0/0.40 | 0/0.40 | 0/0.40 | PATH_FALLBACK | `Ron Cyrus` |
| 210 | New York | 0/0.67 | 0/0.67 | 0/0.67 | PATH_FALLBACK | `New York, New York` |
| 211 | Forlì | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Imola` |
| 212 | Hyderabad | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `30 March 1967` |
| 213 | Gloria Loring | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Distractor` |
| 214 | Lancing College | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Constantine Imeretinsky` |
| 215 | Edinburgh | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `The graph does not provide the place of death for James Adam (architect)'s father.` |
| 216 | St John's College | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Katherine de la Pole` |
| 217 | Kitiyakara Voralaksana | 0/0.00 | 0/0.29 | 0/0.00 | PATH_FALLBACK | `Nakkhatra Mangala` |
| 218 | Yash Johar | 0/0.50 | 0/0.50 | 0/0.50 | PATH_FALLBACK | `Hiroo Johar` |
| 219 | San Juan, Puerto Rico | 0/0.73 | 1/1.00 | 1/1.00 | C1|C2 | `San Juan, Puerto Rico` |
| 220 | Évreux | 0/0.00 | 1/1.00 | 0/0.00 | UNKNOWN | `Paris` |
| 221 | Reykjavík | 1/1.00 | 0/0.00 | 1/1.00 | C1|C2|UNKNOWN | `Reykjavík` |
| 222 | Munich | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Dresden` |
| 223 | Maureen O'Sullivan | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Maureen O'Sullivan` |
| 224 | shot | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `The passage does not provide information about the composer of the song "Look At Me (XXXTe` |
| 225 | Elizabeth the Cuman | 0/0.00 | 0/0.00 | 0/0.00 | UNKNOWN | `Maria Laskarina` |
| 226 | Abilene | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `December 21, 1956` |
| 227 | Tehran | 0/0.67 | 0/0.00 | 0/0.67 | C1|C2 | `Tehran, Iran` |
| 228 | Käbi Laretei | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Käbi Laretei` |
| 229 | Great Pyramid of Giza | 0/0.40 | 0/0.40 | 0/0.40 | PATH_FALLBACK | `Giza` |
| 230 | Theuderic I | 0/0.50 | 0/0.50 | 0/0.50 | PATH_FALLBACK | `Theudebert I` |
| 231 | Kirchheim unter Teck | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Kirchheim unter Teck` |
| 232 | Colorado | 0/0.50 | 0/0.50 | 0/0.50 | PATH_FALLBACK | `Del Norte, Colorado` |
| 233 | Viennese | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Austria` |
| 234 | hanged, drawn and quartered | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Hugh Despenser the Younger died on 24 November 1326.` |
| 235 | illness | 0/0.17 | 0/0.29 | 0/0.17 | C1|C2 | `Nora Brockstedt died after a short illness at Ullevaal Hospital in Oslo` |
| 236 | 21 June 1483 | 0/0.00 | 0/0.00 | 0/0.00 | C1|C2 | `23 August 1500` |
| 237 | Huntington's disease | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Woody Guthrie died on October 3, 1967.` |
| 238 | Suffield, Connecticut | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Suffield, Connecticut` |
| 239 | Ragnild Magnusdotter | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Harald Kesja` |
| 240 | Germany | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Dutch` |
| 241 | Poznań | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Poland` |
| 242 | Alena Mihulová | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Alena Mihulová` |
| 243 | Ischia | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Oldham, Lancashire` |
| 244 | Paris | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Paris` |
| 245 | Palos Verdes | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Robert Lamoureux` |
| 246 | France | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Mexico` |
| 247 | Naha, Okinawa | 0/0.80 | 0/0.80 | 0/0.80 | PATH_FALLBACK | `Naha, Okinawa, Japan` |
| 248 | Lady Anne Campbell | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Lady Anne Campbell` |
| 249 | Theni | 0/0.25 | 0/0.25 | 0/0.25 | PATH_FALLBACK | `Mallingapuram near Pannaipuram, Theni District, Tamil Nadu` |
| 250 | Johannesburg, South Africa | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Montreal` |
| 251 | Rimini | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Modena` |
| 252 | Prostějov | 0/0.00 | 0/0.00 | 0/0.00 | C1|C7 | `Prague` |
| 253 | Cebu | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Rome, Italy` |
| 254 | Rome | 0/0.00 | 0/0.00 | 0/0.00 | C1|C2 | `Cagliari` |
| 255 | Joana de Prades | 0/0.67 | 0/0.67 | 0/0.67 | PATH_FALLBACK | `Joana de Gandia` |
| 256 | Henrietta Susanna Tracy | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Henrietta Susanna Tracy` |
| 257 | Fårö | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `2007` |
| 258 | Polish-Lithuanian Commonwealth | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Poland` |
| 259 | Archibald Acheson, 2nd Earl of Gosford | 1/1.00 | 0/0.00 | 1/1.00 | PATH_FALLBACK | `Archibald Acheson, 2nd Earl of Gosford` |
| 260 | Lewes | 1/1.00 | 0/0.00 | 1/1.00 | UNKNOWN | `Lewes` |
| 261 | Bratislava | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Place of origin` |
| 262 | Westerland | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Westerland` |
| 263 | London | 1/1.00 | 0/0.33 | 0/0.40 | C2 | `London Borough of Islington` |
| 264 | Infanta Maria Antonia of Portugal | 0/0.22 | 0/0.22 | 0/0.22 | PATH_FALLBACK | `Princess Zita of Bourbon-Parma` |
| 265 | Albert II, Prince of Anhalt-Zerbst | 0/0.60 | 1/1.00 | 0/0.60 | PATH_FALLBACK | `Albert VI, Prince of Anhalt-Köthen` |
| 266 | Ridley Scott | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Neal Purvis` |
| 267 | Longqing | 0/0.00 | 0/0.00 | 0/0.00 | C9|C11 | `Wanli Emperor` |
| 268 | United States | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `American` |
| 269 | India | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `India` |
| 270 | Fíngen mac Áedo Duib | 0/0.75 | 0/0.75 | 0/0.75 | PATH_FALLBACK | `Faíngen mac Áedo Duib` |
| 271 | France | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `France` |
| 272 | Thyra | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Harald Bluetooth` |
| 273 | Alexander III of Russia | 0/0.60 | 0/0.89 | 0/0.60 | UNKNOWN | `Grand Duke Alexander Mikhailovich of Russia` |
| 274 | Forest Lawn Memorial Park | 0/0.00 | 0/0.00 | 0/0.00 | C1|C2|UNKNOWN | `Worms` |
| 275 | Prince Harald of Denmark | 0/0.50 | 0/0.50 | 0/0.50 | PATH_FALLBACK | `Frederick VIII of Denmark` |
| 276 | Lezhë | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Krujë` |
| 277 | Mark Hanna | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Simpson Harris Morgan` |
| 278 | France | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Frankish` |
| 279 | Charles VI of France | 1/1.00 | 0/0.89 | 1/1.00 | C1 | `Charles VI of France` |
| 280 | Oslo | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Oslo` |
| 281 | American | 0/0.00 | 0/0.00 | 0/0.00 | C1 | `United States` |
| 282 | Meresankh II | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Nefertkau III` |
| 283 | Farwah bint al-Qasim | 0/0.33 | 0/0.33 | 0/0.33 | PATH_FALLBACK | `Fatimah bint Muhammad` |
| 284 | Helsinki | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Finnish` |
| 285 | Valparaíso | 0/0.67 | 0/0.67 | 0/0.67 | PATH_FALLBACK | `Valparaíso, Chile` |
| 286 | Kingsbury, London | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Kingsbury, London` |
| 287 | Königstein im Taunus | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Königstein im Taunus` |
| 288 | 10 November 1871 | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `10 November 1871` |
| 289 | Torgau | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Torgau` |
| 290 | Weston-super-Mare, Somerset | 0/0.00 | 0/0.00 | 0/0.00 | C1 | `Blackheath, London` |
| 291 | 20 April 1434 | 0/0.00 | 0/0.00 | 0/0.00 | UNKNOWN | `17 February 1442` |
| 292 | Florida Atlantic | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `University of North Carolina School of the Arts` |
| 293 | West Branch, Iowa | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Asheville, Ohio` |
| 294 | British | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `British` |
| 295 | Saqqara | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Allerton Cemetery` |
| 296 | Irish | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Ireland` |
| 297 | Celle | 0/0.00 | 0/0.00 | 0/0.00 | C4 | `Great Britain` |
| 298 | Otto Carlmar | 0/0.50 | 0/0.00 | 0/0.50 | C1 | `Edith Carlmar` |
| 299 | Prince Yi Kang | 0/0.00 | 0/0.67 | 0/0.67 | C2 | `Prince Yi Seok` |
| 300 | Sir Thomas Lawley, 1st Baronet | 0/0.83 | 1/1.00 | 0/0.83 | PATH_FALLBACK | `Sir Thomas Lawley, 1st Baronet of Spoonhill` |
| 301 | John Lyon, 3rd Lord Glamis | 0/0.80 | 0/0.80 | 0/0.80 | PATH_FALLBACK | `John Lyon, 4th Lord Glamis` |
| 302 | University of California | 0/0.00 | 0/0.11 | 0/0.00 | PATH_FALLBACK | `Roberto Santucci studied in Brazil.` |
| 303 | Marie I de Coucy, Countess of Soissons | 0/0.20 | 0/0.20 | 0/0.20 | PATH_FALLBACK | `Philippa of Hainault` |
| 304 | UCLA | 0/0.00 | 0/0.00 | 0/0.00 | C2 | `former Massachusetts governor and U.S. presidential candidate` |
| 305 | France | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `French` |
| 306 | Strasbourg | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Strasbourg` |
| 307 | Maria Amalia of Naples and Sicily | 0/0.20 | 1/1.00 | 0/0.20 | PATH_FALLBACK | `Princess Louise of Saxe-Gotha-Altenburg` |
| 308 | Paris | 0/0.00 | 0/0.00 | 0/0.00 | C2 | `26 September 1931` |
| 309 | Louise d'Aumont | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Maria Caroline Gibert de Lametz` |
| 310 | Gisela Elsner | 0/0.00 | 0/0.00 | 0/0.00 | C1 | `Oskar Roehler` |
| 311 | 1323 | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `1311` |
| 312 | 16 August 1932 | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `1932-August-16` |
| 313 | Albuquerque, New Mexico | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Albuquerque, New Mexico` |
| 314 | Germanicus | 0/0.00 | 0/0.00 | 0/0.00 | UNKNOWN | `Lucius Aemilius Lepidus Paullus` |
| 315 | Wawel Cathedral | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Dresden` |
| 316 | Christian August of Holstein-Gottorp, Prince of Eutin | 0/0.18 | 0/0.00 | 0/0.00 | C6|C2 | `Charles de Bourbon` |
| 317 | Swiss | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `United States` |
| 318 | Odo II, Count of Blois | 0/0.22 | 0/0.20 | 0/0.22 | PATH_FALLBACK | `Henry I of England` |
| 319 | Warsaw | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Paris` |
| 320 | Jacques | 0/0.00 | 0/0.00 | 0/0.00 | C1|C2|UNKNOWN | `Henri, Count of Paris` |
| 321 | Konya | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Did a Good Man Die?` |
| 322 | San Ferdinando di Puglia | 0/0.89 | 0/0.89 | 0/0.89 | PATH_FALLBACK | `San Ferdinando di Puglia, Italy` |
| 323 | Pyay | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Place of birth` |
| 324 | Iyasu I | 0/0.40 | 0/0.00 | 0/0.00 | C2 | `Yohannes II` |
| 325 | Westwood Village Memorial Park Cemetery | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Fox Film Corporation` |
| 326 | 25 July 1182 | 1/1.00 | 0/0.50 | 1/1.00 | C1|C3 | `25 July 1182` |
| 327 | Camas | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Place of origin` |
| 328 | Polish–Lithuanian Commonwealth | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Polish` |
| 329 | Connla Cáem | 0/0.00 | 1/1.00 | 0/0.00 | C1|C7|UNKNOWN | `Ailill Caisfiaclach` |
| 330 | 27 June 1497 | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `1530` |
| 331 | Santiago del Estero | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Santiago del Estero` |
| 332 | QV66 | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Allerton Cemetery` |
| 333 | Frederick VIII, Duke of Schleswig-Holstein | 0/0.40 | 0/0.20 | 0/0.40 | PATH_FALLBACK | `Friedrich Wilhelm, Duke of Schleswig-Holstein-Sonderburg-Glücksburg` |
| 334 | American | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `United States` |
| 335 | Saffron Walden | 0/0.00 | 0/0.25 | 0/0.00 | C7|UNKNOWN | `Swansea` |
| 336 | English | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `The passages do not provide information about the birthplace of Dorothy Stafford, who is t` |
| 337 | Bakersfield | 0/0.00 | 0/0.00 | 0/0.00 | C1 | `Place of birth` |
| 338 | Rohan Marley | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Lauryn Hill` |
| 339 | Theni | 0/0.25 | 0/0.25 | 0/0.25 | PATH_FALLBACK | `Mallingapuram near Pannaipuram, Theni District, Tamil Nadu` |
| 340 | Argentine | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Spain` |
| 341 | Rome | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Rome` |
| 342 | Annelise Hovmand | 0/0.00 | 0/0.00 | 0/0.00 | UNKNOWN | `Poul Reichhardt` |
| 343 | Rudolstadt | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `The passages do not provide information about the birthplace of Sizzo, Prince of Schwarzbu` |
| 344 | German | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Prussia` |
| 345 | Béziers | 0/0.67 | 0/0.67 | 0/0.67 | PATH_FALLBACK | `Béziers, Hérault` |
| 346 | Dortmund University of Applied Sciences and Arts | 0/0.10 | 0/0.09 | 0/0.10 | PATH_FALLBACK | `Die Abfahrer: Die Abfahrer is a German film directed by Adolf Winkelmann, and there` |
| 347 | Elizabeth Stewart | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Margaret Tudor` |
| 348 | Parkinson | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Parkinson's disease` |
| 349 | Roger Mortimer, 1st Earl of March | 0/0.00 | 0/0.31 | 0/0.00 | PATH_FALLBACK | `Robert Clifford, 3rd Baron Clifford` |
| 350 | English | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Distractors in the graph. No information about Æthelwald's wife's origin is provided in th` |
| 351 | Paris | 0/0.00 | 0/0.00 | 0/0.00 | C1|C2 | `Meaux` |
| 352 | Fearless Nadia | 0/0.00 | 0/0.00 | 0/0.00 | C1|C2 | `Homi Wadia` |
| 353 | Dresden | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Dresden` |
| 354 | Siemowit III, Duke of Masovia | 0/0.80 | 0/0.29 | 0/0.80 | C6|C2 | `Siemowit IV, Duke of Masovia` |
| 355 | Berlin | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Berlin` |
| 356 | British | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `British` |
| 357 | Commercy | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Remiremont` |
| 358 | 17 November 1845 | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `17 November 1845` |
| 359 | Elisabeth Farnese | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Princess Louise of Saxe-Gotha-Altenburg` |
| 360 | Přerov | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Kelč in Moravia` |
| 361 | American | 0/0.00 | 0/0.00 | 0/0.00 | C1|C2|UNKNOWN | `United States` |
| 362 | Neapolitan | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `The information provided does not mention where Joanna, Duchess of Durazzo's mother died.` |
| 363 | Kim Jong-il | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Kim Jong-il` |
| 364 | Öndörkhaan | 0/0.00 | 0/0.00 | 0/0.00 | C1|C11|UNKNOWN | `China` |
| 365 | New York | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `San Francisco, California` |
| 366 | Fernando García de Hita | 0/0.33 | 0/0.33 | 0/0.33 | PATH_FALLBACK | `García Ordóñez` |
| 367 | American | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Wakefield, Michigan` |
| 368 | Sir Paul Gore, 1st Baronet | 1/1.00 | 0/0.80 | 0/0.60 | C2 | `Sir Ralph Gore, 2nd Baronet` |
| 369 | Virginia Bourbon del Monte | 0/0.33 | 0/0.33 | 0/0.33 | PATH_FALLBACK | `Virginia Agnelli` |
| 370 | Jean Harlow | 0/0.00 | 0/0.00 | 0/0.00 | C1|C2|UNKNOWN | `Paul Bern` |
| 371 | Italy | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Italian-French` |
| 372 | Brno | 0/0.00 | 1/1.00 | 0/0.00 | PATH_FALLBACK | `Not specified` |
| 373 | Archduke Joseph, Palatine of Hungary | 0/0.22 | 0/0.00 | 0/0.00 | UNKNOWN | `Leopold II, Holy Roman Emperor` |
| 374 | 'Adud al-Dawla | 0/0.50 | 0/0.50 | 0/0.50 | PATH_FALLBACK | `Baha al-Dawla` |
| 375 | Academy of Fine Arts Vienna | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Ecole Internationale de Genève` |
| 376 | Austrian | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Austria` |
| 377 | Mills College | 0/0.00 | 0/0.00 | 0/0.00 | C1|C2 | `Fred Frith` |
| 378 | French | 0/0.00 | 0/0.00 | 0/0.00 | C1 | `Australian` |
| 379 | National Film School in Łódź | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `National Film School in Łódź` |
| 380 | São Paulo | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Italy` |
| 381 | 14 September 1964 | 0/0.00 | 0/0.00 | 0/0.00 | C2 | `15 April 1526` |
| 382 | Memphis | 0/0.00 | 0/0.00 | 0/0.00 | C1 | `Place of birth` |
| 383 | Southampton | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Place of origin` |
| 384 | British | 0/0.00 | 0/0.00 | 0/0.00 | C2 | `American` |
| 385 | Florida Atlantic | 0/0.00 | 0/0.00 | 0/0.00 | C2 | `Suman Ghosh` |
| 386 | Total Nonstop Action Wrestling | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `WWE` |
| 387 | 3 June 1801 | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `3 June 1801` |
| 388 | Writtle | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Carrick, Ayrshire, Scotland` |
| 389 | Muryeong | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Francis I` |
| 390 | Richard de Umfraville | 1/1.00 | 0/0.67 | 0/0.67 | C2 | `Richard de Umfraville, Lord of Redesdale` |
| 391 | Joanna of Hainaut | 0/0.67 | 0/0.33 | 0/0.33 | UNKNOWN | `Maria of Guelders` |
| 392 | Anne Gore | 0/0.00 | 0/0.00 | 0/0.00 | UNKNOWN | `Isabella Wycliffe` |
| 393 | Hunsur | 0/0.00 | 0/0.20 | 0/0.50 | C2|C1 | `Hunsur Ramachandra Bhagyachandra` |
| 394 | Hanover | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `northern Germany` |
| 395 | Mymensingh Medical College | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Taslima Nasrin` |
| 396 | Jaffna, Sri Lanka | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Jaffna, Sri Lanka` |
| 397 | Albert I, Prince of Anhalt-Zerbst | 0/0.22 | 0/0.22 | 0/0.22 | PATH_FALLBACK | `Conrad, Margrave of Brandenburg-Stendal` |
| 398 | Roman | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `1077` |
| 399 | Tanis | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Tanis` |
| 400 | BRIT Awards | 0/0.50 | 0/0.00 | 0/0.50 | UNKNOWN | `Grammy Awards` |
| 401 | French | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `French` |
| 402 | San Diego | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `The question cannot be definitively answered from the given passages. While it is mentione` |
| 403 | Parkinson's disease | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `November 28, 2009` |
| 404 | Yale | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `University of Zagreb Faculty of Law` |
| 405 | Jerseyville | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `St. Louis, Missouri` |
| 406 | Joseph, Duke of Saxe-Altenburg | 0/0.62 | 0/0.25 | 0/0.62 | PATH_FALLBACK | `Princess Alexandra of Saxe-Altenburg's father, Joseph, Duke of Saxe-Altenburg.` |
| 407 | New York | 0/0.00 | 0/0.00 | 0/0.00 | C1|C2|UNKNOWN | `Paris` |
| 408 | Foshan | 0/0.00 | 0/0.00 | 0/0.00 | UNKNOWN | `Guangzhou City, Guangdong` |
| 409 | pneumonia | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Jackson C. Frank's performance in "Blues Run the Game" is not directly related to the pass` |
| 410 | Eleanor of Aquitaine | 0/0.67 | 0/0.67 | 0/0.67 | PATH_FALLBACK | `Eleanor of Provence` |
| 411 | Mississauga | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Canada` |
| 412 | Esparza | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Friedrichroda` |
| 413 | Princess Therese of Nassau-Weilburg | 0/0.22 | 0/0.00 | 0/0.00 | C2 | `Baroness Gösta von dem Bussche-Haddenhausen` |
| 414 | Kassel | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `The information provided does not specify where Elisabeth of Hesse, Electress Palatine's m` |
| 415 | Bronx | 0/0.00 | 0/0.00 | 0/0.00 | C2 | `Manhattan` |
| 416 | Army | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `West Point` |
| 417 | 20 June 1634 | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `20 June 1634` |
| 418 | Bakersfield, California | 0/0.00 | 0/0.00 | 0/0.00 | C1 | `Ireland` |
| 419 | November 7, 1916 | 1/1.00 | 0/0.00 | 1/1.00 | C1 | `November 7, 1916` |
| 420 | St. Peter's Basilica | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Ferentillo` |
| 421 | Rēzekne | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Rēzekne` |
| 422 | Adelaide, Countess of Soissons | 0/0.00 | 1/1.00 | 0/0.00 | C1 | `Aveline de Pierrefonds` |
| 423 | George III, Count of Erbach-Breuberg | 1/1.00 | 0/0.40 | 0/0.40 | UNKNOWN | `Eberhard XII, Count of Erbach-Freienstein` |
| 424 | Leningrad | 0/0.00 | 0/0.00 | 0/0.00 | C1|C2|UNKNOWN | `Place of birth` |
| 425 | Japan | 0/0.00 | 0/0.00 | 0/0.00 | C1|C2|C3 | `British` |
| 426 | Anna of Eppstein-Königstein | 0/0.00 | 0/0.33 | 0/0.00 | UNKNOWN | `Landgravine Elisabeth` |
| 427 | Grand Duke Paul Alexandrovich of Russia | 0/0.67 | 0/0.67 | 0/0.67 | PATH_FALLBACK | `Grand Duke Alexander Mikhailovich of Russia` |
| 428 | Moreno Valley | 0/0.00 | 0/0.00 | 0/0.00 | C1 | `November 30, 2005` |
| 429 | 31 January 1330 | 0/0.00 | 0/0.31 | 0/0.50 | C1|C2|UNKNOWN | `1330` |
| 430 | Lao | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Lao` |
| 431 | Hong Kong Academy for Performing Arts | 0/0.11 | 0/0.00 | 0/0.11 | PATH_FALLBACK | `Kearen Pang studied in Paris Studio Magenia for mime and physical theater.` |
| 432 | United Kingdom | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Germany` |
| 433 | Cahiers du cinéma | 1/1.00 | 0/0.00 | 1/1.00 | C1|C2|UNKNOWN | `Cahiers du cinéma` |
| 434 | Parkinson | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Parkinson's disease` |
| 435 | London | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Benjamin Vulliamy was born in 1747, but the passage does not specify his place of` |
| 436 | Madrid | 0/0.00 | 0/0.00 | 0/0.00 | C1 | `8 April 1996` |
| 437 | New York | 0/0.67 | 0/0.67 | 0/0.67 | PATH_FALLBACK | `New York, New York` |
| 438 | Leicester | 0/0.00 | 0/0.00 | 0/0.00 | C1|C2 | `Gary Lineker` |
| 439 | Hirini Moko Mead | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Marianne Williams` |
| 440 | Coral Gables, Florida | 0/0.80 | 1/1.00 | 0/0.80 | C1|C2 | `Coral Gables` |
| 441 | French | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `France` |
| 442 | German | 0/0.00 | 0/0.00 | 0/0.00 | C1 | `French` |
| 443 | New York | 0/0.00 | 0/0.00 | 0/0.00 | C5|C1|C4 | `10 August 1960` |
| 444 | Hagfors | 1/1.00 | 0/0.67 | 1/1.00 | C2 | `Hagfors` |
| 445 | Henry VIII the Sparrow | 0/0.33 | 1/1.00 | 0/0.33 | UNKNOWN | `Henry VI the Older` |
| 446 | San Ferdinando di Puglia | 0/0.89 | 0/0.89 | 0/0.89 | PATH_FALLBACK | `San Ferdinando di Puglia, Italy` |
| 447 | 7 September 1868 | 1/1.00 | 0/0.00 | 1/1.00 | C2 | `7 September 1868` |
| 448 | Joan of Acre | 0/0.00 | 0/0.25 | 0/0.00 | C2|C3 | `Elizabeth de Clare` |
| 449 | Northamptonshire | 0/0.00 | 0/0.00 | 0/0.00 | UNKNOWN | `Place of origin` |
| 450 | Khenifra | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Rome, Italy` |
| 451 | Elisabeth Dorothea of Saxe-Gotha-Altenburg | 1/1.00 | 0/0.50 | 1/1.00 | UNKNOWN | `Elisabeth Dorothea of Saxe-Gotha-Altenburg` |
| 452 | Alençon | 0/0.67 | 0/0.67 | 0/0.67 | PATH_FALLBACK | `Alençon, Orne` |
| 453 | Louis X of France | 0/0.25 | 0/0.25 | 0/0.25 | PATH_FALLBACK | `Philip III of Navarre` |
| 454 | Branson, Missouri | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Not specified` |
| 455 | Toungoo Empire | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Burmese` |
| 456 | Peabody Conservatory | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `None of the provided passages mention where the composer of film Port Djema studied.` |
| 457 | Santa Barbara, California | 0/0.00 | 0/0.00 | 0/0.00 | C7|C1|C7 | `Chicago` |
| 458 | 1969 | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `1969` |
| 459 | January 26, 1955 | 1/1.00 | 0/0.00 | 1/1.00 | C1 | `January 26, 1955` |
| 460 | Hamburg, Germany | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Hamburg, Germany` |
| 461 | Ekushey Padak | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Ekushey Padak` |
| 462 | Tower | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Westminster Palace` |
| 463 | Bogotá | 0/0.00 | 0/0.00 | 0/0.00 | UNKNOWN | `César Castellanos Domínguez` |
| 464 | 4 January 1790 | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `4 January 1790` |
| 465 | Père Lachaise Cemetery | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Bordighera, Italy` |
| 466 | Adolph I | 0/0.00 | 0/0.00 | 0/0.00 | C1 | `William III, Duke of Bavaria` |
| 467 | Cardross | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Robert the Bruce died in 1329.` |
| 468 | Munich | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Grünwald, Germany` |
| 469 | Ansegisel | 0/0.00 | 0/0.00 | 0/0.00 | C1|C2|UNKNOWN | `Pepin of Herstal` |
| 470 | Buenos Aires | 0/0.57 | 0/0.57 | 0/0.57 | PATH_FALLBACK | `Vicente López, Gran Buenos Aires` |
| 471 | William Henry Fellowes | 1/1.00 | 0/0.80 | 1/1.00 | C1|C2 | `William Henry Fellowes` |
| 472 | Liverpool | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Liverpool` |
| 473 | 1947 | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `1947` |
| 474 | Frederick Francis III, Grand Duke of Mecklenburg-Schwerin | 1/1.00 | 0/0.36 | 1/1.00 | C1 | `Frederick Francis III, Grand Duke of Mecklenburg-Schwerin` |
| 475 | Forest Lawn Memorial Park | 0/0.80 | 0/0.80 | 0/0.80 | PATH_FALLBACK | `Glendale's Forest Lawn Memorial Park Cemetery` |
| 476 | 3 February 1735 | 0/0.33 | 0/0.00 | 0/0.33 | C1 | `14 February 1459` |
| 477 | Drusus Julius Caesar | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Tiberius` |
| 478 | Kreuth | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Kreuth-Weißach` |
| 479 | Macedonia | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `The question does not provide enough information to determine the birthplace of Dobrodeia ` |
| 480 | Casimir I of Oświęcim | 0/0.44 | 0/0.00 | 0/0.44 | C1|C11 | `Duke Wenceslaus I of Zator` |
| 481 | Kırklareli | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Candan Erçetin` |
| 482 | Buenos Aires | 0/0.80 | 0/0.57 | 0/0.57 | C2 | `Vicente López, Gran Buenos Aires` |
| 483 | Pennsylvania | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Place of origin` |
| 484 | Honoré IV, Prince of Monaco | 0/0.67 | 0/0.67 | 0/0.67 | PATH_FALLBACK | `Prince Joseph of Monaco` |
| 485 | Sasaram | 1/1.00 | 0/0.00 | 1/1.00 | PATH_FALLBACK | `Sasaram` |
| 486 | 1 October 1844 | 1/1.00 | 0/0.00 | 1/1.00 | PATH_FALLBACK | `1 October 1844` |
| 487 | German | 0/0.00 | 0/0.00 | 0/0.00 | C1|C2|C5|C12 | `Prussia` |
| 488 | Ariane Ascaride | 0/0.00 | 0/0.00 | 0/0.00 | C1 | `Robert Guédiguian` |
| 489 | Bouxwiller | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Bouxwiller` |
| 490 | Eva-Riitta Siitonen | 0/0.00 | 0/0.00 | 0/0.00 | C1|C2 | `Fredi` |
| 491 | Rudolf Hausner | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Howard Franklin` |
| 492 | John George I, Duke of Saxe-Eisenach | 0/0.20 | 0/0.17 | 0/0.20 | PATH_FALLBACK | `Louise Juliane of Erbach` |
| 493 | China University of Political Science and Law | 0/0.00 | 0/0.00 | 0/0.00 | C1 | `Chinese` |
| 494 | KV35 | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Place of origin` |
| 495 | Coimbra | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Coimbra` |
| 496 | Frederick Francis I, Grand Duke of Mecklenburg-Schwerin | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Frederick Francis I, Grand Duke of Mecklenburg-Schwerin` |
| 497 | Amman | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Amman` |
| 498 | New York | 0/0.36 | 0/0.67 | 0/0.67 | C1|C2 | `New York, New York` |
| 499 | Great Britain | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `British` |
