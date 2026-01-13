from fastapi import FastAPI, Depends, HTTPException, Body, status, APIRouter
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from .database import SessionLocal, engine, Base
from . import models, schemas
from .youtube_service import youtube_service
from .tiktok_service import tiktok_service
from .gemini_service import gemini_service
from .data_analytics_gemini_service import data_analytics_service
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from typing import List, Optional
import logging

# Configuração de logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Cria as tabelas no banco de dados se não existirem
print("Creating database tables...")
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Dependência para obter a sessão do banco de dados
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- LÓGICA DE AUTENTICAÇÃO INTEGRADA ---
# Como o arquivo auth.py não existe, mantemos a lógica aqui para garantir o funcionamento.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_current_user(db: Session = Depends(get_db)):
    # Lógica simplificada para o usuário de teste 'testuser'
    user = db.query(models.User).filter(models.User.username == "testuser").first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

auth_router = APIRouter()

@auth_router.post("/login")
def login(db: Session = Depends(get_db)):
    # Retorna um token fictício para o ambiente de teste
    return {"access_token": "fake-token", "token_type": "bearer"}

# --- ROTAS DE OAUTH (YouTube & TikTok) ---

@auth_router.get("/{platform}/login")
def oauth_login(platform: str, callback_url: Optional[str] = None, db: Session = Depends(get_db)):
    # Usa o usuário de teste fixo para simplificar
    user = db.query(models.User).filter(models.User.username == "testuser").first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if platform == "youtube":
        auth_url = youtube_service.get_authorization_url(user.id, callback_url=callback_url)
        return RedirectResponse(auth_url)
    elif platform == "tiktok":
        auth_url = tiktok_service.get_authorization_url(user.id, callback_url=callback_url)
        return RedirectResponse(auth_url)
    else:
        raise HTTPException(status_code=400, detail="Plataforma não suportada")

@auth_router.get("/youtube/callback")
async def youtube_callback(code: str, state: str, db: Session = Depends(get_db)):
    try:
        # Recupera dados do state
        import base64, json
        state_data = json.loads(base64.urlsafe_b64decode(state).decode())
        user_id = int(state_data.get('user_id'))
        callback_url = state_data.get('callback_url')
        
        # Simula a URL de resposta
        from .config import get_settings
        settings = get_settings()
        auth_response_url = f"{settings.YOUTUBE_REDIRECT_URI}?code={code}&state={state}"
        
        youtube_service.fetch_and_store_token(auth_response_url, db, user_id, state)
        
        # Se houver callback_url (Deep Link), redireciona pra ele
        if callback_url:
            # Garante que o callback_url tenha o token de sucesso
            final_redirect = f"{callback_url}?token=success_yt"
            return RedirectResponse(url=final_redirect)
            
        return RedirectResponse(url="/")
    except Exception as e:
        logger.error(f"Erro no callback YouTube: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@auth_router.get("/tiktok/callback")
async def tiktok_callback(code: str, state: str, db: Session = Depends(get_db)):
    try:
        _, callback_url = tiktok_service.fetch_and_store_token(code, state, db)
        
        if callback_url:
            final_redirect = f"{callback_url}?token=success_tk"
            return RedirectResponse(url=final_redirect)
            
        return RedirectResponse(url="/")
    except Exception as e:
        logger.error(f"Erro no callback TikTok: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------------------

# Configuração CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Criação de usuário de teste (se não existir)
def create_test_user():
    db = SessionLocal()
    if not db.query(models.User).filter(models.User.username == "testuser").first():
        test_user = models.User(username="testuser", email="test@example.com", hashed_password="hashed_password")
        db.add(test_user)
        db.commit()
        print("Test user 'testuser' created.")
    else:
        print("Test user 'testuser' already exists.")
    db.close()

create_test_user()

# Inclui as rotas de autenticação
app.include_router(auth_router, prefix="/auth")

@app.get("/auth/desktop_callback")
def desktop_auth_callback(token: str):
    """
    Redireciona para o protocolo do App Desktop (Deep Link) com o token.
    Uso: O frontend chama este endpoint após receber o token do provedor (ou o provedor redireciona pra cá).
    """
    return RedirectResponse(url=f"cbcfmetrics://auth?token={token}")

@app.get("/api/status")
def read_root():
    return {"status": "Backend is running", "youtube": True, "tiktok": True, "instagram": False}

# --- Rotas de Posts (Dashboard & Biblioteca) ---

@app.get("/posts", response_model=List[schemas.Post])
def get_posts(platform: str = None, db: Session = Depends(get_db)):
    query = db.query(models.Post)
    if platform:
        if platform.lower() == 'youtube':
            # Filtro inteligente: Traz Longos, Shorts e o genérico 'youtube'
            query = query.filter(models.Post.platform.in_(['youtube', 'youtube_long', 'youtube_shorts']))
        else:
            # Filtro flexível para outras plataformas (ex: tiktok, instagram)
            query = query.filter(models.Post.platform.like(f"%{platform}%"))
    
    # Ordena sempre do mais recente para o mais antigo
    return query.order_by(models.Post.published_at.desc()).all()

@app.post("/posts", response_model=schemas.Post)
def create_post(post: schemas.PostCreate, db: Session = Depends(get_db)):
    db_post = models.Post(**post.model_dump())
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post

@app.delete("/posts/{post_id}")
def delete_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    db.delete(post)
    db.commit()
    return {"ok": True}

# --- Rotas de Detalhes do Post (Modal) ---

@app.get("/api/posts/{post_id}/analytics")
def get_post_analytics(post_id: int, db: Session = Depends(get_db)):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Métricas base (Realtime do Banco de Dados - Data API)
    # Estas são as mesmas exibidas no Card da Biblioteca
    base_metrics = {
        "views": post.metrics.get("views", 0),
        "likes": post.metrics.get("likes", 0),
        "comments": post.metrics.get("comments", 0),
        "shares": post.metrics.get("shares", 0),
    }

    # Se for YouTube, tenta buscar dados profundos na API Analytics
    if "youtube" in post.platform:
        try:
            # Tenta buscar dados reais do Analytics (Retenção, etc)
            analytics_data = youtube_service.get_video_analytics(db, post.platform_content_id)
            
            # Se a API retornar erro ou mensagem (ex: vídeo muito recente), usa apenas base_metrics
            if "error" in analytics_data or "message" in analytics_data:
                print(f"[Fallback] YouTube Analytics indisponível para {post_id}: {analytics_data}")
                return {
                    **base_metrics,
                    "averageViewDuration": 0,
                    "averageViewPercentage": 0,
                    "subscribersGained": post.metrics.get("subscribers_gained", 0),
                    "fallback": True
                }
            
            # MERGE INTELIGENTE:
            # Usa métricas realtime do banco (views, likes, comments) para evitar discrepância
            # Usa métricas profundas do Analytics (retenção, subs ganhos, shares se disponível)
            
            merged_data = {
                # Dados Analíticos (Prioridade para o que vem da API de Relatórios)
                "averageViewDuration": analytics_data.get("averageViewDuration", 0),
                "averageViewPercentage": analytics_data.get("averageViewPercentage", 0),
                "subscribersGained": analytics_data.get("subscribersGained", 0),
                "estimatedMinutesWatched": analytics_data.get("estimatedMinutesWatched", 0),
                
                # Dados Básicos (Prioridade para o Banco/Data API que é mais atualizado)
                # O Analytics tem delay de ~48h, então seus views quase sempre estarão defasados
                "views": base_metrics["views"],
                "likes": base_metrics["likes"],
                "comments": base_metrics["comments"],
                
                # Shares é um caso especial: Data API não traz shares (retorna 0 geralmente), 
                # mas Analytics traz. Então preferimos Analytics se for maior que 0.
                "shares": analytics_data.get("shares", 0) if analytics_data.get("shares", 0) > 0 else base_metrics["shares"],
                
                "source": "merged_realtime_analytics"
            }
            
            return merged_data
            
        except Exception as e:
            logger.error(f"Erro ao buscar analytics do YouTube para {post_id}: {e}")
            # Fallback seguro
            return {
                **base_metrics,
                "fallback": True
            }

    # Para TikTok/Instagram, retornamos as métricas que já temos no banco
    # (Futuramente podemos conectar com serviços de analytics dessas plataformas)
    return {
        **base_metrics,
        "saves": post.metrics.get("saves", 0),
        "averageViewDuration": 0,
        "averageViewPercentage": 0,
        "platform": post.platform
    }

@app.post("/api/posts/{post_id}/insight")
async def generate_post_insight(post_id: int, db: Session = Depends(get_db)):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Calcular métricas derivadas para dar contexto à IA
    views = post.metrics.get('views', 0)
    likes = post.metrics.get('likes', 0)
    comments = post.metrics.get('comments', 0)
    shares = post.metrics.get('shares', 0)
    subs = post.metrics.get('subscribers_gained', 0)
    
    engagement_rate = ((likes + comments + shares) / views * 100) if views > 0 else 0
    conversion_rate = (subs / views * 100) if views > 0 else 0
    
    context = f"""
    PLATAFORMA: {post.platform.upper()}
    DATA PUBLICAÇÃO: {post.published_at.strftime('%d/%m/%Y') if post.published_at else 'N/A'}
    TÍTULO: "{post.title}"
    TAGS: "{post.tags or 'Nenhuma'}"
    DESCRIÇÃO COMPLETA: "{post.description[:2000] if post.description else 'Sem descrição'}..."
    
    DADOS DE PERFORMANCE:
    - Views: {views}
    - Likes: {likes}
    - Comentários: {comments}
    - Compartilhamentos: {shares}
    - Taxa de Engajamento: {engagement_rate:.2f}%
    - Inscritos Ganhos (Conversão): {subs} ({conversion_rate:.2f}%)
    """
    
    system_instruction = """
    ATUE COMO UM ESTRATEGISTA DE ELITE (Nível McKinsey/Viral Expert).
    Sua missão é entregar um relatório de inteligência densa e visual.
    
    Gere um JSON ESTRITO com esta estrutura exata:
    
    {
        "verdict_badge": "Rótulo de Impacto (Ex: 'VIRAL', 'CONSTANTE', 'CUIDADO', 'OPOUTUNIDADE')",
        "verdict_color": "Hex code (Ex: '#3bf5a5', '#f43f5e')",
        "score": 85, 
        "hook_analysis": "Análise afiada de 1 frase sobre a retenção inicial.",
        "psychological_trigger": "Nome do Gatilho (Ex: Curiosidade, Medo, Ganância)",
        "diagnosis_points": [
            { 
                "title": "Atração (Topo)", 
                "content": "Resumo de 1 frase do problema ou acerto.", 
                "sentiment": "negative" (ou 'positive'/'neutral'),
                "icon": "eye"
            },
            { 
                "title": "Retenção (Meio)", 
                "content": "Resumo de 1 frase.", 
                "sentiment": "neutral",
                "icon": "clock"
            },
            { 
                "title": "Conversão (Fundo)", 
                "content": "Resumo de 1 frase.", 
                "sentiment": "negative",
                "icon": "users"
            },
            { 
                "title": "Autoridade (Branding)", 
                "content": "Resumo de 1 frase.", 
                "sentiment": "positive",
                "icon": "star"
            }
        ],
        "actionable_steps": [
            "Ação Prática 1 (Prioridade Máxima)",
            "Ação Prática 2 (Ajuste de Conteúdo)",
            "Ação Prática 3 (Otimização SEO)",
            "Ação Prática 4 (Engajamento)",
            "Ação Prática 5 (Design/Thumb)",
            "Ação Prática 6 (Copywriting)",
            "Ação Prática 7 (Distribuição)",
            "Ação Prática 8 (Longo Prazo)"
        ]
    }
    DIRETRIZ: Gere EXATAMENTE 8 actionable_steps. Seja cirúrgico e profissional.
    """
    
    try:
        # Usa o serviço de IA com a instrução customizada
        ai_response = await data_analytics_service.analyze_data_with_context(
            user_prompt=context, 
            db=db, 
            custom_system_instruction=system_instruction
        )
        return ai_response
        
    except Exception as e:
        logger.error(f"Erro ao gerar insight IA: {e}")
        return {
            "verdict_badge": "ERRO IA",
            "verdict_color": "#ef4444",
            "score": 0,
            "hook_analysis": "Não foi possível conectar ao cérebro digital.",
            "psychological_trigger": "Desconhecido",
            "funnel_diagnosis": "Falha na análise.",
            "actionable_step": "Tente novamente."
        }

@app.post("/api/posts/{post_id}/toggle_pattern")
def toggle_post_pattern(post_id: int, db: Session = Depends(get_db)):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Toggle (se for None assume False -> True)
    current_status = post.is_pattern if post.is_pattern is not None else False
    post.is_pattern = not current_status
    
    db.commit()
    db.refresh(post)
    return {"is_pattern": post.is_pattern}

# --- Rotas de Sincronização ---

@app.get("/api/sync/{platform}")
async def sync_platform(platform: str, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    logger.info(f"Iniciando sincronização para: {platform}")
    if platform == 'youtube':
        try:
            return await youtube_service.sync_data(user.id, db)
        except Exception as e:
            logger.error(f"Erro no sync YouTube: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    elif platform == 'tiktok':
        try:
            return await tiktok_service.sync_data(user.id, db)
        except Exception as e:
            logger.error(f"Erro no sync TikTok: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    else:
        return {"status": "skipped", "platform": platform, "message": "Sincronização não implementada ainda"}

# --- Rotas de Dashboard (Gráficos) ---

@app.get("/dashboard/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    from datetime import datetime
    
    from datetime import timedelta
    
    today = datetime.now().date()
    start_of_day = datetime.combine(today, datetime.min.time())
    # AJUSTE DE FUSO: Estende a busca até as 04:00 do dia seguinte.
    # Isso captura vídeos postados à noite no Brasil (que viram madrugada UTC no banco).
    end_of_day = datetime.combine(today, datetime.max.time()) + timedelta(hours=4)

    # Função auxiliar para contar posts do dia por plataforma
    def count_today(platform_key):
        query = db.query(models.Post).filter(
            models.Post.published_at >= start_of_day,
            models.Post.published_at <= end_of_day
        )
        if platform_key == 'youtube_shorts':
            return query.filter(models.Post.platform == 'youtube_shorts').count()
        elif platform_key == 'youtube_long':
            return query.filter(models.Post.platform == 'youtube_long').count()
        elif platform_key == 'tiktok':
            return query.filter(models.Post.platform.like('%tiktok%')).count()
        elif platform_key == 'instagram':
            return query.filter(models.Post.platform.like('%instagram%')).count()
        return 0

    # Lógica de Metas Dinâmica (0=Segunda, 6=Domingo)
    weekday = today.weekday()
    
    # Regra: Shorts e TikTok (5/dia de Seg-Sex, Fim de semana é 'Off'/Lucro)
    meta_videos_curtos = 5 if weekday < 5 else 'Off'
    
    # Regra: YouTube Longo (1 na Terça(1) e Quinta(3), resto 'Off')
    meta_youtube_long = 1 if weekday in [1, 3] else 'Off'

    goals = {
        "shorts": meta_videos_curtos,
        "tiktok": meta_videos_curtos,
        "youtube_long": meta_youtube_long,
        "instagram": meta_videos_curtos 
    }

    return {
        "shorts": {"current": count_today('youtube_shorts'), "goal": goals['shorts']},
        "tiktok": {"current": count_today('tiktok'), "goal": goals['tiktok']},
        "youtube_long": {"current": count_today('youtube_long'), "goal": goals['youtube_long']},
        "instagram": {"current": count_today('instagram'), "goal": goals['instagram']},
        "total_posts_today": db.query(models.Post).filter(models.Post.published_at >= start_of_day).count()
    }

@app.get("/dashboard/audience")
def get_audience_data(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    from .models import FollowerHistory
    
    print("--- [DEBUG DASHBOARD] Buscando dados de audiência ---")
    
    def get_latest(platform):
        rec = db.query(FollowerHistory).filter(
            FollowerHistory.user_id == user.id,
            FollowerHistory.platform == platform,
            FollowerHistory.is_manual == False
        ).order_by(FollowerHistory.date.desc()).first()
        print(f"Latest {platform}: {rec.count if rec else 'None'}")
        return rec

    yt = get_latest('youtube')
    tk = get_latest('tiktok')
    ig = get_latest('instagram')

    from datetime import datetime, timedelta
    thirty_days_ago = datetime.now() - timedelta(days=30)
    
    def get_growth(platform, current_val):
        if not current_val: return "N/A"
        past = db.query(FollowerHistory).filter(
            FollowerHistory.user_id == user.id,
            FollowerHistory.platform == platform,
            FollowerHistory.is_manual == False,
            FollowerHistory.date <= thirty_days_ago
        ).order_by(FollowerHistory.date.desc()).first()
        
        if past and past.count > 0:
            diff = current_val - past.count
            return f"+{diff} este mês" if diff > 0 else f"{diff} este mês"
        return "+0 este mês"

    data = {
        "youtube_long": {"count": yt.count if yt else 0, "growth": get_growth('youtube', yt.count if yt else 0)},
        "tiktok": {"count": tk.count if tk else 0, "growth": get_growth('tiktok', tk.count if tk else 0)},
        "instagram": {"count": ig.count if ig else 0, "growth": get_growth('instagram', ig.count if ig else 0)},
    }
    print(f"Payload final Audiência: {data}")
    return data

@app.get("/dashboard/daily_growth")
def get_daily_growth(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    from .models import FollowerHistory
    from datetime import datetime, timedelta, time
    
    # Respeita o delay de segurança de 3 dias para garantir dados consolidados das APIs
    # Normaliza para o final do dia para garantir range inclusivo
    today = datetime.now().date()
    end_date_ref = today - timedelta(days=3) # ALTERADO: Delay de 3 dias
    start_date_ref = end_date_ref - timedelta(days=30)
    
    # Range de exibição (sem horas)
    display_start = datetime.combine(start_date_ref, time.min)
    display_end = datetime.combine(end_date_ref, time.max)

    # Range de busca (inclui 1 dia antes para cálculo de delta)
    query_start = display_start - timedelta(days=1)
    
    history = db.query(FollowerHistory).filter(
        FollowerHistory.user_id == user.id,
        FollowerHistory.date >= query_start,
        FollowerHistory.date <= display_end
    ).order_by(FollowerHistory.date).all()
    
    # Estrutura para processar os dados
    processed_data = {}
    
    # Pré-carregar last_counts com o dia anterior ao display_start se existir
    last_counts = {} 

    # 1. Agrupa
    for record in history:
        day_key = record.date.strftime("%d/%m")
        # Se for o dia de buffer (antes do inicio da exibição), usamos só para setar o count inicial
        if record.date < display_start:
            last_counts[record.platform] = record.count
            continue

        if day_key not in processed_data:
            processed_data[day_key] = {}
        processed_data[day_key][record.platform] = record

    # 2. Monta a lista final (apenas dias de exibição)
    final_result = []
    for i in range(31): # 31 dias para cobrir o range de exibição
        target_date = display_start + timedelta(days=i)
        if target_date > display_end: break
        
        day_key = target_date.strftime("%d/%m")
        day_item = {"day": day_key}
        
        for plat in ['youtube', 'tiktok', 'instagram']:
            record = processed_data.get(day_key, {}).get(plat)
            
            if record:
                # Calcula o ganho real do dia (net_growth)
                previous_count = last_counts.get(plat, 0)
                # Se não tivermos previous_count (ex: primeiro dia do banco), net_growth pode ser o próprio count ou 0. 
                # Assumimos 0 para evitar picos gigantes de "novos fãs" injustificados.
                net_growth = (record.count - previous_count) if previous_count > 0 else 0
                
                # Atualiza o last_count para o próximo dia
                if record.count > 0:
                   last_counts[plat] = record.count

                day_item[plat] = {
                    "net_growth": net_growth,
                    "views": record.views or 0,
                    "likes": record.likes or 0,
                    "comments": record.comments or 0,
                    "shares": record.shares or 0,
                    "profile_views": record.profile_views or 0
                }
            else:
                # Preenche com zeros se não houver registro, mas mantém last_count
                day_item[plat] = {"net_growth": 0, "views": 0, "likes": 0, "comments": 0, "shares": 0, "profile_views": 0}
        
        final_result.append(day_item)
        
    print(f"--- [DEBUG DAILY] Gerando gráfico de {display_start.strftime('%d/%m')} até {display_end.strftime('%d/%m')}.")
    return final_result

@app.get("/dashboard/monthly_growth")
def get_monthly_growth(
    start_date: str,
    end_date: str,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from .models import FollowerHistory
    from datetime import datetime, date, timedelta
    from calendar import monthrange
    
    from sqlalchemy import func
    
    try:
        start_dt = datetime.strptime(start_date, '%Y-%m-%d').date()
        end_dt = datetime.strptime(end_date, '%Y-%m-%d').date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Data inválida")

    result_data = []
    current_dt = start_dt.replace(day=1)
    end_iter_dt = end_dt.replace(day=1)

    platforms = ['tiktok', 'youtube', 'instagram']

    while current_dt <= end_iter_dt:
        _, last_day = monthrange(current_dt.year, current_dt.month)
        month_start = datetime.combine(current_dt, datetime.min.time())
        month_end = datetime.combine(current_dt.replace(day=last_day), datetime.max.time())
        month_name = current_dt.strftime("%b/%y").capitalize()

        month_item = {"name": month_name}

        for plat in platforms:
            # Para seguidores (net_growth), usamos a diferença entre o final e o início (Snapshot logic)
            # Mas apenas se tivermos 'count' acumulativo. Se não, precisaríamos somar ganhos (se tivéssemos campo de ganho diário).
            # Como FollowerHistory.count é TOTAL, mantemos a lógica de diferença para seguidores.
            initial_record = db.query(FollowerHistory).filter(
                FollowerHistory.user_id == user.id,
                FollowerHistory.platform == plat,
                FollowerHistory.date < month_start
            ).order_by(FollowerHistory.date.desc()).first()

            final_record = db.query(FollowerHistory).filter(
                FollowerHistory.user_id == user.id,
                FollowerHistory.platform == plat,
                FollowerHistory.date <= month_end
            ).order_by(FollowerHistory.date.desc()).first()

            # Calcular crescimento de seguidores
            net_growth = 0
            if final_record and initial_record:
                net_growth = max(0, final_record.count - initial_record.count)
            elif final_record:
                # Se não tem registro anterior, assume que tudo é crescimento se for o primeiro mês? 
                # Ou 0? Vamos assumir 0 para segurança ou pegar o próprio count se for início absoluto.
                pass 

            # Para Engajamento (Views, Likes, etc), SOMAMOS os registros diários do mês
            stats_sum = db.query(
                func.sum(FollowerHistory.views),
                func.sum(FollowerHistory.likes),
                func.sum(FollowerHistory.comments),
                func.sum(FollowerHistory.shares),
                func.sum(FollowerHistory.profile_views)
            ).filter(
                FollowerHistory.user_id == user.id,
                FollowerHistory.platform == plat,
                FollowerHistory.date >= month_start,
                FollowerHistory.date <= month_end
            ).first()

            # Desempacotar e tratar None como 0
            s_views, s_likes, s_comments, s_shares, s_profile = stats_sum
            
            month_item[plat] = {
                "net_growth": net_growth,
                "views": s_views or 0,
                "likes": s_likes or 0,
                "comments": s_comments or 0,
                "shares": s_shares or 0,
                "profile_views": s_profile or 0
            }

        result_data.append(month_item)
        if current_dt.month == 12:
            current_dt = current_dt.replace(year=current_dt.year + 1, month=1)
        else:
            current_dt = current_dt.replace(month=current_dt.month + 1)

    print(f"--- [DEBUG MONTHLY] Gerados {len(result_data)} meses de histórico ---")
    return result_data

# --- Rotas de Inteligência Artificial ---

@app.get("/api/ai/status")
def get_ai_status():
    return gemini_service.get_quota_status()

@app.post("/api/ai/general")
async def generate_response(request: schemas.GenerateRequest, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    
    history = []
    existing_conv = None

    # 1. Tenta recuperar histórico se conversation_id for fornecido
    if request.conversation_id:
        existing_conv = db.query(models.Conversation).filter(
            models.Conversation.id == request.conversation_id,
            models.Conversation.user_id == user.id
        ).first()
        if existing_conv:
            history = existing_conv.messages or [] # Garante lista vazia se for None

    # 2. Gera resposta com contexto
    response_text = await gemini_service.generate_general_response(request.prompt, history=history)
    
    # 3. Salva ou Atualiza no Banco
    try:
        if existing_conv:
            # Atualiza conversa existente
            # Importante: Criar nova lista para forçar detecção de mudança pelo SQLAlchemy
            new_messages = list(existing_conv.messages) if existing_conv.messages else []
            new_messages.append({"role": "user", "content": request.prompt, "timestamp": datetime.now().isoformat()})
            new_messages.append({"role": "assistant", "content": response_text, "timestamp": datetime.now().isoformat()})
            
            existing_conv.messages = new_messages
            existing_conv.timestamp = datetime.now() # Atualiza last modified
            db.commit()
            db.refresh(existing_conv)
            return {"response": response_text, "conversation_id": existing_conv.id}
        else:
            # Cria nova conversa
            short_title = await gemini_service.generate_short_title(request.prompt)
            
            initial_messages = [
                {"role": "user", "content": request.prompt, "timestamp": datetime.now().isoformat()},
                {"role": "assistant", "content": response_text, "timestamp": datetime.now().isoformat()}
            ]

            new_conv = models.Conversation(
                user_id=user.id,
                title=short_title,
                type="general",
                prompt=request.prompt, # Mantém compatibilidade legado
                response=response_text, # Mantém compatibilidade legado
                messages=initial_messages
            )
            db.add(new_conv)
            db.commit()
            db.refresh(new_conv)
            return {"response": response_text, "conversation_id": new_conv.id}

    except Exception as e:
        logger.error(f"Erro ao salvar histórico geral: {e}")
        # Mesmo com erro de banco, retorna a resposta da IA
        return {"response": response_text}

@app.post("/api/ai/data_analytics")
async def analyze_data(request: schemas.GenerateRequest, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    logger.info("--- [IA] Iniciando Análise Profunda do Histórico Completo ---")
    
    history = []
    existing_conv = None

    # 1. Recupera histórico se houver ID
    if request.conversation_id:
        existing_conv = db.query(models.Conversation).filter(
            models.Conversation.id == request.conversation_id,
            models.Conversation.user_id == user.id
        ).first()
        if existing_conv:
            history = existing_conv.messages or []

    # 2. Gera Análise
    result = await data_analytics_service.analyze_data_with_context(request.prompt, db, history=history)
    
    # --- LIMPEZA AUTOMÁTICA DE VISUAL (REGEX) ---
    import re
    def clean_redundant_text(text):
        if not isinstance(text, str): return text
        text = re.sub(r'(?i)(?:tiktok|youtube|instagram)\s*(#\d+)', r'\1', text)
        text = re.sub(r'(#\d+)\s+.*?(?=\n\n|#|$)', r'\1 ', text, flags=re.DOTALL)
        return text.strip()

    if isinstance(result, dict):
        if 'insights_hierarchy' in result:
            for key, val in result['insights_hierarchy'].items():
                if isinstance(val, str):
                    result['insights_hierarchy'][key] = clean_redundant_text(val)
                elif isinstance(val, dict) and 'insight' in val:
                    val['insight'] = clean_redundant_text(val['insight'])
        
        if 'diagnostic_cards' in result:
            for card in result['diagnostic_cards']:
                if 'content' in card:
                    card['content'] = clean_redundant_text(card['content'])
        
        if 'executive_decisions' in result:
            for dec in result['executive_decisions']:
                if 'desc' in dec:
                    dec['desc'] = clean_redundant_text(dec['desc'])

    # 3. Salvar no Histórico (Memória)
    try:
        import json
        
        # Extrai o texto principal para exibir no chat simples se necessário
        conversational_text = result.get('conversational_response') or result.get('insights_hierarchy', {}).get('master', "Relatório Gerado")
        
        if existing_conv:
             # Atualiza conversa existente
            new_messages = list(existing_conv.messages) if existing_conv.messages else []
            new_messages.append({"role": "user", "content": request.prompt, "timestamp": datetime.now().isoformat()})
            new_messages.append({
                "role": "assistant", 
                "content": conversational_text, 
                "analytics_data": result, # Salva o JSON completo aqui
                "timestamp": datetime.now().isoformat()
            })
            
            existing_conv.messages = new_messages
            existing_conv.timestamp = datetime.now()
            db.commit()
            db.refresh(existing_conv)
            
            # Injeta o ID para retorno
            result['conversation_id'] = existing_conv.id
            
        else:
            # Nova conversa
            short_title = await gemini_service.generate_short_title(request.prompt)
            if not short_title or len(short_title.strip()) == 0:
                short_title = "Relatório Estratégico"
            
            response_str = json.dumps(result)
            conv_type = "report" if request.context_type == "report" else "analytics"
            
            initial_messages = [
                {"role": "user", "content": request.prompt, "timestamp": datetime.now().isoformat()},
                {"role": "assistant", "content": conversational_text, "analytics_data": result, "timestamp": datetime.now().isoformat()}
            ]

            new_conv = models.Conversation(
                user_id=user.id,
                title=short_title,
                type=conv_type,
                prompt=request.prompt,
                response=response_str, # Legado
                messages=initial_messages # Novo
            )
            db.add(new_conv)
            db.commit()
            db.refresh(new_conv)
            
            result['conversation_id'] = new_conv.id
            logger.info(f"--- [DB] Nova conversa Analytics salva: {new_conv.id} ---")

    except Exception as e:
        logger.error(f"❌ ERRO CRÍTICO AO SALVAR HISTÓRICO ANALYTICS: {e}")

    return result

@app.get("/api/conversations", response_model=List[schemas.Conversation])
def get_history(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    conversations = db.query(models.Conversation).filter(
        models.Conversation.user_id == user.id,
        models.Conversation.type.in_(['general', 'analytics'])
    ).order_by(models.Conversation.timestamp.desc()).all()
    return conversations

@app.delete("/api/conversations/{conversation_id}")
def delete_conversation(conversation_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    conv = db.query(models.Conversation).filter(
        models.Conversation.id == conversation_id,
        models.Conversation.user_id == user.id
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversa não encontrada")
    db.delete(conv)
    db.commit()
    return {"status": "deleted"}

@app.put("/api/conversations/{conversation_id}/rename")
def rename_conversation(conversation_id: int, new_title: str = Body(..., embed=True), user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    conv = db.query(models.Conversation).filter(
        models.Conversation.id == conversation_id,
        models.Conversation.user_id == user.id
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversa não encontrada")
    conv.title = new_title
    db.commit()
    return {"status": "renamed", "title": new_title}

# --- Manual Metrics ---

@app.get("/api/metrics/missing_days")
def get_missing_metrics_days(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    from .models import FollowerHistory
    from datetime import datetime, timedelta, time, date
    
    today = datetime.now().date()
    limit_date = date(2025, 12, 19)
    result = []
    
    for i in range(1, 11):
        check_date = today - timedelta(days=i)
        if check_date < limit_date: continue
            
        start_of_day = datetime.combine(check_date, datetime.min.time())
        end_of_day = datetime.combine(check_date, datetime.max.time())
        
        record = db.query(FollowerHistory).filter(
            FollowerHistory.user_id == user.id,
            FollowerHistory.platform == 'tiktok',
            FollowerHistory.date >= start_of_day,
            FollowerHistory.date <= end_of_day
        ).first()
        
        reason = ""
        if not record: reason = "Registro Ausente"
        elif record.date.time() < time(23, 59, 0): reason = f"Pendente ({record.date.strftime('%H:%M')})"
            
        if reason:
            result.append({
                "date": check_date.strftime("%Y-%m-%d"),
                "formatted_date": check_date.strftime("%d/%m/%Y"),
                "reason": reason,
                "current_count": record.count if record else 0,
                "current_views": record.views if record else 0,
                "current_likes": record.likes if record else 0
            })
    return result

@app.post("/api/metrics/update_manual")
def update_metrics_manually(updates: List[schemas.HistoryUpdate], user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    from .models import FollowerHistory
    from datetime import datetime, time
    
    for update in updates:
        target_time = time(23, 59, 59) if update.is_final else time(12, 0, 0)
        target_date = datetime.strptime(update.date, "%Y-%m-%d").date()
        
        record = db.query(FollowerHistory).filter(
            FollowerHistory.user_id == user.id,
            FollowerHistory.platform == update.platform,
            FollowerHistory.date >= datetime.combine(target_date, datetime.min.time()),
            FollowerHistory.date <= datetime.combine(target_date, datetime.max.time())
        ).first()
        
        if record:
            record.count = update.count
            record.views = update.views or 0
            record.likes = update.likes or 0
            record.comments = update.comments or 0
            record.shares = update.shares or 0
            record.date = datetime.combine(target_date, target_time)
            record.is_manual = True
        else:
            db.add(FollowerHistory(
                user_id=user.id, platform=update.platform, count=update.count,
                views=update.views or 0, likes=update.likes or 0, comments=update.comments or 0,
                shares=update.shares or 0, date=datetime.combine(target_date, target_time),
                is_manual=True
            ))
    db.commit()
    return {"status": "success"}

@app.post("/api/patterns/analyze")
async def analyze_patterns(platform: str = "youtube", user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(models.Post).filter(
        models.Post.user_id == user.id,
        models.Post.is_pattern == True
    )
    
    # Filtro de plataforma similar ao frontend
    if platform == 'youtube':
        query = query.filter(models.Post.platform.in_(['youtube', 'youtube_long']))
    elif platform == 'shorts':
        query = query.filter(models.Post.platform.like('%shorts%'))
    elif platform == 'tiktok':
        query = query.filter(models.Post.platform.like('%tiktok%'))
    elif platform == 'instagram':
        query = query.filter(models.Post.platform.like('%instagram%'))
        
    patterns = query.all()
    
    if not patterns:
        return {"insight": "Nenhum padrão encontrado para esta plataforma. Marque alguns vídeos como referência primeiro."}
        
    # Prepara dados para a IA
    patterns_data = []
    for p in patterns:
        patterns_data.append({
            "title": p.title,
            "tags": p.tags or "",
            "description": p.description[:1500] if p.description else "", # Contexto AUMENTADO
            "views": p.metrics.get('views', 0),
            "likes": p.metrics.get('likes', 0),
            "retention": p.metrics.get('averageViewPercentage', 0)
        })
        
    # Chama o serviço de IA
    insight = await gemini_service.generate_pattern_analysis(patterns_data, platform)
    
    return {"insight": insight}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)