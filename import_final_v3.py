from backend.database import SessionLocal
from backend.models import FollowerHistory
from datetime import datetime
from sqlalchemy import text

# Mapeamento de meses
MONTHS = {
    "janeiro": 1, "fevereiro": 2, "março": 3, "abril": 4, "maio": 5, "junho": 6,
    "julho": 7, "agosto": 8, "setembro": 9, "outubro": 10, "novembro": 11, "dezembro": 12
}

def clean_and_import():
    db = SessionLocal()
    user_id = 1
    
    print("1. Limpando dados antigos do TikTok...")
    try:
        db.query(FollowerHistory).filter(FollowerHistory.platform == 'tiktok').delete()
        db.commit()
        print("   - Dados limpos.")
    except Exception as e:
        print(f"   - Erro ao limpar: {e}")
        return

    print("2. Lendo arquivo de dados...")
    try:
        with open('metrics_final.txt', 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception as e:
        print(f"   - Erro ao abrir arquivo: {e}")
        return

    print(f"3. Processando {len(lines)} registros...")
    
    # Lógica de Ano: 
    # A lista começa em Dezembro 2024 e vai até Dezembro 2025.
    # Mas observando a lista: "19 de dezembro" até "18 de dezembro" (365 dias).
    # O primeiro registro é "19 de dezembro" (2024).
    # Depois vem "1 de janeiro" (2025).
    # Até "18 de dezembro" (2025).
    
    current_year = 2024
    last_month = 12 
    
    count_created = 0
    
    for line in lines:
        parts = line.strip().split('\t')
        
        # Validar colunas (esperamos 11 colunas)
        # 0: Date
        # 1: Video Views
        # 2: Profile Views
        # 3: Likes
        # 4: Comments
        # 5: Shares
        # 6: Followers (Count)
        # 7: Diff (ignorar)
        # 8: Total Viewers
        # 9: New Viewers
        # 10: Returning Viewers
        
        if len(parts) < 7: continue 
        
        try:
            date_str = parts[0].strip()
            
            # Parse dos valores
            video_views = int(parts[1].strip() or 0)
            profile_views = int(parts[2].strip() or 0)
            likes = int(parts[3].strip() or 0)
            comments = int(parts[4].strip() or 0)
            shares = int(parts[5].strip() or 0)
            followers = int(parts[6].strip() or 0)
            
            # Novos campos de audiência (se existirem na linha)
            total_viewers = int(parts[8].strip() or 0) if len(parts) > 8 else 0
            new_viewers = int(parts[9].strip() or 0) if len(parts) > 9 else 0
            returning_viewers = int(parts[10].strip() or 0) if len(parts) > 10 else 0
            
            # Parse Data e Ano
            d_parts = date_str.split(' de ')
            day = int(d_parts[0])
            month_name = d_parts[1].lower().strip() # Added strip just in case
            
            if 'julho' in month_name:
                 print(f"DEBUG STR: '{month_name}'")
            
            month = MONTHS[month_name]
            
            if month_name == 'julho' and month != 7:
                print(f"CRITICAL ERROR: 'julho' virou {month}!")
            
            # Virada de ano: se mês caiu de 12 para 1
            if last_month == 12 and month == 1:
                current_year += 1
            
            last_month = month
            final_date = datetime(year=current_year, month=month, day=day)
            
            # Print apenas viradas de mês para não poluir
            if day == 1:
                print(f"Salvando dia 1: {final_date} (Fonte: {date_str})")
            
            new_record = FollowerHistory(
                user_id=user_id,
                platform='tiktok',
                count=followers, # Seguidores totais
                views=video_views,
                profile_views=profile_views,
                likes=likes,
                comments=comments,
                shares=shares,
                total_viewers=total_viewers,
                new_viewers=new_viewers,
                returning_viewers=returning_viewers,
                date=final_date
            )
            db.add(new_record)
            count_created += 1
            
        except Exception as e:
            print(f"   - Erro na linha '{line[:20]}...': {e}")
            
    db.commit()
    db.close()
    print(f"4. SUCESSO! {count_created} registros históricos importados.")

if __name__ == "__main__":
    clean_and_import()
