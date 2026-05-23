# Entity-Hop Answer Rerank

total: 300

| condition | EM | contains | F1 |
|---|---:|---:|---:|
| bge_ref | 0.030 | 0.053 | 0.062 |
| strong | 0.177 | 0.310 | 0.311 |
| path_prompt | 0.220 | 0.317 | 0.333 |
| rerank | 0.223 | 0.327 | 0.338 |

## Win/loss

```json
{
  "rerank_wins_vs_path": 8,
  "rerank_losses_vs_path": 7,
  "rerank_wins_vs_bge": 60,
  "rerank_losses_vs_bge": 2,
  "disagreements": 146
}
```

## Rows

| idx | gold | path | strong | rerank | selected | output |
|---:|---|---:|---:|---:|---|---|
| 0 | Małgorzata Braunek | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Małgorzata Braunek` |
| 1 | 12 June 1516 | 1/1.00 | 0/0.00 | 1/1.00 | C1 | `12 June 1516` |
| 2 | Myanmar Motion Picture Academy Awards | 0/0.77 | 0/0.71 | 1/1.00 | C1|C2 | `Myanmar Motion Picture Academy Awards` |
| 3 | Missoula, Montana | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `David Lynch` |
| 4 | Charles Armand René de La Trémoille | 1/1.00 | 0/0.40 | 1/1.00 | C1 | `Charles Armand René de La Trémoille` |
| 5 | Galați | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Galați` |
| 6 | Ptolemy IX Lathyros | 0/0.33 | 0/0.40 | 0/0.33 | PATH_FALLBACK | `Antiochus IX Cyzicenus` |
| 7 | Brooklyn | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `1953` |
| 8 | stroke | 0/0.00 | 0/0.00 | 0/0.00 | C7|C8 | `Princess Victoria Melita of Saxe-Coburg and Gotha died on 2 March 1936` |
| 9 | Nice | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Nice` |
| 10 | 1983 | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `2004` |
| 11 | United States | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `American` |
| 12 | Rupert | 0/0.50 | 0/0.50 | 0/0.50 | PATH_FALLBACK | `Rupert of Germany` |
| 13 | Marie Leszczyńska | 0/0.00 | 0/0.11 | 0/0.00 | PATH_FALLBACK | `Morning` |
| 14 | Catherine Robbe-Grillet | 0/0.00 | 1/1.00 | 0/0.00 | PATH_FALLBACK | `The question asks for the spouse of the director of the film "Eden and After". From the pa` |
| 15 | Hilandar | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Serbia` |
| 16 | Pompey | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Julia` |
| 17 | tuberculosis | 0/0.22 | 0/0.20 | 0/0.22 | C2|C1 | `Katherine Mansfield died of extrapulmonary tuberculosis in 1923` |
| 18 | Rukn al-Dawla | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Rukn al-Dawla` |
| 19 | Xi'an | 1/1.00 | 0/0.67 | 0/0.67 | C2 | `Xi'an, Shaanxi` |
| 20 | German | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Russia` |
| 21 | Louis-Alexandre Berthier | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `William Montagu Douglas Scott, 6th Duke of Buccleuch` |
| 22 | Pavia | 0/0.00 | 0/0.00 | 0/0.00 | C2|C12 | `Forlì` |
| 23 | Víctor Bó | 0/0.00 | 0/0.00 | 0/0.00 | C1 | `Isabel Sarli` |
| 24 | Urraca of Castile | 0/0.33 | 0/0.00 | 0/0.33 | PATH_FALLBACK | `Eleanor of Viseu` |
| 25 | Cahiers du cinéma | 0/0.00 | 0/0.86 | 0/0.86 | C2 | `Les Cahiers du Cinéma` |
| 26 | Sir Arthur Gore, 2nd Baronet | 0/0.80 | 0/0.80 | 0/0.80 | PATH_FALLBACK | `Sir Arthur Gore, 1st Baronet` |
| 27 | London | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `London` |
| 28 | Pakistan | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `India` |
| 29 | Winnipeg, Manitoba | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `South Porcupine, Ontario` |
| 30 | Fukuoka | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Place of birth` |
| 31 | Roma | 0/0.00 | 0/0.00 | 0/0.00 | C1 | `Italy` |
| 32 | Moscow, USSR | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Moscow, USSR` |
| 33 | Jeanne d'Albret | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Eleanor of Navarre` |
| 34 | New York | 0/0.00 | 0/0.00 | 0/0.00 | C1|UNKNOWN | `Jersey Shore` |
| 35 | Louis II | 0/0.00 | 0/0.00 | 0/0.00 | UNKNOWN | `Hermann I of Thuringia` |
| 36 | Bohemia | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Duchy of Hainaut` |
| 37 | Gura Humorului | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Palos Verdes Estates, California, USA` |
| 38 | Meran | 0/0.29 | 0/0.33 | 0/0.29 | PATH_FALLBACK | `Obermais, Meran, County of Tyrol, Austria–Hungary` |
| 39 | Grammy | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `No award mentioned for Joe Jackson related to the song "Sunday Papers".` |
| 40 | Peter I | 0/0.00 | 0/0.00 | 0/0.29 | UNKNOWN | `William I, Count of Burgundy` |
| 41 | 24 March 1927 | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `18 July 1918` |
| 42 | Ostrogothic Kingdom | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Ostrogoths` |
| 43 | Kurdish | 0/0.00 | 0/0.00 | 0/0.00 | UNKNOWN | `Place of origin` |
| 44 | Liverpool | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Liverpool` |
| 45 | Louis, Grand Dauphin | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Philip V of Spain` |
| 46 | Kujō Michiie | 1/1.00 | 0/0.50 | 1/1.00 | C2|C1|UNKNOWN | `Kujō Michiie` |
| 47 | Madrid | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Madrid` |
| 48 | United Nations | 1/1.00 | 0/0.50 | 0/0.50 | C2 | `United Nations High Commissioner for Refugees` |
| 49 | Paris | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Alexandria, Egypt` |
| 50 | Mathilde of Bourbon | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Tiburge de Sarenom` |
| 51 | London | 0/0.00 | 1/1.00 | 1/1.00 | C2|UNKNOWN | `London` |
| 52 | Königsberg | 0/0.50 | 0/0.50 | 0/0.50 | PATH_FALLBACK | `Gurievsk near Königsberg` |
| 53 | Homs | 1/1.00 | 0/0.00 | 0/0.00 | UNKNOWN | `Syria` |
| 54 | Alain Poiré | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Alain Poiré` |
| 55 | Naha, Okinawa | 0/0.80 | 0/0.80 | 0/0.80 | PATH_FALLBACK | `Naha, Okinawa, Japan` |
| 56 | Byzantine | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Greek` |
| 57 | August 8, 1975 | 1/1.00 | 0/0.55 | 1/1.00 | C2 | `August 8, 1975` |
| 58 | Chuck Schumer | 0/0.00 | 0/0.00 | 0/0.00 | C3|C1 | `Anthony Weiner` |
| 59 | Florence | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Forlì` |
| 60 | Helsingfors | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Place of origin` |
| 61 | Dutch | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Netherlands` |
| 62 | Tisch | 0/0.22 | 0/0.00 | 0/0.22 | C1|C2|UNKNOWN | `Tisch School of the Arts of New York University` |
| 63 | India | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Korean` |
| 64 | leukemia | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `N/A` |
| 65 | Herstal | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Place of origin` |
| 66 | 22 January 1794 | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `six months before Lord Patrick Crichton-Stuart was born` |
| 67 | Stanisław Leszczyński | 0/0.00 | 0/0.00 | 0/0.00 | C10|UNKNOWN | `King Louis XIV of France` |
| 68 | 3 August 979 | 0/0.00 | 0/0.50 | 0/0.00 | PATH_FALLBACK | `1015` |
| 69 | Aldo Parisot | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Kriv Stenders` |
| 70 | 1886 | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `1886` |
| 71 | Nevele | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Nevele` |
| 72 | Manchester | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Manchester` |
| 73 | Tantallon Castle | 0/0.29 | 0/0.00 | 0/0.29 | C1 | `Douglas Castle, Douglas, South Lanarkshire` |
| 74 | American | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `German` |
| 75 | Sochi | 0/0.00 | 0/0.00 | 0/0.00 | C3|C1 | `Hong Kong` |
| 76 | French | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Canada` |
| 77 | Winnipeg, Manitoba | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Winnipeg, Manitoba` |
| 78 | Villafranca del Bierzo | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Florence` |
| 79 | Jean Hersholt Humanitarian Award | 0/0.33 | 0/0.62 | 0/0.33 | UNKNOWN | `Academy Award` |
| 80 | Princess Madeleine, Duchess of Hälsingland and Gästrikland | 0/0.00 | 1/1.00 | 0/0.00 | PATH_FALLBACK | `Dorothy Clement` |
| 81 | Princess Augusta of Schwarzburg-Sondershausen | 0/0.50 | 0/0.50 | 0/0.50 | PATH_FALLBACK | `Princess Emma of Anhalt-Bernburg-Schaumburg-Hoym` |
| 82 | Cahiers du cinéma | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Éric Rohmer worked as a film director.` |
| 83 | China | 0/0.00 | 0/0.00 | 0/0.00 | C1 | `Qatar` |
| 84 | Charles I of Naples | 0/0.67 | 0/0.67 | 0/0.67 | PATH_FALLBACK | `King Charles I of Sicily` |
| 85 | Argentina | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Argentina` |
| 86 | Jacques Cousteau | 0/0.50 | 0/0.50 | 0/0.50 | PATH_FALLBACK | `Jean-Michel Cousteau` |
| 87 | Thessaloniki | 0/0.00 | 0/0.00 | 0/0.00 | UNKNOWN | `assassinated in 1913` |
| 88 | New York | 0/0.00 | 0/0.00 | 0/0.00 | UNKNOWN | `Boston, Massachusetts` |
| 89 | University of Paris | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `N/A` |
| 90 | Hackney | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Place of origin` |
| 91 | 1969 | 1/1.00 | 0/0.67 | 0/0.67 | C2 | `December 1969` |
| 92 | Huahine | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Angoulême` |
| 93 | Brighton | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Death not mentioned` |
| 94 | 10 May 1912 | 0/0.00 | 0/0.00 | 0/0.00 | C2 | `20 April 1767` |
| 95 | John de Vere, 15th Earl of Oxford | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `John de Vere, 15th Earl of Oxford` |
| 96 | Kreuzlingen | 0/0.00 | 1/1.00 | 0/0.00 | C4 | `Berlin` |
| 97 | Florence | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Città di Castello` |
| 98 | Århus | 0/0.40 | 0/0.40 | 0/0.40 | PATH_FALLBACK | `Århus, Region Midtjylland, Denmark` |
| 99 | Florence | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Florence` |
| 100 | British | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `English` |
| 101 | State University of New York at Purchase | 0/0.09 | 0/0.09 | 0/0.09 | PATH_FALLBACK | `No information provided in the passages about the director of Desolation Angels (1995 Film` |
| 102 | 2 September 1770 | 0/0.50 | 1/1.00 | 1/1.00 | C2 | `2 September 1770` |
| 103 | 1080 | 0/0.67 | 0/0.67 | 0/0.67 | PATH_FALLBACK | `c. 1080` |
| 104 | 30 June 1963 | 0/1.00 | 0/0.55 | 0/1.00 | C1|C2 | `June 30, 1963` |
| 105 | Wales | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Place of origin` |
| 106 | Rosario | 0/0.40 | 0/0.40 | 0/0.40 | PATH_FALLBACK | `Rosario, Santa Fe Province` |
| 107 | 1701 | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `1653` |
| 108 | German | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Germany` |
| 109 | Franz Joseph I | 0/0.00 | 0/0.67 | 0/0.00 | UNKNOWN | `Johann Josef Adam` |
| 110 | Amman | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Place of origin` |
| 111 | Princess Maria Immaculata of Bourbon-Two Sicilies | 0/0.18 | 0/0.18 | 0/0.18 | UNKNOWN | `Archduke Leopold Salvator of Austria` |
| 112 | Belfast | 0/0.00 | 0/0.00 | 0/0.00 | C1|C7|C10|UNKNOWN | `Northern Ireland` |
| 113 | Tamil | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `The composer of the film Love Story 1999 is not mentioned in the passages. Therefore, the ` |
| 114 | Íñigo Vélez de Guevara, 7th Count of Oñate | 1/1.00 | 0/0.50 | 1/1.00 | PATH_FALLBACK | `Íñigo Vélez de Guevara, 7th Count of Oñate` |
| 115 | Jerez de la Frontera | 0/0.00 | 0/0.00 | 0/0.00 | C1 | `Spain` |
| 116 | Queens | 0/0.50 | 0/0.50 | 0/0.50 | PATH_FALLBACK | `Queens, New York` |
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
| 128 | Hollywood | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Oslo` |
| 129 | Harvard | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `The passages do not provide information about where William S. Burroughs Jr.'s father stud` |
| 130 | Queen Sofía of Spain | 1/1.00 | 0/0.75 | 0/0.50 | UNKNOWN | `Infanta Elena of Spain` |
| 131 | French | 0/0.00 | 0/0.00 | 0/0.00 | C1|UNKNOWN | `Czech Republic` |
| 132 | Ndvungunye | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Sobhuza I` |
| 133 | Reykjavík | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Reykjavík` |
| 134 | Thomas de Beauchamp | 0/0.44 | 0/0.44 | 0/0.44 | PATH_FALLBACK | `William de Beauchamp, 1st Baron Bergavenny` |
| 135 | María Barranco | 0/0.50 | 0/0.00 | 1/1.00 | C1|C2 | `María Barranco` |
| 136 | Osterholz | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Braunschweig` |
| 137 | Agrippina the Elder | 1/1.00 | 0/0.20 | 0/0.00 | C2 | `Nero` |
| 138 | October 27, 1893 | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `1913` |
| 139 | Lady Frances Manners | 0/0.33 | 0/0.33 | 0/0.33 | PATH_FALLBACK | `Lady Margaret Clinton` |
| 140 | Ottoman Empire | 0/0.67 | 0/0.67 | 0/0.67 | PATH_FALLBACK | `Ottoman` |
| 141 | Princess Mary of Great Britain | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Princess Mary of Great Britain` |
| 142 | Washington | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `June 13, 2008` |
| 143 | Newport | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Place of birth` |
| 144 | Catherine of Braganza | 0/0.25 | 0/0.00 | 0/0.25 | UNKNOWN | `Barbara Villiers, Countess of Castlemaine` |
| 145 | University of British Columbia | 1/1.00 | 0/0.35 | 1/1.00 | C1 | `University of British Columbia` |
| 146 | Gerberge of Lorraine | 1/1.00 | 0/0.33 | 1/1.00 | C1 | `Gerberge of Lorraine` |
| 147 | France | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `French` |
| 148 | Eleanor of Provence | 0/0.00 | 0/0.33 | 0/0.00 | PATH_FALLBACK | `Isabel le Despenser` |
| 149 | 2 August 1288 | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `1241` |
| 150 | Bernard-Roger, Count of Bigorre | 0/0.25 | 0/0.22 | 0/0.25 | UNKNOWN | `Sancho I of León` |
| 151 | Rasual Butler | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `N/A` |
| 152 | Nine Network | 0/0.00 | 1/1.00 | 1/1.00 | C1|C2 | `Nine Network` |
| 153 | Stampede Wrestling | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Diana Hart` |
| 154 | British | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Scotland` |
| 155 | United Kingdom | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `English` |
| 156 | US | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `The passage about Andrew Balding does not provide information about his father's birthplac` |
| 157 | National Film Award for Best Music Direction | 0/0.40 | 0/0.40 | 0/0.40 | PATH_FALLBACK | `Filmfare RD Burman Award for New Music Talent` |
| 158 | Queens | 0/0.33 | 0/0.33 | 0/0.33 | PATH_FALLBACK | `South Jamaica, Queens, New York` |
| 159 | Bowdoin College | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `N/A` |
| 160 | April 30, 1939 | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `1939-04-30` |
| 161 | Sigrid the Haughty | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Estrid of the Obotrites` |
| 162 | Cross Plains | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Albania` |
| 163 | Sydney, Australia | 0/0.57 | 1/1.00 | 1/1.00 | C1|C2 | `Sydney, Australia` |
| 164 | California | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Mexico` |
| 165 | Norwegian | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `American` |
| 166 | Conrad II | 0/0.67 | 0/0.67 | 0/0.67 | PATH_FALLBACK | `Conrad II of Germany` |
| 167 | Elizabeth of Nevers | 0/0.33 | 0/0.22 | 0/0.33 | C1|C2 | `Mathilde of Hesse` |
| 168 | Weston Park | 0/0.00 | 0/0.80 | 0/0.00 | UNKNOWN | `Youghal` |
| 169 | Qing dynasty | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Han Chinese` |
| 170 | Roman Empire | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Yugoslavia` |
| 171 | Arizona | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Palma` |
| 172 | Louis Philippe II, Duke of Orléans | 0/0.40 | 0/0.40 | 0/0.40 | PATH_FALLBACK | `Louis XIV of France` |
| 173 | Spanish | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Aragonese` |
| 174 | Chinese | 0/0.00 | 0/0.00 | 0/0.00 | UNKNOWN | `Emperor Zhang of Han` |
| 175 | Ashgabat | 0/0.00 | 0/0.00 | 0/0.00 | C2 | `21 December 2006` |
| 176 | Sangeet Natak Akademi Award | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Oscar` |
| 177 | Louis III, Count of Chiny | 1/1.00 | 0/0.60 | 1/1.00 | C8 | `Louis III, Count of Chiny` |
| 178 | Rabat | 0/0.67 | 0/0.67 | 0/0.67 | PATH_FALLBACK | `Rabat, Morocco` |
| 179 | Coventry | 1/1.00 | 0/0.00 | 1/1.00 | PATH_FALLBACK | `Coventry` |
| 180 | China | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `China` |
| 181 | Efva Attling | 0/0.00 | 0/0.00 | 0/0.00 | C1|C2 | `Eva Dahlgren` |
| 182 | La Trinité | 1/1.00 | 0/0.31 | 1/1.00 | C1|C2 | `La Trinité` |
| 183 | Hugh de Stafford, 2nd Earl of Stafford | 0/0.92 | 1/1.00 | 1/1.00 | C2 | `Hugh de Stafford, 2nd Earl of Stafford` |
| 184 | Västerås | 0/0.67 | 0/0.67 | 0/0.67 | PATH_FALLBACK | `Västerås, Sweden` |
| 185 | Leopoldo Torre Nilsson | 0/0.33 | 0/0.00 | 0/0.00 | C1|UNKNOWN | `Floren Delbene` |
| 186 | Jules Lederer | 0/0.00 | 0/0.00 | 0/0.00 | C8|UNKNOWN | `Herodes Atticus` |
| 187 | Paris | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Paris` |
| 188 | Wigeric of Lotharingia | 0/0.00 | 0/0.20 | 0/0.00 | PATH_FALLBACK | `Otto I, Holy Roman Emperor` |
| 189 | Daniel Alomía Robles | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Daniel Alomía Robles` |
| 190 | Stony Brook University | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Stony Brook University` |
| 191 | Helsingfors | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Place of birth` |
| 192 | Studio City | 0/0.80 | 0/0.80 | 0/0.80 | PATH_FALLBACK | `Studio City, Cal.` |
| 193 | Richard Burke, 2nd Earl of Clanricarde | 0/0.67 | 1/1.00 | 0/0.83 | UNKNOWN | `Ulick Burke, 2nd Earl of Clanricarde` |
| 194 | Bernard I, Margrave of Baden-Baden | 0/0.67 | 0/0.80 | 0/0.80 | UNKNOWN | `Margrave Jacob I of Baden-Baden` |
| 195 | Mapy Cortés | 1/1.00 | 0/0.00 | 1/1.00 | C1 | `Mapy Cortés` |
| 196 | Akhetaten | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Akhenaten` |
| 197 | Isabella of Angoulême | 0/0.33 | 0/0.00 | 0/0.33 | PATH_FALLBACK | `Eleanor of Castile` |
| 198 | Henry Styleman | 0/0.00 | 0/0.57 | 0/0.00 | PATH_FALLBACK | `William the Conqueror` |
| 199 | Gaston IV of Foix | 0/0.89 | 0/0.89 | 0/0.89 | PATH_FALLBACK | `Count Gaston IV of Foix` |
| 200 | August 7, 2004 | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `August 7, 2004` |
| 201 | California | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `The information provided does not mention the birthplace of John Beal, the composer of the` |
| 202 | laryngeal cancer | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `N/A` |
| 203 | Germany | 0/0.00 | 0/0.00 | 0/0.00 | C1 | `German` |
| 204 | Christ's College, Cambridge | 0/0.00 | 0/0.00 | 1/1.00 | C7|C1|C2|UNKNOWN | `Christ's College, Cambridge` |
| 205 | Weimar | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Merseburg` |
| 206 | Marc Allégret | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Yves Montand` |
| 207 | Jerome, 4th Count de Salis-Soglio | 0/0.80 | 0/0.22 | 0/0.80 | C1 | `Jerome, 2nd Count de Salis-Soglio` |
| 208 | 23 February 1473 | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `949` |
| 209 | Billy Ray Cyrus | 0/0.40 | 0/0.40 | 0/0.40 | PATH_FALLBACK | `Ron Cyrus` |
| 210 | New York | 0/0.67 | 0/0.67 | 0/0.67 | PATH_FALLBACK | `New York, New York` |
| 211 | Forlì | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Imola` |
| 212 | Hyderabad | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `30 March 1967` |
| 213 | Gloria Loring | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Nicki Minaj` |
| 214 | Lancing College | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `George VII of Imereti` |
| 215 | Edinburgh | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `The graph does not provide information about the place of death of James Adam (architect)'` |
| 216 | St John's College | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Katherine de la Pole` |
| 217 | Kitiyakara Voralaksana | 0/0.00 | 0/0.29 | 0/0.00 | UNKNOWN | `Bhumibol Adulyadej` |
| 218 | Yash Johar | 0/0.50 | 0/0.50 | 0/0.50 | PATH_FALLBACK | `Hiroo Johar` |
| 219 | San Juan, Puerto Rico | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `San Juan, Puerto Rico` |
| 220 | Évreux | 1/1.00 | 0/0.00 | 1/1.00 | PATH_FALLBACK | `Évreux` |
| 221 | Reykjavík | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Reykjavík` |
| 222 | Munich | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Dresden` |
| 223 | Maureen O'Sullivan | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Maureen O'Sullivan` |
| 224 | shot | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `XXXTentacion was not a composer of "Look at Me" and the song does not mention the cause of` |
| 225 | Elizabeth the Cuman | 0/0.00 | 0/0.00 | 0/0.00 | C1 | `Maria Laskarina` |
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
| 236 | 21 June 1483 | 0/0.00 | 0/0.00 | 0/0.00 | C1|C2|UNKNOWN | `23 August 1500` |
| 237 | Huntington's disease | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Woody Guthrie died on October 3, 1967.` |
| 238 | Suffield, Connecticut | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Suffield, Connecticut` |
| 239 | Ragnild Magnusdotter | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Harald Kesja` |
| 240 | Germany | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Dutch` |
| 241 | Poznań | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Poland` |
| 242 | Alena Mihulová | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Alena Mihulová` |
| 243 | Ischia | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `The passages do not provide information about the composer of the film Henry V (1944 Film)` |
| 244 | Paris | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Paris` |
| 245 | Palos Verdes | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Robert Lamoureux` |
| 246 | France | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Mexico` |
| 247 | Naha, Okinawa | 0/0.80 | 0/0.80 | 0/0.80 | PATH_FALLBACK | `Naha, Okinawa, Japan` |
| 248 | Lady Anne Campbell | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Lady Anne Campbell` |
| 249 | Theni | 0/0.25 | 0/0.25 | 0/0.25 | PATH_FALLBACK | `Mallingapuram near Pannaipuram, Theni District, Tamil Nadu` |
| 250 | Johannesburg, South Africa | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Montreal` |
| 251 | Rimini | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Modena` |
| 252 | Prostějov | 0/0.00 | 0/0.00 | 0/0.00 | C2 | `Prague` |
| 253 | Cebu | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Rome, Italy` |
| 254 | Rome | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Cagliari, Sardinia` |
| 255 | Joana de Prades | 0/0.67 | 0/0.00 | 0/0.67 | PATH_FALLBACK | `Joana de Gandia` |
| 256 | Henrietta Susanna Tracy | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Henrietta Susanna Tracy` |
| 257 | Fårö | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `2007` |
| 258 | Polish-Lithuanian Commonwealth | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Poland` |
| 259 | Archibald Acheson, 2nd Earl of Gosford | 1/1.00 | 0/0.20 | 1/1.00 | UNKNOWN | `Archibald Acheson, 2nd Earl of Gosford` |
| 260 | Lewes | 1/1.00 | 0/0.00 | 1/1.00 | UNKNOWN | `Lewes` |
| 261 | Bratislava | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Maceió, Alagoas` |
| 262 | Westerland | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Westerland` |
| 263 | London | 1/1.00 | 0/0.33 | 0/0.40 | C2 | `London Borough of Islington` |
| 264 | Infanta Maria Antonia of Portugal | 0/0.22 | 0/0.22 | 0/0.22 | PATH_FALLBACK | `Princess Zita of Bourbon-Parma` |
| 265 | Albert II, Prince of Anhalt-Zerbst | 0/0.60 | 1/1.00 | 0/0.60 | PATH_FALLBACK | `Albert VI, Prince of Anhalt-Köthen` |
| 266 | Ridley Scott | 0/0.00 | 0/0.00 | 0/0.00 | C1|UNKNOWN | `Captain Gunning Francis Plunkett` |
| 267 | Longqing | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Wang Kui` |
| 268 | United States | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `American` |
| 269 | India | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `India` |
| 270 | Fíngen mac Áedo Duib | 0/0.75 | 0/0.75 | 0/0.75 | PATH_FALLBACK | `Faíngen mac Áedo Duib` |
| 271 | France | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `France` |
| 272 | Thyra | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Harald Bluetooth` |
| 273 | Alexander III of Russia | 0/0.60 | 0/0.89 | 0/0.60 | UNKNOWN | `Grand Duke Alexander Mikhailovich of Russia` |
| 274 | Forest Lawn Memorial Park | 0/0.00 | 0/0.00 | 0/0.00 | C1|C2|C8 | `Worms` |
| 275 | Prince Harald of Denmark | 0/0.50 | 0/0.50 | 0/0.50 | PATH_FALLBACK | `Frederick VIII of Denmark` |
| 276 | Lezhë | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Krujë` |
| 277 | Mark Hanna | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Simpson Harris Morgan` |
| 278 | France | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Frankish` |
| 279 | Charles VI of France | 1/1.00 | 0/0.89 | 1/1.00 | C1 | `Charles VI of France` |
| 280 | Oslo | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Oslo` |
| 281 | American | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `South Korea` |
| 282 | Meresankh II | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Nefertkau III` |
| 283 | Farwah bint al-Qasim | 0/0.33 | 0/0.33 | 0/0.33 | PATH_FALLBACK | `Fatimah bint Muhammad` |
| 284 | Helsinki | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Finnish` |
| 285 | Valparaíso | 0/0.67 | 0/0.67 | 0/0.67 | PATH_FALLBACK | `Valparaíso, Chile` |
| 286 | Kingsbury, London | 1/1.00 | 0/0.67 | 1/1.00 | C1 | `Kingsbury, London` |
| 287 | Königstein im Taunus | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Königstein im Taunus` |
| 288 | 10 November 1871 | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `10 November 1871` |
| 289 | Torgau | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Torgau` |
| 290 | Weston-super-Mare, Somerset | 0/0.00 | 0/0.00 | 0/0.00 | C1 | `Blackheath, London` |
| 291 | 20 April 1434 | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `1426` |
| 292 | Florida Atlantic | 0/0.00 | 0/0.80 | 0/0.00 | C1 | `University of North Carolina School of the Arts` |
| 293 | West Branch, Iowa | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Asheville, Ohio` |
| 294 | British | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `British` |
| 295 | Saqqara | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Allerton Cemetery` |
| 296 | Irish | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Ireland` |
| 297 | Celle | 0/0.00 | 0/0.00 | 0/0.00 | C4 | `Great Britain` |
| 298 | Otto Carlmar | 0/0.50 | 0/0.00 | 0/0.50 | C1 | `Edith Carlmar` |
| 299 | Prince Yi Kang | 0/0.00 | 0/0.67 | 0/0.00 | C1 | `Herodes Atticus` |
