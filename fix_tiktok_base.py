from backend.database import SessionLocal
from backend.models import FollowerHistory
from datetime import datetime

def insert_tiktok_base():
    db = SessionLocal()
    user_id = 1
    
    # Data Base: 30 de Novembro de 2024
    base_date = datetime(2024, 11, 30, 12, 0, 0)
    
    # Total calculado para gerar ~909 de crescimento em Dezembro
    # (Baseado no primeiro dado real de 20/Dez que é 63191)
    base_count = 62282 
    
    # Verifica se já existe (para não duplicar)
    existing = db.query(FollowerHistory).filter(
        FollowerHistory.user_id == user_id,
        FollowerHistory.platform == 'tiktok',
        FollowerHistory.date == base_date
    ).first()
    
    if existing:
        print(f"Atualizando registro base existente de {base_date}...")
        existing.count = base_count
        # Zerar métricas de engajamento para não afetar gráficos de views
        existing.views = 0
        existing.likes = 0
        existing.comments = 0
        existing.shares = 0
    else:
        print(f"Criando novo registro base em {base_date}...")
        new_record = FollowerHistory(
            user_id=user_id,
            platform='tiktok',
            count=base_count,
            date=base_date,
            views=0, likes=0, comments=0, shares=0, profile_views=0
        )
        db.add(new_record)
    
    db.commit()
    db.close()
    print("Sucesso! Base do TikTok ajustada para gerar crescimento em Dezembro.")

if __name__ == "__main__":
    insert_tiktok_base()
