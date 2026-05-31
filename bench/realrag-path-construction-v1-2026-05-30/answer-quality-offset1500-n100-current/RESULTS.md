# Entity-Hop Retrieval

total: 100
corpus_docs: 56687

## Retrieval

| metric | value |
|---|---:|
| support_title_recall | 0.520 |
| full_support_recall | 0.230 |
| answer_string_present_rate | 0.570 |

## Answer quality

| condition | EM | contains | F1 |
|---|---:|---:|---:|
| bge_ref | 0.000 | 0.000 | 0.000 |
| entity_hop_path_prompt | 0.140 | 0.200 | 0.248 |
| entity_hop_strong | 0.140 | 0.220 | 0.254 |

## Rows

| qid | gold | support | answer in docs | bge | hop strong | path | extract | ecd |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| 3fa67b7e0baf11ebab90acde48001122 | John Carew | 0.00 | 0 | 0/0.00 | 0/0.11 | 0/0.50 |  |  |
| 58ca5df40bdd11eba7f7acde48001122 | Bolivian | 0.50 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 3cd6aab00bda11eba7f7acde48001122 | Fougères | 0.50 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 06992de80bde11eba7f7acde48001122 | Yale | 0.33 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 8b0145ac0bd911eba7f7acde48001122 | Loudon Wainwright III | 1.00 | 1 | 0/0.00 | 0/0.40 | 0/0.40 |  |  |
| 3adb8a740bde11eba7f7acde48001122 | Harvard University | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 04414a4e0bde11eba7f7acde48001122 | Venice | 0.33 | 1 | 0/0.00 | 0/0.67 | 0/0.00 |  |  |
| 1c7395fa0bb011ebab90acde48001122 | Johanna Magdalena of Saxe-Altenburg | 0.50 | 1 | 0/0.00 | 0/0.22 | 0/0.44 |  |  |
| 53ff36f60baf11ebab90acde48001122 | Robert I, Count of Dreux | 0.67 | 1 | 0/0.00 | 0/0.20 | 0/0.20 |  |  |
| 6a6d24740bb011ebab90acde48001122 | Duchess Charlotte Georgine of Mecklenburg-Strelitz | 1.00 | 1 | 0/0.00 | 0/0.44 | 0/0.44 |  |  |
| 0899a4880bde11eba7f7acde48001122 | Athens | 0.25 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| dc8d75280baf11ebab90acde48001122 | Suleyman Shah | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 217f5c220bde11eba7f7acde48001122 | 30 September 1836 | 0.25 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 354086720bda11eba7f7acde48001122 | 9 January 1993 | 0.00 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| efb76f1e0baf11ebab90acde48001122 | Senakhtenre Ahmose | 0.00 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 607cb64a0bde11eba7f7acde48001122 | Manhattan | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 0016373a0bda11eba7f7acde48001122 | 2 February 1345 | 0.33 | 1 | 0/0.00 | 0/0.00 | 1/1.00 |  |  |
| dcb25ba40bdc11eba7f7acde48001122 | Campbell Scott | 1.00 | 1 | 0/0.00 | 0/0.40 | 0/0.40 |  |  |
| 5a4bc28e0bde11eba7f7acde48001122 | Leerort | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 31a1e85a0bdd11eba7f7acde48001122 | Petworth House | 0.50 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| b7cc87140bdd11eba7f7acde48001122 | Royal Society | 0.50 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 66eae2780bdd11eba7f7acde48001122 | 7 March 1772 | 0.33 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 10cd8d240baf11ebab90acde48001122 | Casimir I the Restorer | 1.00 | 1 | 0/0.00 | 0/0.33 | 0/0.00 |  |  |
| 8234f12c0bdd11eba7f7acde48001122 | New York | 0.25 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| a33b25760bdd11eba7f7acde48001122 | 20 May 1715 | 0.50 | 1 | 0/0.00 | 1/1.00 | 0/0.00 |  |  |
| 341347220bde11eba7f7acde48001122 | Värmland | 0.50 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 404937860bde11eba7f7acde48001122 | 1485 | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| ee42bc920bdc11eba7f7acde48001122 | Italian | 0.33 | 0 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 02e138da0bde11eba7f7acde48001122 | Kent State University | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 135fde100bb011ebab90acde48001122 | Alice Maud Knox | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| d1f042ee0bdc11eba7f7acde48001122 | New York | 0.67 | 1 | 0/0.00 | 0/0.80 | 0/0.80 |  |  |
| 587ceb5c0bdb11eba7f7acde48001122 | Hong Kong | 1.00 | 1 | 0/0.00 | 0/0.00 | 1/1.00 |  |  |
| b61306dc0bdd11eba7f7acde48001122 | Kodumudi | 0.00 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 24672c120bde11eba7f7acde48001122 | Montgomery | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 6956b8a60bde11eba7f7acde48001122 | 1625 | 0.50 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| d9b4231a0bdc11eba7f7acde48001122 | New Orleans | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| b09b45600bd911eba7f7acde48001122 | Berlin | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 1baf4cae0bb011ebab90acde48001122 | John II | 0.25 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 9cbbf2ac0bdd11eba7f7acde48001122 | Montréal | 0.50 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 52e05cb60bda11eba7f7acde48001122 | Toronto, Ontario | 0.50 | 1 | 0/0.00 | 0/0.80 | 0/0.80 |  |  |
| 3504cbce0bde11eba7f7acde48001122 | Soviet | 1.00 | 1 | 0/0.00 | 0/0.50 | 0/0.00 |  |  |
| 9d527e340bdd11eba7f7acde48001122 | Mercia | 0.00 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 56fb5d4e0baf11ebab90acde48001122 | Princess Michael of Kent | 0.33 | 1 | 0/0.00 | 0/0.10 | 0/0.25 |  |  |
| 33d1a6d60bda11eba7f7acde48001122 | B. V. Radha | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 50b0373c0bde11eba7f7acde48001122 | Szczodre | 0.33 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| f742206e0bda11eba7f7acde48001122 | 27 August 1724 | 0.25 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 62273e860baf11ebab90acde48001122 | Elisabeth of Hesse-Marburg | 0.00 | 1 | 0/0.00 | 0/0.29 | 0/0.29 |  |  |
| 0d74ec020bdd11eba7f7acde48001122 | New Hampshire | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 4bb815b60bdd11eba7f7acde48001122 | Yerevan | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| ea8f4d240bda11eba7f7acde48001122 | Great Britain | 0.00 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| e6bdda040bd911eba7f7acde48001122 | Memphis, Tennessee | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| fa1c43b80bae11ebab90acde48001122 | Gundred de Warenne | 0.00 | 0 | 0/0.00 | 0/0.11 | 0/0.20 |  |  |
| 70ef2e500bdd11eba7f7acde48001122 | British | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 674ec4a60bdc11eba7f7acde48001122 | Liverpool | 0.67 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| abb7ff860bdc11eba7f7acde48001122 | Halberstadt | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| c4f100380baf11ebab90acde48001122 | Sennacherib | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 6efc25160bde11eba7f7acde48001122 | American | 0.50 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| b104ea580bdc11eba7f7acde48001122 | Grammy | 0.50 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 70394ce40baf11ebab90acde48001122 | Archibald Edmonstone, 10th of Duntreath | 0.50 | 0 | 0/0.00 | 0/0.00 | 0/0.40 |  |  |
| c593cdc40bda11eba7f7acde48001122 | Birmingham | 1.00 | 1 | 0/0.00 | 0/0.67 | 0/0.67 |  |  |
| 024076580bb011ebab90acde48001122 | Siemowit III, Duke of Masovia | 0.33 | 1 | 0/0.00 | 0/0.89 | 1/1.00 |  |  |
| f23fe16c0baf11ebab90acde48001122 | Henry FitzRoy, 5th Duke of Grafton | 0.50 | 1 | 0/0.00 | 1/1.00 | 0/0.40 |  |  |
| 2c4e44380bde11eba7f7acde48001122 | Trnava | 0.50 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| c6a69b620bdd11eba7f7acde48001122 | English | 0.50 | 1 | 0/0.00 | 1/1.00 | 0/0.00 |  |  |
| a075ffa20bdb11eba7f7acde48001122 | English | 0.25 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| aaf3941c0bdb11eba7f7acde48001122 | Düsseldorf | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| dc93b4e60bdd11eba7f7acde48001122 | Rochester | 1.00 | 1 | 0/0.00 | 0/0.50 | 0/0.50 |  |  |
| ecf5d7b60bdc11eba7f7acde48001122 | Liévin | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| c7f219200bdc11eba7f7acde48001122 | Warsaw | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 166c71f00baf11ebab90acde48001122 | Agnès de Beaugency | 0.25 | 0 | 0/0.00 | 0/0.67 | 0/0.67 |  |  |
| be0714100baf11ebab90acde48001122 | Duchess Maria Dorothea of Württemberg | 0.67 | 1 | 0/0.00 | 0/0.22 | 0/0.22 |  |  |
| d43a01540bda11eba7f7acde48001122 | 420 | 0.50 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 022856960bdc11eba7f7acde48001122 | Winnipeg, Manitoba | 0.50 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| ba6e88c40bdc11eba7f7acde48001122 | Viennese | 1.00 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 6a765fc60bb011ebab90acde48001122 | Aga Khan III | 0.33 | 0 | 0/0.00 | 0/0.33 | 0/0.33 |  |  |
| 86ea0e1e0bb011ebab90acde48001122 | Charlemagne | 0.67 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 1efc35f60bde11eba7f7acde48001122 | Krastyo Sarafov National Academy for Theatre and Film Arts | 0.50 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| fd0b3fca0bdb11eba7f7acde48001122 | 1567 | 0.00 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 68f03bae0bdd11eba7f7acde48001122 | New York | 0.33 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 3635bc220bdb11eba7f7acde48001122 | London | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 670894680baf11ebab90acde48001122 | Fujiwara no Kamatari | 1.00 | 1 | 0/0.00 | 0/0.67 | 0/0.67 |  |  |
| 036d9d900baf11ebab90acde48001122 | Matilda of Brabant, Countess of Artois | 0.50 | 0 | 0/0.00 | 0/0.67 | 0/0.67 |  |  |
| db6a0c8c0bdd11eba7f7acde48001122 | 20 July 1851 | 0.67 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 05befb340baf11ebab90acde48001122 | Robert I, Duke of Normandy | 0.50 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 23b46a400bda11eba7f7acde48001122 | Porto | 0.67 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 880bd3dc0baf11ebab90acde48001122 | Blanche of Castile | 0.50 | 0 | 0/0.00 | 0/0.33 | 0/0.67 |  |  |
| 55fc5bc80bdc11eba7f7acde48001122 | London | 0.00 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| e81159820bdc11eba7f7acde48001122 | Kingdom of Sicily | 0.33 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 1418853a0bda11eba7f7acde48001122 | September 17, 1923 | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 421d66f00bb011ebab90acde48001122 | Ernst II, Prince of Hohenlohe-Langenburg | 0.50 | 1 | 0/0.00 | 0/0.22 | 0/0.22 |  |  |
| af4063660bda11eba7f7acde48001122 | America | 0.50 | 1 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 673943fa0bdd11eba7f7acde48001122 | Ardmore, County Waterford | 0.25 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 2a6c3d880bb011ebab90acde48001122 | Taddea Visconti | 0.67 | 1 | 0/0.00 | 0/0.67 | 0/0.67 |  |  |
| ff11dc760bda11eba7f7acde48001122 | Saginaw, Michigan | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 3e5d2fae0bd911eba7f7acde48001122 | Hradec Králové | 1.00 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| c8c299420baf11ebab90acde48001122 | Edward III of England | 0.00 | 0 | 0/0.00 | 0/0.22 | 0/0.00 |  |  |
| 32c4fae60bde11eba7f7acde48001122 | 19 November 1806 | 0.33 | 1 | 0/0.00 | 1/1.00 | 1/1.00 |  |  |
| 68eb956c0bde11eba7f7acde48001122 | Oxford | 0.50 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| c477273c0bdb11eba7f7acde48001122 | State Artist | 0.50 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
| 6efc1e6c0bda11eba7f7acde48001122 | Hong Kong | 0.33 | 0 | 0/0.00 | 0/0.00 | 0/0.00 |  |  |
