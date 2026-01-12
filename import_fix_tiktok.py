from backend.database import SessionLocal
from backend.models import FollowerHistory
from datetime import datetime

# Mapeamento de meses para converter do formato "19 de dezembro"
MONTHS = {
    "janeiro": 1, "fevereiro": 2, "março": 3, "abril": 4, "maio": 5, "junho": 6,
    "julho": 7, "agosto": 8, "setembro": 9, "outubro": 10, "novembro": 11, "dezembro": 12
}

def parse_and_import():
    db = SessionLocal()
    user_id = 1  # Assumindo ID 1 (testuser). Se necessário, ajustaremos.
    
    # O arquivo metrics_final.txt parece começar em Dezembro de 2023 e vai até Dezembro de 2024.
    # Vamos usar uma lógica para detectar a virada de ano.
    current_year = 2023 # Iniciamos em 2023 para que a lógica detecte Dezembro -> 2024
    last_month = 12 
    
    count_updated = 0
    count_created = 0
    
    try:
        with open('metrics_final.txt', 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except FileNotFoundError:
        print("Erro: Arquivo 'metrics_final.txt' não encontrado.")
        return

    import re

    print(f"Processando {len(lines)} linhas de dados...")

    for line in lines:
        line = line.strip()
        if not line: continue
        
        # Tenta dividir por TAB primeiro, se falhar, tenta separar por espaços múltiplos
        if '\t' in line:
            parts = line.split('\t')
        else:
            # Regex para separar por 2 ou mais espaços, ou separar logo após o nome do mês
            # Estratégia: Encontrar o padrão de data "DD de MMMM" e separar o resto
            match = re.match(r"(\d+ de \w+)\s+(.+)", line)
            if match:
                date_part = match.group(1)
                rest_part = match.group(2)
                # O resto são números separados por espaço
                numbers = rest_part.split()
                parts = [date_part] + numbers
            else:
                continue

        if len(parts) < 6:
            continue
            
        date_str = parts[0].strip()
        
        try:
            # Extração dos dados
            video_views = int(parts[1].strip() or 0)
            profile_views = int(parts[2].strip() or 0)
            likes = int(parts[3].strip() or 0)
            comments = int(parts[4].strip() or 0)
            shares = int(parts[5].strip() or 0)
            
            # Tenta pegar seguidores (coluna 6)
            followers_count = 0
            if len(parts) > 6:
                val = parts[6].strip().replace('.', '') 
                if val.isdigit() or (val.startswith('-') and val[1:].isdigit()):
                     followers_count = int(val)
            
            # Processamento da Data
            d_parts = date_str.split(' de ')
            if len(d_parts) < 2: continue
            
            day = int(d_parts[0])
            month_name = d_parts[1].lower()
            month = MONTHS.get(month_name)
            
            if not month: continue

            # Lógica de Ano:
            # A lista começa em 20 de Dezembro (de 2024) e vai até Dezembro (de 2025)
            # Se mês == 12 e estamos no início do arquivo (ou ano ainda é 2023 no init), setamos 2024
            # Se passar de 12 para 1, vira 2025
            
            # Resetando lógica de ano dentro do loop para garantir
            if current_year == 2023 and month == 12:
                current_year = 2024
            
            if last_month == 12 and month == 1:
                current_year = 2025
            
            last_month = month
            
            final_date = datetime(year=current_year, month=month, day=day, hour=12) # Meio-dia
            
            # Verifica se já existe registro nesse dia para o TikTok
            record = db.query(FollowerHistory).filter(
                FollowerHistory.user_id == user_id,
                FollowerHistory.platform == 'tiktok',
                FollowerHistory.date >= final_date.replace(hour=0, minute=0, second=0),
                FollowerHistory.date <= final_date.replace(hour=23, minute=59, second=59)
            ).first()
            
            if record:
                # Atualiza dados existentes
                record.views = video_views
                record.profile_views = profile_views
                record.likes = likes
                record.comments = comments
                record.shares = shares
                # Só atualiza count se for válido (maior que 0) e diferente
                if followers_count > 0:
                    record.count = followers_count
                count_updated += 1
            else:
                # Cria novo registro
                new_record = FollowerHistory(
                    user_id=user_id,
                    platform='tiktok',
                    count=followers_count,
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
            print(f"Erro na linha '{line}': {e}")
            
    db.commit()
    db.close()
    print(f"Importação Finalizada! Registros Atualizados: {count_updated}, Novos Criados: {count_created}")

if __name__ == "__main__":
    parse_and_import()