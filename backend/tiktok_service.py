import secrets
import hashlib
import base64
import httpx
import json
import os
from urllib.parse import urlencode, unquote

try:
    from .base_service import ApiService
    from .config import get_settings
    from .models import Credential
    from sqlalchemy.orm import Session
except ImportError:
    from base_service import ApiService
    from config import get_settings
    from models import Credential
    from sqlalchemy.orm import Session

settings = get_settings()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SESSION_FILE = os.path.join(BASE_DIR, "tiktok_auth_sessions.json")

# URL DE REDIRECT FIXA E PADRÃO (IP 127.0.0.1)
REDIRECT_URI_FIXED = settings.TIKTOK_REDIRECT_URI

def save_session(session_id, data):
    """Salva os dados da sessão (incluindo verifier) em arquivo JSON."""
    sessions = {}
    if os.path.exists(SESSION_FILE):
        try:
            with open(SESSION_FILE, 'r') as f:
                sessions = json.load(f)
        except: pass
    
    sessions[session_id] = data
    with open(SESSION_FILE, 'w') as f:
        json.dump(sessions, f)

def load_session(session_id):
    """Carrega e remove a sessão do arquivo para garantir uso único."""
    if not os.path.exists(SESSION_FILE): return None
    try:
        with open(SESSION_FILE, 'r') as f:
            sessions = json.load(f)
        data = sessions.pop(session_id, None)
        with open(SESSION_FILE, 'w') as f:
            json.dump(sessions, f)
        return data
    except: return None

class TiktokApiService(ApiService):
    PLATFORM = "tiktok"
    SCOPES = sorted([
        "user.info.basic", "user.info.profile", "user.info.stats",
        "video.list", "artist.certification.read"
    ])

    def __init__(self, user_id: int = None):
        self.user_id = user_id

    async def sync_data(self, user_id: int, db: Session):
        self.user_id = user_id
        # 1. Sincroniza Vídeos
        posts_result = self.synchronize_posts(db)
        
        # 2. Sincroniza Perfil (Seguidores, Likes Totais)
        # Isso garante que o número do dashboard (110k) fique atualizado
        audience_result = self.get_audience_data(db)
        
        return {
            "posts": posts_result,
            "audience": audience_result
        }

    def get_authorization_url(self, user_id: int, callback_url: str = "http://localhost:5173") -> str:
        """Gera URL e salva Challenge para prova matemática."""
        import string
        
        session_id = secrets.token_urlsafe(16)
        # 1. Verifier: 128 caracteres (máximo permitido) para maior entropia e compatibilidade
        chars = string.ascii_letters + string.digits + "-._~"
        code_verifier = ''.join(secrets.choice(chars) for _ in range(128))

        # 2. Gerar Code Challenge (S256) com HEXADECIMAL (Específico para TikTok Desktop)
        # Doc: code_challenge = SHA256(code_verifier).toString(Hex)
        code_challenge = hashlib.sha256(code_verifier.encode('ascii')).hexdigest()

        # SALVAR TUDO PARA PROVA POSTERIOR
        save_session(session_id, {
            "code_verifier": code_verifier,
            "expected_challenge": code_challenge,
            "user_id": user_id,
            "callback_url": callback_url
        })

        state_data = { "session_id": session_id }
        state = base64.urlsafe_b64encode(json.dumps(state_data).encode()).decode().rstrip('=')

        print(f"--- [LOGIN] PROVA MATEMÁTICA INICIADA ---")
        print(f"Verifier Gerado: {code_verifier}")
        print(f"Challenge (HEX): {code_challenge}")
        print(f"Redirect Enviado: {REDIRECT_URI_FIXED}")
        print(f"-----------------------------------------")

        params = {
            "client_key": settings.TIKTOK_CLIENT_KEY.strip(),
            "scope": ",".join(self.SCOPES),
            "response_type": "code",
            "redirect_uri": REDIRECT_URI_FIXED,
            "state": state,
            "code_challenge": code_challenge,
            "code_challenge_method": "S256",
        }
        
        # Construção manual da URL sem barra no final (v2/auth/authorize?...)
        query_string = urlencode(params)
        final_url = f"https://www.tiktok.com/v2/auth/authorize?{query_string}"
        
        print(f"--- [LOGIN] URL FINAL GERADA ---")
        print(final_url)
        print(f"--------------------------------")
        
        return final_url

    def fetch_and_store_token(self, code: str, state: str, db: Session):
        """Valida prova matemática antes de enviar."""
        # 1. Decodificar State
        decoded_state = None
        for i in range(4):
            try:
                state_padded = state + "=" * i
                decoded_state = json.loads(base64.urlsafe_b64decode(state_padded).decode())
                break 
            except: continue
        
        if not decoded_state: raise Exception("State inválido.")
        session_id = decoded_state.get('session_id')
        
        # 2. Recuperar Sessão
        session_data = load_session(session_id)
        if not session_data:
            print(f"DEBUG: Sessão {session_id} perdida.")
            raise Exception("Sessão expirada.")
            
        code_verifier = session_data["code_verifier"]
        expected_challenge = session_data.get("expected_challenge")
        user_id = session_data["user_id"]
        
        # 3. PROVA MATEMÁTICA: Recalcular Challenge (Agora usando HEXADECIMAL)
        recalc_challenge = hashlib.sha256(code_verifier.encode('ascii')).hexdigest()
        
        match = (recalc_challenge == expected_challenge)
        
        print(f"--- [CALLBACK] PROVA MATEMÁTICA ---")
        print(f"Verifier Recuperado: {code_verifier}")
        print(f"Challenge Esperado:  {expected_challenge}")
        print(f"Challenge Recalc:    {recalc_challenge}")
        print(f"MATCH:               {'✅ SUCESSO' if match else '❌ FALHA'}")
        print(f"-----------------------------------")
        
        if not match:
            raise Exception("Erro Crítico: O Verifier recuperado não gera o mesmo Challenge!")

        # 4. Troca de Token
        # Removido unquote redundante - o FastAPI já entrega o code limpo
        code_clean = code 
        
        # URL limpa (sem chaves na query string)
        token_url = "https://open.tiktokapis.com/v2/oauth/token/"
        
        # Payload completo no corpo (x-www-form-urlencoded)
        payload = {
            "client_key": settings.TIKTOK_CLIENT_KEY.strip(),
            "client_secret": settings.TIKTOK_CLIENT_SECRET.strip(),
            "code": code_clean,
            "grant_type": "authorization_code",
            "redirect_uri": REDIRECT_URI_FIXED,
            "code_verifier": code_verifier,
        }
        
        headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "Cache-Control": "no-cache"
        }

        print(f"--- [CALLBACK] TOKEN EXCHANGE REQUEST ---")
        print(f"URL: {token_url}")
        print(f"Verifier Enviado: {code_verifier}")
        print(f"Code Enviado:     {code_clean[:10]}...")
        print(f"Redirect URI:     {REDIRECT_URI_FIXED}")
        print(f"-----------------------------------------")

        try:
            with httpx.Client() as client:
                response = client.post(token_url, data=payload, headers=headers)
                
                if response.status_code != 200:
                    print(f"ERRO API TIKTOK ({response.status_code}): {response.text}")
                
                response.raise_for_status()
            
            full_response = response.json()
            print(f"--- SUCESSO TIKTOK FULL RESPONSE ---")
            print(full_response)
            print(f"------------------------------------")

            token_data = full_response.get("data", full_response)
            access_token = token_data.get("access_token")
            
            if not access_token:
                raise Exception("Sucesso HTTP, mas access_token ausente no JSON.")

            # 5. Salvar no Banco
            from datetime import datetime, timedelta
            expires_in = token_data.get("expires_in", 86400)
            expires_at = datetime.now() + timedelta(seconds=expires_in)

            db_credential = db.query(Credential).filter(
                Credential.user_id == user_id, Credential.platform == self.PLATFORM
            ).first()

            if db_credential:
                db_credential.access_token = access_token
                db_credential.refresh_token = token_data.get("refresh_token")
                db_credential.expires_at = expires_at
                db_credential.scope = token_data.get("scope")
            else:
                db_credential = Credential(
                    user_id=user_id, platform=self.PLATFORM,
                    access_token=access_token, refresh_token=token_data.get("refresh_token"),
                    expires_at=expires_at, scope=token_data.get("scope")
                )
                db.add(db_credential)
            
            db.commit()
            print("DEBUG: Credenciais salvas no banco com sucesso!")
            return db_credential, session_data.get("callback_url")
        except Exception as e:
            print(f"Erro no fluxo TikTok: {e}")
            raise e

    def synchronize_posts(self, db: Session) -> dict:
        from .models import Post
        from datetime import datetime
        user_id = self.user_id 
        credential = db.query(Credential).filter(
            Credential.user_id == user_id, Credential.platform == self.PLATFORM
        ).first()
        if not credential: return {"error": "Sem credenciais."}

        # Na V2, o campo 'fields' DEVE ir na URL, mesmo sendo POST
        fields = "id,title,cover_image_url,create_time,duration,view_count,like_count,comment_count,share_count"
        url = f"https://open.tiktokapis.com/v2/video/list/?fields={fields}"
        
        headers = {
            "Authorization": f"Bearer {credential.access_token}",
            "Content-Type": "application/json"
        }
        
        all_videos = []
        cursor = 0
        has_more = True
        try:
            pages = 0
            # Aumentado limite para 100 páginas (aprox. 2000 vídeos) para pegar histórico
            while has_more and pages < 100:
                pages += 1
                payload = {
                    "cursor": cursor, 
                    "max_count": 20
                }
                with httpx.Client() as client:
                    response = client.post(url, headers=headers, json=payload)
                    
                    # --- Lógica de Retry para Token Expirado (401) ---
                    if response.status_code == 401:
                        print("DEBUG: Token expirado (401). Tentando renovar...")
                        new_cred = self.refresh_access_token(db, credential)
                        if new_cred:
                            # Atualiza headers com novo token
                            headers["Authorization"] = f"Bearer {new_cred.access_token}"
                            # Tenta novamente a mesma requisição
                            response = client.post(url, headers=headers, json=payload)
                        else:
                            print("Erro: Falha na renovação do token.")
                            break
                    # --------------------------------------------------

                    if response.status_code != 200: 
                        print(f"Erro Sync TikTok ({response.status_code}): {response.text}")
                        break
                        
                    res_json = response.json()
                    data = res_json.get("data", {})
                    # Na V2 o campo é "videos"
                    videos = data.get("videos", [])
                    
                    if not videos: 
                        print(f"DEBUG: Nenhum vídeo retornado ou fim da lista. Response: {res_json}")
                        break
                        
                    all_videos.extend(videos)
                    has_more = data.get("has_more", False)
                    cursor = data.get("cursor", 0)

            print(f"DEBUG: Total de vídeos capturados: {len(all_videos)}")
            if all_videos:
                print(f"DEBUG RAW VIDEO SAMPLE: {all_videos[0]}")
            
            count_new = 0
            for v in all_videos:
                existing = db.query(Post).filter(Post.platform_content_id == v["id"]).first()
                published_at = datetime.fromtimestamp(v["create_time"])
                metrics = {
                    "views": v.get("view_count", 0), 
                    "likes": v.get("like_count", 0),
                    "comments": v.get("comment_count", 0), 
                    "shares": v.get("share_count", 0),
                    "duration": v.get("duration", 0),
                    "saves": 0
                }
                
                if existing:
                    existing.metrics = metrics
                    existing.title = v.get("title", "Sem título")
                    # Força atualização da capa, pois o link do TikTok expira
                    existing.thumbnail_url = v.get("cover_image_url")
                else:
                    new_post = Post(
                        user_id=user_id, platform="tiktok",
                        platform_content_id=v["id"], title=v.get("title", "Sem título"),
                        published_at=published_at, metrics=metrics,
                        thumbnail_url=v.get("cover_image_url"), is_pattern=False
                    )
                    db.add(new_post)
                    count_new += 1
            
            db.commit()
            return {"status": "success", "processed": len(all_videos), "new": count_new}
        except Exception as e:
            print(f"EXCEÇÃO SYNC TIKTOK: {e}")
            return {"error": str(e)}

    def _calculate_daily_deltas(self, db: Session, user_id: int):
        from .models import Post, FollowerHistory
        from sqlalchemy import func
        from datetime import datetime, timedelta

        # 1. Calcular Acumulados de Hoje (Soma de todos os posts)
        # Nota: Assume que synchronize_posts já rodou hoje
        totals = db.query(
            func.sum(func.json_extract(Post.metrics, '$.views')).label('views'),
            func.sum(func.json_extract(Post.metrics, '$.likes')).label('likes'),
            func.sum(func.json_extract(Post.metrics, '$.comments')).label('comments'),
            func.sum(func.json_extract(Post.metrics, '$.shares')).label('shares')
        ).filter(
            Post.user_id == user_id,
            Post.platform == 'tiktok'
        ).first()

        current_acc = {
            "views": totals.views or 0,
            "likes": totals.likes or 0,
            "comments": totals.comments or 0,
            "shares": totals.shares or 0
        }

        # 2. Buscar Acumulado de Ontem (ou o mais recente)
        # Ignora o registro de hoje se já existir para pegar o anterior
        today = datetime.now().date()
        last_history = db.query(FollowerHistory).filter(
            FollowerHistory.user_id == user_id,
            FollowerHistory.platform == 'tiktok',
            FollowerHistory.date < today,
            FollowerHistory.accumulated_views > 0 # Garante que tem dados acumulados
        ).order_by(FollowerHistory.date.desc()).first()

        deltas = {
            "views": 0, "likes": 0, "comments": 0, "shares": 0
        }

        if last_history:
            deltas["views"] = max(0, current_acc["views"] - last_history.accumulated_views)
            deltas["likes"] = max(0, current_acc["likes"] - last_history.accumulated_likes)
            deltas["comments"] = max(0, current_acc["comments"] - last_history.accumulated_comments)
            deltas["shares"] = max(0, current_acc["shares"] - last_history.accumulated_shares)
            print(f"DEBUG DELTAS: Views={deltas['views']} (Hoje: {current_acc['views']} - Ontem: {last_history.accumulated_views})")
        else:
            print("DEBUG: Nenhum histórico acumulado anterior encontrado. Primeiro dia de contagem automática.")
            # Se for o primeiro dia, Deltas ficam 0 para não gerar pico absurdo

        return deltas, current_acc

    def get_audience_data(self, db: Session):
        """Busca dados de seguidores e calcula crescimento mensal de likes."""
        from datetime import datetime, timedelta
        from .models import Post
        from .models import FollowerHistory
        
        user_id = 1
        credential = db.query(Credential).filter(
            Credential.user_id == user_id, Credential.platform == self.PLATFORM
        ).first()
        if not credential: return None

        # INICIALIZANDO VARIÁVEIS DE RETORNO PARA EVITAR ERROS
        follower_count = 0
        likes_total = 0
        growth_str = "N/A"

        # 1. Dados de Totais (API V2)
        # Adicionado profile_views para tentativa de captura (se permissão existir)
        fields = "follower_count,likes_count,profile_views" 
        url = f"https://open.tiktokapis.com/v2/user/info/?fields={fields}"
        headers = {"Authorization": f"Bearer {credential.access_token}"}

        try:
            # Busca dados da API
            with httpx.Client() as client:
                resp = client.get(url, headers=headers)
                
                if resp.status_code == 200:
                    user_data = resp.json().get("data", {}).get("user", {})
                    follower_count = user_data.get("follower_count", 0)
                    likes_total = user_data.get("likes_count", 0)
                    profile_views = user_data.get("profile_views", 0)
                    
                    # --- LÓGICA DE DELTAS AUTOMÁTICOS ---
                    deltas, accumulados = self._calculate_daily_deltas(db, user_id)
                    # ------------------------------------

                    # --- LÓGICA DE SNAPSHOT DIÁRIO ---
                    today = datetime.now().date()
                    
                    history = db.query(FollowerHistory).filter(
                        FollowerHistory.user_id == user_id,
                        FollowerHistory.platform == self.PLATFORM,
                        FollowerHistory.date >= today
                    ).first()
                    
                    if not history:
                        print(f"DEBUG: Salvando snapshot de seguidores TikTok do dia {today}: {follower_count}")
                        new_history = FollowerHistory(
                            user_id=user_id,
                            platform=self.PLATFORM,
                            count=follower_count,
                            profile_views=profile_views, 
                            date=datetime.now(),
                            # Deltas Calculados
                            views=deltas["views"],
                            likes=deltas["likes"],
                            comments=deltas["comments"],
                            shares=deltas["shares"],
                            # Acumulados para amanhã
                            accumulated_views=accumulados["views"],
                            accumulated_likes=accumulados["likes"],
                            accumulated_comments=accumulados["comments"],
                            accumulated_shares=accumulados["shares"]
                        )
                        db.add(new_history)
                        db.commit()
                    else:
                        # Atualiza se já existir hoje (para garantir dado mais recente)
                        history.count = follower_count
                        history.profile_views = profile_views
                        
                        # Atualiza Deltas e Acumulados
                        history.views = deltas["views"]
                        history.likes = deltas["likes"]
                        history.comments = deltas["comments"]
                        history.shares = deltas["shares"]
                        history.accumulated_views = accumulados["views"]
                        history.accumulated_likes = accumulados["likes"]
                        history.accumulated_comments = accumulados["comments"]
                        history.accumulated_shares = accumulados["shares"]
                        
                        db.commit()
                    # ---------------------------------
                    
                    # --- CÁLCULO DE CRESCIMENTO REAL (SEGUIDORES) ---
                    thirty_days_ago = datetime.now() - timedelta(days=30)
                    old_record = db.query(FollowerHistory).filter(
                        FollowerHistory.platform == self.PLATFORM,
                        FollowerHistory.date <= thirty_days_ago
                    ).order_by(FollowerHistory.date.desc()).first()
                    
                    if old_record:
                        diff = follower_count - old_record.count
                        sign = "+" if diff >= 0 else ""
                        growth_str = f"{sign}{diff:,} este mês"
                    # -----------------------------------------------

                else:
                    print(f"Erro API TikTok: {resp.text}")
                
        except Exception as e:
            print(f"Erro Audience TikTok: {e}")
            
        return {
            "count": follower_count,
            "likes_total": likes_total,
            "growth": growth_str 
        }

    def get_video_analytics(self, db: Session, video_id: str):
        """
        Retorna métricas detalhadas do vídeo a partir do banco local.
        (Já sincronizamos tudo no video/list, não precisa chamar API de novo)
        """
        from .models import Post
        post = db.query(Post).filter(Post.platform_content_id == video_id).first()
        if not post: return {"error": "Vídeo não encontrado no banco."}

        # Usa as métricas salvas no banco
        m = post.metrics or {}
        
        return {
            "title": post.title,
            "stats": {
                "views": m.get("views", 0),
                "likes": m.get("likes", 0),
                "comments": m.get("comments", 0),
                "shares": m.get("shares", 0),
                "saves": m.get("saves", 0)
            },
            # Metricas calculadas para compatibilidade visual
            "engagement": {
                "rate": f"{((m.get('likes',0) + m.get('comments',0)) / (m.get('views',1) or 1)) * 100:.2f}%",
                "avg_view_duration": "N/A"
            },
            "retention": [] # Gráfico de retenção vazio
        }

    def refresh_access_token(self, db: Session, credential: Credential):
        print("--- [AUTH] RENOVANDO TOKEN TIKTOK ---")
        url = "https://open.tiktokapis.com/v2/oauth/token/"
        
        payload = {
            "client_key": settings.TIKTOK_CLIENT_KEY.strip(),
            "client_secret": settings.TIKTOK_CLIENT_SECRET.strip(),
            "grant_type": "refresh_token",
            "refresh_token": credential.refresh_token
        }
        
        headers = {
            "Content-Type": "application/x-www-form-urlencoded"
        }

        try:
            with httpx.Client() as client:
                response = client.post(url, data=payload, headers=headers)
                
                if response.status_code != 200:
                    print(f"ERRO REFRESH TIKTOK ({response.status_code}): {response.text}")
                    return None

                data = response.json()
                # A API pode retornar 'data' encapsulado ou direto
                token_data = data.get("data", data)
                
                new_access = token_data.get("access_token")
                new_refresh = token_data.get("refresh_token")
                
                if not new_access:
                    print(f"ERRO: Resposta de refresh sem access_token: {data}")
                    return None

                credential.access_token = new_access
                # TikTok sempre rotaciona o refresh token
                if new_refresh:
                    credential.refresh_token = new_refresh
                
                from datetime import datetime, timedelta
                expires_in = token_data.get("expires_in", 86400)
                credential.expires_at = datetime.now() + timedelta(seconds=expires_in)
                
                db.commit()
                db.refresh(credential)
                print("DEBUG: Token TikTok renovado com sucesso!")
                return credential

        except Exception as e:
            print(f"EXCEÇÃO REFRESH TIKTOK: {e}")
            return None

tiktok_service = TiktokApiService()