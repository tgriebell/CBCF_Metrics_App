from backend.database import SessionLocal
from backend.models import FollowerHistory
from datetime import datetime

MONTHS = {"janeiro": 1, "fevereiro": 2, "março": 3, "abril": 4, "maio": 5, "junho": 6, "julho": 7, "agosto": 8, "setembro": 9, "outubro": 10, "novembro": 11, "dezembro": 12}

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
""".strip()

db = SessionLocal()
y = 2024
last_m = 12
for l in raw_data.strip().split('\n'):
    p = l.split('\t')
    if len(p)<2: continue
    d_s = p[0].split(' de ')
    day, mon = int(d_s[0]), MONTHS[d_s[1].lower()]
    if mon == 1 and last_m == 12: y += 1
    last_m = mon
    dt = datetime(y, mon, day)
    if not db.query(FollowerHistory).filter(FollowerHistory.date == dt, FollowerHistory.platform == 'tiktok').first():
        db.add(FollowerHistory(user_id=1, platform='tiktok', count=int(p[1]), date=dt))
db.commit()
db.close()
print("1A OK")
