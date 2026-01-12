from backend.database import SessionLocal
from backend.models import FollowerHistory
from datetime import datetime

MONTHS = {
    "janeiro": 1, "fevereiro": 2, "março": 3, "abril": 4, "maio": 5, "junho": 6,
    "julho": 7, "agosto": 8, "setembro": 9, "outubro": 10, "novembro": 11, "dezembro": 12
}

raw_data = """
17 de dezembro	63205
18 de dezembro	63202
19 de dezembro	63196
20 de dezembro	63191
21 de dezembro	63187
22 de dezembro	63186
23 de dezembro	63185
24 de dezembro	63183
25 de dezembro	63182
26 de dezembro	63181
27 de dezembro	63175
28 de dezembro	63169
29 de dezembro	63163
30 de dezembro	63161
31 de dezembro	63158
1 de janeiro	63154
2 de janeiro	63152
3 de janeiro	63149
4 de janeiro	63145
5 de janeiro	63137
6 de janeiro	63131
7 de janeiro	63122
8 de janeiro	63120
9 de janeiro	63109
10 de janeiro	63110
11 de janeiro	63109
12 de janeiro	63105
13 de janeiro	63097
14 de janeiro	63093
15 de janeiro	63088
16 de janeiro	63084
17 de janeiro	63086
18 de janeiro	63088
19 de janeiro	63078
20 de janeiro	63070
21 de janeiro	63114
22 de janeiro	63573
23 de janeiro	63821
24 de janeiro	63891
25 de janeiro	63899
26 de janeiro	63911
27 de janeiro	63924
28 de janeiro	63932
29 de janeiro	63940
30 de janeiro	63947
31 de janeiro	63961
1 de fevereiro	64023
2 de fevereiro	64281
3 de fevereiro	64430
4 de fevereiro	64475
5 de fevereiro	64494
6 de fevereiro	64563
7 de fevereiro	64608
8 de fevereiro	64648
9 de fevereiro	64741
10 de fevereiro	64800
11 de fevereiro	64887
12 de fevereiro	64925
13 de fevereiro	64946
14 de fevereiro	64961
15 de fevereiro	64996
16 de fevereiro	65020
17 de fevereiro	65085
18 de fevereiro	65166
19 de fevereiro	65199
20 de fevereiro	65225
21 de fevereiro	65260
22 de fevereiro	65298
23 de fevereiro	65346
24 de fevereiro	65387
25 de fevereiro	65416
26 de fevereiro	65439
27 de fevereiro	65461
28 de fevereiro	65467
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
cur_year = 2024
last_m = 12
for l in raw_data.strip().split('\n'):
    p = l.split('\t')
    if len(p)<2: continue
    d_s = p[0].split(' de ')
    day, mon = int(d_s[0]), MONTHS[d_s[1].lower()]
    if mon == 1 and last_m == 12: cur_year += 1
    last_m = mon
    dt = datetime(cur_year, mon, day)
    if not db.query(FollowerHistory).filter(FollowerHistory.date == dt, FollowerHistory.platform == 'tiktok').first():
        db.add(FollowerHistory(user_id=1, platform='tiktok', count=int(p[1]), date=dt))
db.commit()
db.close()
print("Parte 1 OK")
