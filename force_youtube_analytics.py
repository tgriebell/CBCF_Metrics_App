from backend.database import SessionLocal
from backend.youtube_service import youtube_service
import logging

# Configurar logs para ver tudo
logging.basicConfig(level=logging.INFO)

db = SessionLocal()

print("--- INICIANDO COLETA DETALHADA (YOUTUBE ANALYTICS) ---")
print("Tentando buscar dados reais de inscritos ganhos/perdidos...")

# Força o user_id = 1 (Thiago)
youtube_service.user_id = 1

try:
    # Chama a função que vai no Analytics pegar o histórico diário
    youtube_service.backfill_daily_history(db)
    print("--- PROCESSO FINALIZADO ---")
except Exception as e:
    print(f"❌ ERRO CRÍTICO: {e}")
finally:
    db.close()
