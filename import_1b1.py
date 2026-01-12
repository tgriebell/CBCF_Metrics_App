from backend.database import SessionLocal
from backend.models import FollowerHistory
from datetime import datetime
MONTHS = {"março": 3, "abril": 4}
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
""
db = SessionLocal()
for l in raw_data.strip().split('\n'):
    p = l.split('\t')
    d_s = p[0].split(' de ')
    dt = datetime(2025, MONTHS[d_s[1].lower()], int(d_s[0]))
    db.add(FollowerHistory(user_id=1, platform='tiktok', count=int(p[1]), date=dt))
db.commit()
db.close()
print("1B-1 OK")
