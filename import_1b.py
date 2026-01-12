from backend.database import SessionLocal
from backend.models import FollowerHistory
from datetime import datetime

MONTHS = {"janeiro": 1, "fevereiro": 2, "março": 3, "abril": 4, "maio": 5, "junho": 6, "julho": 7, "agosto": 8, "setembro": 9, "outubro": 10, "novembro": 11, "dezembro": 12}

raw_data = """
1 de março	65474
2 de março	65496
3 de março	65516
4 de março	65549
5 de março	65582
6 de março	65608
7 de março	65621
8 de março	65638
9 de março	65651
10 de março	65670
11 de março	65691
12 de março	65710
13 de março	65727
14 de março	65744
15 de março	65757
16 de março	65768
17 de março	65778
18 de março	65800
19 de março	65827
20 de março	65834
21 de março	65845
22 de março	65870
23 de março	65884
24 de março	65892
25 de março	65900
26 de março	65907
27 de março	65933
28 de março	65950
29 de março	65976
30 de março	65989
31 de março	66015
1 de abril	66033
2 de abril	66062
3 de abril	66092
4 de abril	66120
5 de abril	66155
6 de abril	66180
7 de abril	66211
8 de abril	66234
9 de abril	66248
10 de abril	66260
11 de abril	66265
12 de abril	66268
13 de abril	66271
14 de abril	66291
15 de abril	66467
16 de abril	66671
17 de abril	66838
18 de abril	66948
19 de abril	66999
20 de abril	67071
21 de abril	67130
22 de abril	67161
23 de abril	67541
24 de abril	67728
25 de abril	67900
26 de abril	67963
27 de abril	67997
28 de abril	68029
29 de abril	68044
30 de abril	68065
1 de maio	68094
2 de maio	68143
3 de maio	68183
4 de maio	68228
5 de maio	68277
6 de maio	68317
7 de maio	68333
8 de maio	68393
9 de maio	68441
10 de maio	68476
11 de maio	68494
12 de maio	68555
13 de maio	68622
14 de maio	68734
15 de maio	68885
16 de maio	69054
17 de maio	69160
18 de maio	69231
19 de maio	69348
20 de maio	69413
21 de maio	69484
22 de maio	69568
23 de maio	69636
24 de maio	69687
25 de maio	69746
26 de maio	69773
27 de maio	69806
28 de maio	69837
29 de maio	69860
30 de maio	69888
31 de maio	69931
1 de junho	69990
2 de junho	70042
3 de junho	70089
4 de junho	70178
5 de junho	70251
6 de junho	70303
7 de junho	70332
8 de junho	70373
9 de junho	70413
10 de junho	70439
11 de junho	70453
12 de junho	70475
13 de junho	70499
14 de junho	70524
15 de junho	70551
16 de junho	70584
17 de junho	70602
18 de junho	70642
19 de junho	70669
20 de junho	71626
21 de junho	74729
22 de junho	76056
23 de junho	76590
24 de junho	76613
25 de junho	76645
26 de junho	76667
27 de junho	76692
28 de junho	76714
29 de junho	76741
30 de junho	76771
"

db = SessionLocal()
for l in raw_data.strip().split('\n'):
    p = l.split('\t')
    if len(p)<2: continue
    d_s = p[0].split(' de ')
    day, mon = int(d_s[0]), MONTHS[d_s[1].lower()]
    dt = datetime(2025, mon, day)
    if not db.query(FollowerHistory).filter(FollowerHistory.date == dt, FollowerHistory.platform == 'tiktok').first():
        db.add(FollowerHistory(user_id=1, platform='tiktok', count=int(p[1]), date=dt))
db.commit()
db.close()
print("1B OK")
