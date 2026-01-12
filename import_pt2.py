from backend.database import SessionLocal
from backend.models import FollowerHistory
from datetime import datetime

MONTHS = {
    "janeiro": 1, "fevereiro": 2, "março": 3, "abril": 4, "maio": 5, "junho": 6,
    "julho": 7, "agosto": 8, "setembro": 9, "outubro": 10, "novembro": 11, "dezembro": 12
}

raw_data = """
1 de julho	76836
2 de julho	76889
3 de julho	77096
4 de julho	77277
5 de julho	77388
6 de julho	77451
7 de julho	77511
8 de julho	77635
9 de julho	77769
10 de julho	77917
11 de julho	78010
12 de julho	78130
13 de julho	78232
14 de julho	78304
15 de julho	78350
16 de julho	78395
17 de julho	78425
18 de julho	78480
19 de julho	78533
20 de julho	78620
21 de julho	78702
22 de julho	78778
23 de julho	78837
24 de julho	78911
25 de julho	78977
26 de julho	79023
27 de julho	79094
28 de julho	79147
29 de julho	79213
30 de julho	79279
31 de julho	79334
1 de agosto	79392
2 de agosto	79453
3 de agosto	79490
4 de agosto	79549
5 de agosto	79672
6 de agosto	79769
7 de agosto	79850
8 de agosto	79883
9 de agosto	79914
10 de agosto	79956
11 de agosto	79982
12 de agosto	80013
13 de agosto	80045
14 de agosto	80094
15 de agosto	80132
16 de agosto	80164
17 de agosto	80204
18 de agosto	80254
19 de agosto	80298
20 de agosto	80336
21 de agosto	80369
22 de agosto	80406
23 de agosto	80448
24 de agosto	80496
25 de agosto	80542
26 de agosto	80597
27 de agosto	80752
28 de agosto	82038
29 de agosto	82125
30 de agosto	82274
31 de agosto	82536
1 de setembro	82644
2 de setembro	82722
3 de setembro	82812
4 de setembro	83331
5 de setembro	84331
6 de setembro	85045
7 de setembro	85534
8 de setembro	85707
9 de setembro	85871
10 de setembro	86143
11 de setembro	86335
12 de setembro	86581
13 de setembro	86723
14 de setembro	86841
15 de setembro	87010
16 de setembro	87143
17 de setembro	87291
18 de setembro	87406
19 de setembro	87518
20 de setembro	87662
21 de setembro	87799
22 de setembro	87893
23 de setembro	88248
24 de setembro	88413
25 de setembro	88545
26 de setembro	88624
27 de setembro	88786
28 de setembro	88885
29 de setembro	91060
30 de setembro	95543
1 de outubro	95756
2 de outubro	95870
3 de outubro	95959
4 de outubro	96038
5 de outubro	96132
6 de outubro	96214
7 de outubro	96325
8 de outubro	96376
9 de outubro	96405
10 de outubro	96438
11 de outubro	96498
12 de outubro	96525
13 de outubro	96545
14 de outubro	96554
15 de outubro	96565
16 de outubro	96577
17 de outubro	96590
18 de outubro	96615
19 de outubro	96643
20 de outubro	96676
21 de outubro	96695
22 de outubro	96715
23 de outubro	96738
24 de outubro	96766
25 de outubro	96787
26 de outubro	96815
27 de outubro	96837
28 de outubro	96900
29 de outubro	96928
30 de outubro	96973
31 de outubro	97394
1 de novembro	97660
2 de novembro	97804
3 de novembro	97924
4 de novembro	98018
5 de novembro	98055
6 de novembro	98089
7 de novembro	98122
8 de novembro	98163
9 de novembro	98249
10 de novembro	98293
11 de novembro	98350
12 de novembro	98395
13 de novembro	98467
14 de novembro	98532
15 de novembro	98597
16 de novembro	98657
17 de novembro	98694
18 de novembro	98744
19 de novembro	98794
20 de novembro	98850
21 de novembro	98885
22 de novembro	99227
23 de novembro	99612
24 de novembro	99895
25 de novembro	100292
26 de novembro	100532
27 de novembro	100714
28 de novembro	100832
29 de novembro	100911
30 de novembro	100965
1 de dezembro	101028
2 de dezembro	101435
3 de dezembro	102988
4 de dezembro	104811
5 de dezembro	105698
6 de dezembro	105846
7 de dezembro	106090
8 de dezembro	106317
9 de dezembro	106430
10 de dezembro	106526
11 de dezembro	106625
12 de dezembro	106716
13 de dezembro	106810
14 de dezembro	106888
15 de dezembro	106950
16 de dezembro	107011
""";

db = SessionLocal()
cur_year = 2025 # Inicia direto em 2025 nesta parte
for l in raw_data.strip().split('\n'):
    p = l.split('\t')
    if len(p)<2: continue
    d_s = p[0].split(' de ')
    day, mon = int(d_s[0]), MONTHS[d_s[1].lower()]
    dt = datetime(cur_year, mon, day)
    if not db.query(FollowerHistory).filter(FollowerHistory.date == dt, FollowerHistory.platform == 'tiktok').first():
        db.add(FollowerHistory(user_id=1, platform='tiktok', count=int(p[1]), date=dt))
db.commit()
db.close()
print("Parte 2 OK")
