import uvicorn
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from starlette.responses import RedirectResponse
import os
import re
import random

from .config import get_settings
from .models import Base, User, Credential, Post
from .database import engine, SessionLocal, get_db
from .api_services import get_api_service, API_SERVICES, YoutubeApiService

settings = get_settings()
print(f"DEBUG: Loaded Settings: YOUTUBE_CLIENT_ID={settings.YOUTUBE_CLIENT_ID}, YOUTUBE_CLIENT_SECRET={'*' * len(settings.YOUTUBE_CLIENT_SECRET) if settings.YOUTUBE_CLIENT_SECRET else 'None'}, YOUTUBE_REDIRECT_URI={settings.YOUTUBE_REDIRECT_URI}")

# Cria as tabelas no banco de dados
Base.metadata.create_all(bind=engine)

# --- USUÁRIO TESTE INICIAL (Provisório) ---
with SessionLocal() as db:
    if not db.query(User).filter(User.username == "testuser").first():
        hashed_password = "testpassword"
        db_user = User(username="testuser", hashed_password=hashed_password)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        print("Usuário de teste 'testuser' criado.")
    else:
        print("Usuário de teste 'testuser' já existe.")

# --- SCHEMAS (PYDANTIC) ---
class PostCreate(BaseModel):
    platform: str
    title: str
    url: Optional[str] = ""
    description: Optional[str] = ""
    tags: Optional[str] = ""
    status: Optional[str] = "postado"
    cover_image: Optional[str] = None

class PostOut(PostCreate):
    id: int
    created_at: datetime
    # As métricas serão adicionadas dinamicamente
    class Config:
        from_attributes = True

# --- APP FASTAPI ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/hello")
def read_root():
    return {"Hello": "World"}

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Autenticação Dinâmica ---
@app.get("/auth/{platform}/login")
async def login_for_platform(platform: str, db: Session = Depends(get_db)):
    print(f"DEBUG: Acessado /auth/{platform}/login")
    if platform not in API_SERVICES:
        print(f"DEBUG: Plataforma '{platform}' não suportada.")
        raise HTTPException(status_code=400, detail=f"Plataforma '{platform}' não suportada.")
    
    # Assumindo um único usuário de teste por enquanto
    user = db.query(User).filter(User.username == "testuser").first()
    if not user:
        print("DEBUG: Usuário de teste não encontrado.")
        raise HTTPException(status_code=404, detail="Usuário de teste não encontrado.")

    service = get_api_service(platform, user.id)
    if not service:
        print("DEBUG: Erro ao inicializar serviço de API.")
        raise HTTPException(status_code=500, detail="Erro ao inicializar serviço de API.")

    print(f"DEBUG: Obtendo URL de autorização para user_id: {user.id}")
    auth_url = service.get_authorization_url(user.id)
    print(f"DEBUG: URL de autorização gerada: {auth_url}")
    return RedirectResponse(auth_url)

@app.get("/auth/{platform}/callback")
async def auth_callback(platform: str, code: str = None, state: str = None, error: str = None, db: Session = Depends(get_db)):
    print(f"DEBUG: Acessado /auth/{platform}/callback com code={code}, state={state}, error={error}")
    if error:
        print(f"DEBUG: Erro de autorização: {error}")
        raise HTTPException(status_code=400, detail=f"Erro de autorização: {error}")
    if not code:
        print("DEBUG: Código de autorização não recebido.")
        raise HTTPException(status_code=400, detail="Código de autorização não recebido.")

    # Constrói a URL completa de resposta para o fluxo do Google OAuth
    auth_response_url = f"{settings.YOUTUBE_REDIRECT_URI}?state={state}&code={code}"

    service = get_api_service(platform, int(state)) # state contém o user_id
    if not service:
        print("DEBUG: Erro ao inicializar serviço de API no callback.")
        raise HTTPException(status_code=500, detail="Erro ao inicializar serviço de API.")
    
    try:
        user_id_from_state = int(state) # Extrai o user_id do state
        credential = service.fetch_and_store_token(auth_response_url, db, user_id_from_state)
        print(f"DEBUG: Autenticação {platform} concluída com sucesso para o user_id {user_id_from_state}.")
        # Redirecionar para o frontend ou para uma página de sucesso
        # TODO: Definir URL de sucesso no frontend
        return RedirectResponse(url="https://localhost:5173/dashboard", status_code=302)
    except Exception as e:
        print(f"DEBUG: Erro ao processar callback de autenticação: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao processar callback de autenticação: {e}")

@app.get("/posts")
def get_posts(skip: int = 0, limit: int = 50, platform: str = None, db: Session = Depends(get_db)):
    query = db.query(Post)
    if platform:
        query = query.filter(Post.platform == platform)
    
    posts_from_db = query.order_by(Post.created_at.desc()).offset(skip).limit(limit).all()
    
    # "Achata" a resposta para combinar com o que o frontend espera
    results = []
    for post in posts_from_db:
        post_data = PostOut.from_orm(post).dict()
        post_data.update(post.metrics) # Adiciona as métricas ao nível principal
        results.append(post_data)
        
    return results

@app.post("/posts", response_model=PostOut)
def create_post(post: PostCreate, db: Session = Depends(get_db)):
    if 'youtube' in post.platform:
        initial_metrics = YoutubeApiService.get_public_video_stats(post.url)
    else:
        initial_metrics = {
            "views": random.randint(100, 50000),
            "likes": random.randint(10, 5000),
            "comments": random.randint(0, 200),
            "last_updated": datetime.now().isoformat()
        }
    
    db_post = Post(
        **post.dict(),
        metrics=initial_metrics
    )
    db.add(db_post)
    db.commit()
    db.refresh(db_post)

    # Retorna o post com a estrutura achatada
    post_data = PostOut.from_orm(db_post).dict()
    post_data.update(db_post.metrics)
    return post_data

@app.put("/posts/{post_id}/refresh")
def refresh_metrics(post_id: int, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if 'youtube' in post.platform:
        new_metrics = YoutubeApiService.get_public_video_stats(post.url)
    else:
        new_metrics = {
            "views": random.randint(100, 50000),
            "likes": random.randint(10, 5000),
            "comments": random.randint(0, 200),
            "last_updated": datetime.now().isoformat()
        }
    
    post.metrics = new_metrics
    db.commit()
    return {"status": "updated", "metrics": new_metrics}

@app.delete("/posts/{post_id}")
def delete_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    db.delete(post)
    db.commit()
    return {"status": "deleted"}

@app.get("/dashboard/summary")
def get_summary(db: Session = Depends(get_db)):
    # Lógica de Metas Diárias
    today = datetime.now().date()
    # Para garantir que pegamos todos os posts do dia atual, comparamos com o início do dia e o início do próximo dia
    today_start = datetime(today.year, today.month, today.day, 0, 0, 0)
    tomorrow_start = today_start + timedelta(days=1)

    print(f"DEBUG: get_summary - Today: {today}, Today Start: {today_start}, Tomorrow Start: {tomorrow_start}")

    posts_today = db.query(Post).filter(
        Post.created_at >= today_start,
        Post.created_at < tomorrow_start
    ).all()
    
    print(f"DEBUG: get_summary - Posts Today ({len(posts_today)}): {[p.platform for p in posts_today]}")

    summary = {
        "shorts": {"current": 0, "goal": 5},
        "tiktok": {"current": 0, "goal": 5},
        "youtube_long": {"current": 0, "goal": 0}, # Meta dinâmica dependendo do dia
        "instagram": {"current": 0, "goal": 0}     # Defina meta se quiser
    }
    
    # Define meta de vídeo longo (Terça=1, Quinta=3)
    weekday = today.weekday() # 0=Seg, 1=Ter, ...
    if weekday == 1 or weekday == 3: # Terça ou Quinta
        summary["youtube_long"]["goal"] = 1
        
    for p in posts_today:
        # A plataforma 'youtube_shorts' deve ser contada em 'shorts'
        # e 'youtube_long' deve ser contada em 'youtube_long'
        if p.platform == 'youtube_shorts':
            summary["shorts"]["current"] += 1
        elif p.platform == 'youtube_long':
            summary["youtube_long"]["current"] += 1
        elif p.platform == 'tiktok':
            summary["tiktok"]["current"] += 1
        elif p.platform == 'instagram':
            summary["instagram"]["current"] += 1
            
    print(f"DEBUG: get_summary - Final Summary: {summary}")
    return summary

# --- NOVOS ENDPOINTS PARA GRÁFICOS ---
@app.get("/dashboard/audience")
def get_audience_summary(db: Session = Depends(get_db)):
    # Assumindo um único usuário de teste por enquanto
    user = db.query(User).filter(User.username == "testuser").first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário de teste não encontrado.")

    service = get_api_service("youtube", user.id) # Usando o serviço do YouTube
    if not service:
        raise HTTPException(status_code=500, detail="Erro ao inicializar serviço de API.")

    # Pega os dados de audiência reais da API do YouTube
    audience_data = service.get_audience_data(db)
    
    # O frontend espera um formato específico, podemos precisar adaptá-lo aqui
    # Exemplo:
    return {
        "youtube_long": audience_data.get("youtube_long", {"count": "N/A", "growth": "N/A"}),
        "youtube_shorts": audience_data.get("youtube_shorts", {"count": "N/A", "growth": "N/A"}),
        # Outras plataformas não conectadas
        "tiktok": {"count": 0, "growth": 0},
        "instagram": {"count": 0, "growth": 0}
    }

@app.get("/dashboard/daily_growth")
def get_daily_growth(db: Session = Depends(get_db)):
    from datetime import timedelta

    user = db.query(User).filter(User.username == "testuser").first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário de teste não encontrado.")

    youtube_service = get_api_service("youtube", user.id)
    if not youtube_service:
        return _generate_mock_daily_data(30)

    # Define o período para os últimos 30 dias
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=29)
    
    # A função agora retorna uma lista de dicionários com todas as métricas
    youtube_daily_data = youtube_service.get_daily_subscriber_growth(db, start_date, end_date)
    
    # Mapeia os dados do YouTube para uma estrutura de dicionário por data
    # O valor agora é o dicionário de métricas completo
    youtube_data_map = {entry['date']: entry for entry in youtube_daily_data}

    chart_data = []
    # Estrutura de métricas zerada para fallback
    zero_metrics = {"views": 0, "likes": 0, "comments": 0, "net_growth": 0}

    for i in range(30):
        day = end_date - timedelta(days=i)
        day_str = day.strftime('%Y-%m-%d')
        
        # Pega o dicionário de métricas completo do mapa, ou um fallback zerado
        youtube_metrics = youtube_data_map.get(day_str, {})
        
        chart_data.append({
            "day": day.strftime('%d/%m'),
            "youtube": {
                "views": youtube_metrics.get("views", 0),
                "likes": youtube_metrics.get("likes", 0),
                "dislikes": youtube_metrics.get("dislikes", 0),
                "comments": youtube_metrics.get("comments", 0),
                "shares": youtube_metrics.get("shares", 0),
                "net_growth": youtube_metrics.get("net_growth", 0),
            },
            # Mantém a estrutura para outras plataformas
            "tiktok": zero_metrics,
            "instagram": zero_metrics,
        })
        
    return list(reversed(chart_data)) # Retorna em ordem cronológica

def _generate_mock_daily_data(days: int):
    """Helper para gerar dados diários mockados quando a API não está disponível."""
    mock_data = []
    zero_metrics = {"views": 0, "likes": 0, "dislikes": 0, "comments": 0, "shares": 0, "net_growth": 0}
    for i in range(days):
        day = datetime.now().date() - timedelta(days=i)
        mock_data.append({
            "day": day.strftime('%d/%m'),
            "youtube": zero_metrics,
            "tiktok": zero_metrics,
            "instagram": zero_metrics,
        })
    return list(reversed(mock_data)) # Retorna em ordem cronológica


import calendar

# ... (rest of imports)

# ... (rest of code)







@app.get("/dashboard/monthly_growth")
def get_monthly_growth(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    from datetime import timedelta
    from collections import defaultdict

    user = db.query(User).filter(User.username == "testuser").first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário de teste não encontrado.")
    
    youtube_service = get_api_service("youtube", user.id)
    if not youtube_service:
        return _generate_mock_monthly_data(start_date=start_date, end_date=end_date)

    # --- LÓGICA DO PLANO B ---
    today = datetime.now().date()

    # 1. Definir o período de 12 meses para trás a partir de uma data segura
    safe_end_date = today - timedelta(days=3)
    end_date = safe_end_date
    start_date = (end_date.replace(day=1) - timedelta(days=365)).replace(day=1)
    
    # 2. Buscar dados DIÁRIOS para o período inteiro
    youtube_daily_data = youtube_service.get_daily_subscriber_growth(db, start_date, end_date)

    # 3. Agrupar os dados diários em baldes mensais
    monthly_aggregation = defaultdict(lambda: {
        "views": 0, "likes": 0, "dislikes": 0, "comments": 0, "shares": 0, "net_growth": 0
    })

    for daily_entry in youtube_daily_data:
        # Extrai o mês no formato YYYY-MM da data 'YYYY-MM-DD'
        month_key = daily_entry['date'][:7]
        monthly_aggregation[month_key]['views'] += daily_entry.get('views', 0)
        monthly_aggregation[month_key]['likes'] += daily_entry.get('likes', 0)
        monthly_aggregation[month_key]['dislikes'] += daily_entry.get('dislikes', 0)
        monthly_aggregation[month_key]['comments'] += daily_entry.get('comments', 0)
        monthly_aggregation[month_key]['shares'] += daily_entry.get('shares', 0)
        monthly_aggregation[month_key]['net_growth'] += daily_entry.get('net_growth', 0)

    youtube_data_map = dict(monthly_aggregation)
    # --- FIM DO PLANO B ---

    month_map_display = {
        '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr', '05': 'Mai', '06': 'Jun',
        '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez'
    }

    chart_data = []
    current_month_iter = start_date
    zero_metrics = {"views": 0, "likes": 0, "dislikes": 0, "comments": 0, "shares": 0, "net_growth": 0}

    while current_month_iter <= end_date:
        month_key_for_api_data = current_month_iter.strftime('%Y-%m')
        month_display_name = month_map_display.get(current_month_iter.strftime('%m'), '??')

        youtube_metrics = youtube_data_map.get(month_key_for_api_data, {})

        chart_data.append({
            "name": month_display_name,
            "youtube": {
                "views": youtube_metrics.get("views", 0),
                "likes": youtube_metrics.get("likes", 0),
                "dislikes": youtube_metrics.get("dislikes", 0),
                "comments": youtube_metrics.get("comments", 0),
                "shares": youtube_metrics.get("shares", 0),
                "net_growth": youtube_metrics.get("net_growth", 0),
            },
            "tiktok": zero_metrics,
            "instagram": zero_metrics,
        })

        if current_month_iter.month == 12:
            current_month_iter = current_month_iter.replace(year=current_month_iter.year + 1, month=1, day=1)
        else:
            current_month_iter = current_month_iter.replace(month=current_month_iter.month + 1, day=1)

    return chart_data






if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)