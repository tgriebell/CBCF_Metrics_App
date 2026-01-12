from backend.database import SessionLocal
from backend.models import FollowerHistory
from datetime import datetime

MONTHS = {
    "janeiro": 1, "fevereiro": 2, "março": 3, "abril": 4, "maio": 5, "junho": 6,
    "julho": 7, "agosto": 8, "setembro": 9, "outubro": 10, "novembro": 11, "dezembro": 12
}

db = SessionLocal()
cur_year = 2024
last_mon = 12
count = 0

with open('followers_list.txt', 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if not line: continue
        parts = line.split('\t')
        if len(parts) < 2: continue
        
        date_str, followers = parts[0], int(parts[1])
        d_parts = date_str.split(' de ')
        day, mon_name = int(d_parts[0]), d_parts[1].lower()
        mon = MONTHS[mon_name]
        
        if mon == 1 and last_mon == 12: cur_year += 1
        last_mon = mon
        
        dt = datetime(cur_year, mon, day)
        
        if not db.query(FollowerHistory).filter(FollowerHistory.date == dt, FollowerHistory.platform == 'tiktok').first():
            db.add(FollowerHistory(user_id=1, platform='tiktok', count=followers, date=dt))
            count += 1

db.commit()
db.close()
print(f"Sucesso: {count} registros importados do arquivo txt.")
