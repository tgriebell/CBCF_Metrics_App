from backend.database import SessionLocal
from backend.models import FollowerHistory
from datetime import datetime

db = SessionLocal()

# Definindo o intervalo para olhar ao redor do dia 20
start_date = datetime(2024, 12, 18)
end_date = datetime(2024, 12, 23)

print(f"--- Histórico YouTube ({start_date.date()} a {end_date.date()}) ---")

records = db.query(FollowerHistory).filter(
    FollowerHistory.platform == 'youtube',
    FollowerHistory.date >= start_date,
    FollowerHistory.date <= end_date
).order_by(FollowerHistory.date).all()

for r in records:
    print(f"ID: {r.id} | Data: {r.date} | Count: {r.count} | Manual: {r.is_manual}")

db.close()
