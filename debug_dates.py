from backend.database import SessionLocal
from backend.models import FollowerHistory
from sqlalchemy import func

db = SessionLocal()

print("--- Verificação de Dados (Julho e Dezembro) ---")

# Verificar Dezembro 2024
count_dez_24 = db.query(FollowerHistory).filter(
    FollowerHistory.date >= '2024-12-01',
    FollowerHistory.date <= '2024-12-31',
    FollowerHistory.platform == 'tiktok'
).count()
print(f"Registros Dez 2024: {count_dez_24}")

# Verificar Julho 2025
count_jul_25 = db.query(FollowerHistory).filter(
    FollowerHistory.date >= '2025-07-01',
    FollowerHistory.date <= '2025-07-31',
    FollowerHistory.platform == 'tiktok'
).count()
print(f"Registros Jul 2025: {count_jul_25}")

# Verificar um registro de Julho para ver valores
sample = db.query(FollowerHistory).filter(
    FollowerHistory.date >= '2025-07-01'
).first()

if sample:
    print(f"Amostra Julho: Data={sample.date}, Views={sample.views}, Count={sample.count}")
else:
    print("Nenhuma amostra encontrada para Julho 2025.")

db.close()
