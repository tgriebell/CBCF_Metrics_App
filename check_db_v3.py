from backend.database import SessionLocal
from backend.models import FollowerHistory
from sqlalchemy import func
import sys

db = SessionLocal()

try:
    total = db.query(FollowerHistory).count()
    min_date = db.query(func.min(FollowerHistory.date)).scalar()
    max_date = db.query(func.max(FollowerHistory.date)).scalar()
    
    print(f"Total de Registros: {total}")
    print(f"Data Mínima: {min_date}")
    print(f"Data Máxima: {max_date}")

    # Verificar meses de 2024
    print("\nRegistros por mês em 2024:")
    for month in range(1, 13):
        count = db.query(FollowerHistory).filter(
            FollowerHistory.date >= f'2024-{month:02d}-01',
            FollowerHistory.date <= f'2024-{month:02d}-31'
        ).count()
        print(f"2024-{month:02d}: {count} registros")

except Exception as e:
    print(f"Erro: {e}")
finally:
    db.close()
