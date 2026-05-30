# Entity-Hop Answer Rerank

total: 100

| condition | EM | contains | F1 |
|---|---:|---:|---:|
| bge_ref | 0.000 | 0.000 | 0.000 |
| strong | 0.180 | 0.310 | 0.292 |
| path_prompt | 0.210 | 0.270 | 0.295 |
| rerank | 0.210 | 0.320 | 0.322 |

## Win/loss

```json
{
  "rerank_wins_vs_path": 2,
  "rerank_losses_vs_path": 2,
  "rerank_wins_vs_bge": 21,
  "rerank_losses_vs_bge": 0,
  "disagreements": 63
}
```

## Rows

| idx | gold | path | strong | rerank | selected | output |
|---:|---|---:|---:|---:|---|---|
| 500 | America | 1/1.00 | 0/0.00 | 1/1.00 | C1|C2 | `America` |
| 501 | Karnataka | 0/0.00 | 0/0.09 | 0/0.00 | C1 | `Mysore` |
| 502 | Öland | 0/0.00 | 0/0.00 | 0/0.00 | C2 | `Krauchenwies` |
| 503 | Reykjavík | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `29 June 1947` |
| 504 | Adalbert I, Margrave of Tuscany | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Herodes Atticus` |
| 505 | Indian | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `India` |
| 506 | Liria Palace | 0/0.00 | 0/0.67 | 0/0.67 | C2 | `Liria Palace in Madrid` |
| 507 | Louise of Mecklenburg-Güstrow | 0/0.29 | 0/0.29 | 0/0.29 | PATH_FALLBACK | `Sophie Magdalene of Brandenburg-Kulmbach` |
| 508 | Tony Award for Best Actress in a Musical | 0/0.44 | 0/0.93 | 0/0.93 | C2 | `2000 Tony Award for Best Actress in a Musical` |
| 509 | American | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `American` |
| 510 | Panthéon | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Place of origin` |
| 511 | Villupuram | 0/0.67 | 0/0.00 | 0/0.67 | C1 | `Villupuram, India` |
| 512 | Charles I of Austria | 0/0.44 | 0/0.44 | 0/0.44 | PATH_FALLBACK | `Archduke Maximilian Eugen of Austria` |
| 513 | April 23, 1716 | 0/0.50 | 0/0.50 | 0/0.50 | PATH_FALLBACK | `1716` |
| 514 | 1 August 10 | 0/0.40 | 0/0.00 | 0/0.40 | C1 | `10 BC` |
| 515 | New York | 0/0.00 | 0/0.08 | 0/0.00 | C1|C2|UNKNOWN | `Connecticut` |
| 516 | England | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `English` |
| 517 | Käthe von Nagy | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Käthe von Nagy` |
| 518 | Los Angeles County | 0/0.86 | 0/0.86 | 0/0.86 | PATH_FALLBACK | `Los Angeles County, California` |
| 519 | Taiyuan | 0/0.00 | 0/0.11 | 0/0.00 | C1|C2|C3 | `Ning Hao` |
| 520 | Palencia | 0/0.00 | 0/0.00 | 0/0.00 | UNKNOWN | `Palermo, Sicily, Italy` |
| 521 | San Diego State University | 0/0.00 | 0/0.00 | 0/0.00 | C1|C7 | `Denis Sanders` |
| 522 | Harvard | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Harvard` |
| 523 | United Nations | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `United Nations` |
| 524 | Samos | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Pythagoras` |
| 525 | America | 0/0.00 | 0/0.00 | 0/0.00 | C1 | `Scotland` |
| 526 | Shanghai | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `The Will` |
| 527 | Volker Schlöndorff | 0/0.18 | 0/0.00 | 0/0.18 | PATH_FALLBACK | `Margarethe von Trotta's spouse is Volker Schlöndorff, but he is not mentioned in the passa` |
| 528 | Thomas de Beauchamp | 0/0.20 | 0/0.22 | 0/0.20 | PATH_FALLBACK | `Ralph de Stafford, 1st Earl of Stafford` |
| 529 | Elizabeth Willoughby | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Elizabeth Willoughby` |
| 530 | Georgia | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Asa Griggs Candler` |
| 531 | Northern Ireland | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Northern Ireland` |
| 532 | Ottoman Empire | 1/1.00 | 0/0.00 | 0/0.00 | C2 | `Turkey` |
| 533 | Austria | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Norway` |
| 534 | Wolverhampton | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `UK` |
| 535 | Jean de Laval | 0/0.25 | 0/0.25 | 0/0.25 | PATH_FALLBACK | `Louis III de La Trémoille` |
| 536 | Reykjavík | 1/1.00 | 0/0.00 | 1/1.00 | PATH_FALLBACK | `Reykjavík` |
| 537 | New York | 0/0.00 | 0/0.00 | 0/0.00 | C1 | `Germany` |
| 538 | San Antonio | 0/0.40 | 0/0.80 | 0/0.80 | C1|C2|UNKNOWN | `San Antonio, Texas` |
| 539 | Venice | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Italy` |
| 540 | Theodora | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Marozia` |
| 541 | Indian | 0/0.00 | 0/0.00 | 0/0.00 | C8|UNKNOWN | `American` |
| 542 | Mihnea Turcitul | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Tiberius` |
| 543 | Paris | 0/0.00 | 0/0.00 | 0/0.00 | UNKNOWN | `28 December 2013` |
| 544 | Victor de Broglie | 0/0.57 | 0/0.57 | 0/0.57 | PATH_FALLBACK | `Achille-Victor, Duc de Broglie` |
| 545 | Louise d'Aumont | 0/0.00 | 0/0.80 | 0/0.80 | UNKNOWN | `Louise d'Aumont Mazarin` |
| 546 | Moscow | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Odessa` |
| 547 | London | 1/1.00 | 0/0.33 | 0/0.33 | C2 | `London Borough of Islington, London` |
| 548 | Grammy | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Academy Award for Best Actress` |
| 549 | Sophia of Rheineck | 0/0.25 | 1/1.00 | 1/1.00 | C2|UNKNOWN | `Sophia of Rheineck` |
| 550 | Plainfield | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Tim Sullivan was born in the United States. However, this information is not directly supp` |
| 551 | Hollywood | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Not specified` |
| 552 | Henry I of Navarre | 0/0.29 | 0/0.12 | 0/0.29 | PATH_FALLBACK | `Louis of France` |
| 553 | Chris Pérez | 0/0.00 | 0/0.57 | 1/1.00 | C2 | `Chris Pérez` |
| 554 | Topeka | 0/0.00 | 0/0.00 | 0/0.00 | C1 | `West Middlesex, Pennsylvania` |
| 555 | Florence, Italy | 0/0.00 | 0/0.00 | 0/0.00 | C1 | `County Tipperary, Ireland` |
| 556 | Khentkaus II | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Seven Years` |
| 557 | Roman | 0/0.00 | 0/0.40 | 0/0.40 | C2 | `Lugdunum in Roman Gaul` |
| 558 | Parkinson's disease | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Did a Good Man Die?` |
| 559 | 29 March 1807 | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `The information provided does not contain Luke Dillon, 4th Baron Clonbrock's father's birt` |
| 560 | Chuck Stone | 0/0.40 | 0/0.40 | 0/0.40 | PATH_FALLBACK | `Charles Stone III` |
| 561 | Wellington | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `New Zealand` |
| 562 | Frederick Louis | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Duke Peter August of Holstein-Beck` |
| 563 | Washington and Lee University | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `The passages do not provide information about William Henry Fitzhugh Lee's father's workpl` |
| 564 | People's Artist of the RSFSR | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Vladimir Vengerov` |
| 565 | British | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `English` |
| 566 | Munich Waldfriedhof | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Not specified` |
| 567 | Spanish | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Spanish` |
| 568 | Southampton | 0/0.00 | 0/0.00 | 0/0.00 | C1 | `United Kingdom` |
| 569 | Constantius Chlorus | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Constantius Chlorus` |
| 570 | Maureen O'Sullivan | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Maureen O'Sullivan` |
| 571 | Luxembourg | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Place of birth: The passage does not provide specific information about the place of birth` |
| 572 | Cecile of France | 0/0.33 | 0/0.29 | 0/0.29 | C2 | `Gersenda II of Sabran` |
| 573 | Henrietta Maria of France | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Queen Victoria` |
| 574 | Kaster | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Düsseldorf` |
| 575 | Aldeburgh | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Die Mutter` |
| 576 | Robert de Ferrers, 2nd Earl of Derby | 1/1.00 | 0/0.71 | 1/1.00 | PATH_FALLBACK | `Robert de Ferrers, 2nd Earl of Derby` |
| 577 | 1397 | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `1433` |
| 578 | Macau | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Place of birth` |
| 579 | Henry Beaufort | 0/0.00 | 0/0.00 | 0/0.00 | C1|C2|UNKNOWN | `Charles Somerset, 1st Earl of Worcester` |
| 580 | 15 August 1876 | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `15 August 1876` |
| 581 | Kyrgyzstan | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Aktan Abdykalykov` |
| 582 | American | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Irish` |
| 583 | Ferdinand I | 0/0.33 | 0/0.29 | 0/0.29 | UNKNOWN | `King John I of Portugal` |
| 584 | Père Lachaise Cemetery | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Père Lachaise Cemetery` |
| 585 | Hiroshima | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Dunbar Island` |
| 586 | Marie d'Agoult | 0/0.00 | 0/0.00 | 0/0.00 | C1|C3 | `Antonia Minor` |
| 587 | United Kingdom | 0/0.00 | 0/0.00 | 0/0.00 | C1 | `British` |
| 588 | Salsomaggiore Terme | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Salsomaggiore Terme` |
| 589 | Jean Harlow | 0/0.00 | 0/0.00 | 0/0.00 | UNKNOWN | `Olive Borden` |
| 590 | England | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `Normandy` |
| 591 | New York | 0/0.80 | 0/0.80 | 0/0.80 | PATH_FALLBACK | `New York City` |
| 592 | Philip III of France | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Philip III of France` |
| 593 | William, Duke of Nassau | 0/0.18 | 1/1.00 | 0/0.18 | PATH_FALLBACK | `George I, Prince of Waldeck and Pyrmont` |
| 594 | 23 January 1862 | 0/0.00 | 0/0.00 | 0/0.00 | C1|UNKNOWN | `1736` |
| 595 | Ozzy | 0/0.67 | 0/0.67 | 0/0.67 | PATH_FALLBACK | `Ozzy Osbourne` |
| 596 | Hungarian | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Hungarian` |
| 597 | Tiflis | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Tiflis` |
| 598 | 6 September 1868 | 0/0.00 | 0/0.00 | 0/0.00 | PATH_FALLBACK | `1413` |
| 599 | Rome | 1/1.00 | 1/1.00 | 1/1.00 | PATH_FALLBACK | `Rome` |
