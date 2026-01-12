import asyncio
from backend.database import SessionLocal
from backend.youtube_service import youtube_service
from backend.models import FollowerHistory
from datetime import datetime, timedelta

async def recalc_history():
    db = SessionLocal()
    user_id = 1
    
    print("--- Iniciando Reconstrução do Histórico do YouTube ---")
    
    # 1. Obter total atual confiável
    # Tenta pegar do registro de hoje ou usa o último válido
    latest = db.query(FollowerHistory).filter(
        FollowerHistory.user_id == user_id,
        FollowerHistory.platform == 'youtube',
        FollowerHistory.count > 0
    ).order_by(FollowerHistory.date.desc()).first()
    
    if not latest:
        print("Erro: Não há registro atual com contagem de inscritos.")
        return
        
    current_total = latest.count
    current_date = latest.date.date()
    print(f"Total Atual de Referência: {current_total} em {current_date}")
    
    # 2. Configurar o serviço (autenticação já deve estar salva no banco)
    youtube_service.user_id = user_id
    analytics = youtube_service._get_authenticated_service(db, 'youtubeAnalytics', 'v2')
    
    if not analytics:
        print("Erro: Falha na autenticação com YouTube Analytics.")
        return

    # 3. Buscar dados de ganho/perda dos últimos 365 dias (1 ano completo) + Métricas de Engajamento
    end_date_str = datetime.now().strftime('%Y-%m-%d')
    start_date_str = (datetime.now() - timedelta(days=400)).strftime('%Y-%m-%d')
    
    print(f"Buscando dados na API de {start_date_str} até {end_date_str}...")
    
    try:
        response = analytics.reports().query(
            ids='channel==MINE',
            startDate=start_date_str,
            endDate=end_date_str,
            metrics='subscribersGained,subscribersLost,views,likes,comments,shares', # ADICIONADO MÉTRICAS
            dimensions='day',
            sort='-day' 
        ).execute()
    except Exception as e:
        print(f"Erro na API: {e}")
        return

    rows = response.get('rows', [])
    if not rows:
        print("Nenhum dado retornado pela API.")
        return
        
    print(f"Dados obtidos: {len(rows)} dias.")
    
    running_total = current_total
    updated_count = 0
    
    for row in rows:
        # Formato agora é: [date, gained, lost, views, likes, comments, shares]
        r_date_str, gained, lost, views, likes, comments, shares = row
        r_date = datetime.strptime(r_date_str, '%Y-%m-%d').date()
        net_growth = gained - lost
        
        db_rec = db.query(FollowerHistory).filter(
            FollowerHistory.user_id == user_id,
            FollowerHistory.platform == 'youtube',
            FollowerHistory.date >= datetime.combine(r_date, datetime.min.time()),
            FollowerHistory.date <= datetime.combine(r_date, datetime.max.time())
        ).first()
        
        if db_rec:
            db_rec.count = running_total
            # Atualiza métricas de engajamento também
            db_rec.views = views
            db_rec.likes = likes
            db_rec.comments = comments
            db_rec.shares = shares
            updated_count += 1
        else:
            db.add(FollowerHistory(
                user_id=user_id,
                platform='youtube',
                count=running_total,
                date=datetime.combine(r_date, datetime.min.time()),
                views=views,     # Salva views
                likes=likes,     # Salva likes
                comments=comments, # Salva comments
                shares=shares    # Salva shares
            ))
            updated_count += 1
            
        running_total = running_total - net_growth
        
    db.commit()
    print(f"Sucesso! {updated_count} dias atualizados com INSCRITOS e ENGAJAMENTO.")
    print(f"Total estimado há 400 dias: {running_total}")

if __name__ == "__main__":
    asyncio.run(recalc_history())
