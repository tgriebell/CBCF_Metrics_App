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
count_updated = 0
count_new = 0

print("--- INICIANDO IMPORTAÇÃO DE MÉTRICAS COMPLETAS ---")

with open('metrics_full.txt', 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        # Ignora cabeçalho ou linhas vazias
        if not line or "Date" in line: continue
        
        parts = line.split('\t')
        if len(parts) < 6: continue
        
        # Parse dos dados
        date_str = parts[0]
        views = int(parts[1])
        profile_views = int(parts[2])
        likes = int(parts[3])
        comments = int(parts[4])
        shares = int(parts[5])
        
        # Parse da Data
        d_parts = date_str.split(' de ')
        day, mon_name = int(d_parts[0]), d_parts[1].lower()
        mon = MONTHS[mon_name]
        
        # Ajuste do Ano
        if mon == 1 and last_mon == 12: cur_year += 1
        last_mon = mon
        
        dt = datetime(cur_year, mon, day)
        
        # Buscar registro existente (criado no passo anterior)
        record = db.query(FollowerHistory).filter(
            FollowerHistory.date == dt, 
            FollowerHistory.platform == 'tiktok'
        ).first()
        
        if record:
            # Atualiza registro existente com as novas métricas
            record.views = views
            record.likes = likes
            record.comments = comments
            record.shares = shares
            count_updated += 1
        else:
            # Cria novo registro (caso falte algum dia)
            # Nota: 'count' (seguidores) ficará vazio ou zero se não tivermos info
            new_record = FollowerHistory(
                user_id=1, 
                platform='tiktok',
                count=0, # Não temos seguidores nessa tabela, mantemos 0 ou anterior
                views=views,
                likes=likes,
                comments=comments,
                shares=shares,
                date=dt
            )
            db.add(new_record)
            count_new += 1

db.commit()
db.close()
print(f"--- SUCESSO: {count_updated} atualizados, {count_new} criados. ---")
