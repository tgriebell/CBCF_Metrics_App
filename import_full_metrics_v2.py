from backend.database import SessionLocal
from backend.models import FollowerHistory
from datetime import datetime

# Mapeamento de meses
MONTHS = {
    "janeiro": 1, "fevereiro": 2, "março": 3, "abril": 4, "maio": 5, "junho": 6,
    "julho": 7, "agosto": 8, "setembro": 9, "outubro": 10, "novembro": 11, "dezembro": 12
}

def parse_and_import():
    db = SessionLocal()
    user_id = 1
    
    # Lógica de Ano: Começa em 2024 (Dezembro) e vira para 2025
    current_year = 2024
    last_month = 12 # Começamos em Dezembro 2024
    
    count_updated = 0
    count_created = 0
    
    with open('metrics_data_dump.txt', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    print(f"Lendo {len(lines)} linhas...")

    for line in lines:
        parts = line.strip().split('\t')
        if len(parts) < 6:
            # Tentar split com espaços múltiplos se tab falhar, ou pular
            # As vezes o copy paste muda tabs para espaços
            # Mas vamos assumir tab
            if len(parts) < 2: continue
            
        
        date_str = parts[0].strip()
        
        try:
            # Parse dos valores
            # Se vier vazio, 0
            video_views = int(parts[1].strip() or 0)
            profile_views = int(parts[2].strip() or 0)
            likes = int(parts[3].strip() or 0)
            comments = int(parts[4].strip() or 0)
            shares = int(parts[5].strip() or 0)
            
            # Parse da data
            d_parts = date_str.split(' de ')
            day = int(d_parts[0])
            month_name = d_parts[1].lower()
            month = MONTHS[month_name]
            
            # Lógica de virada de ano
            # Se estavamos em Dezembro (12) e fomos para Janeiro (1), incrementa ano
            if last_month == 12 and month == 1:
                current_year += 1
            
            last_month = month
            
            final_date = datetime(year=current_year, month=month, day=day)
            
            # Buscar registro existente
            record = db.query(FollowerHistory).filter(
                FollowerHistory.date == final_date,
                FollowerHistory.platform == 'tiktok'
            ).first()
            
            if record:
                # Atualizar
                record.views = video_views
                record.profile_views = profile_views
                record.likes = likes
                record.comments = comments
                record.shares = shares
                count_updated += 1
            else:
                # Criar novo
                new_record = FollowerHistory(
                    user_id=user_id,
                    platform='tiktok',
                    count=0, 
                    views=video_views,
                    profile_views=profile_views,
                    likes=likes,
                    comments=comments,
                    shares=shares,
                    date=final_date
                )
                db.add(new_record)
                count_created += 1
                
        except Exception as e:
            print(f"Erro ao processar linha '{line}': {e}")
            
    db.commit()
    db.close()
    print(f"Concluído! Atualizados: {count_updated}, Criados: {count_created}")

if __name__ == "__main__":
    parse_and_import()
