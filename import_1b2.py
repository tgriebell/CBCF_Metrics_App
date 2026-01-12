from backend.database import SessionLocal
from backend.models import FollowerHistory
from datetime import datetime
MONTHS = {"maio": 5, "junho": 6}
raw_data = """
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
""
db = SessionLocal()
for l in raw_data.strip().split('\n'):
    p = l.split('\t')
    d_s = p[0].split(' de ')
    dt = datetime(2025, MONTHS[d_s[1].lower()], int(d_s[0]))
    db.add(FollowerHistory(user_id=1, platform='tiktok', count=int(p[1]), date=dt))
db.commit()
db.close()
print("1B-2 OK")
