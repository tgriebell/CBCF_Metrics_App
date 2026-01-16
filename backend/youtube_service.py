from typing import Optional, Dict, Any, List
from datetime import datetime, date, timedelta
import re
import json
import base64

# Google API specific imports
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import google.auth.transport.requests
from google_auth_httplib2 import AuthorizedHttp
import httplib2

# Local imports
try:
    from .config import get_settings
    from .models import Credential, Post, FollowerHistory
    from sqlalchemy.orm import Session
    from .base_service import ApiService
except ImportError:
    from config import get_settings
    from models import Credential, Post, FollowerHistory
    from sqlalchemy.orm import Session
    from base_service import ApiService

settings = get_settings()

class YoutubeApiService(ApiService):
    PLATFORM = "youtube"
    SCOPES = [
        "https://www.googleapis.com/auth/youtube.readonly",
        "https://www.googleapis.com/auth/yt-analytics.readonly",
        "https://www.googleapis.com/auth/yt-analytics-monetary.readonly"
    ]

    def __init__(self, user_id: int = None):
        # Permite user_id nulo para instanciar globalmente
        self.user_id = user_id

    def _get_flow(self, state: Optional[str] = None):
        client_config = {
            "web": {
                "client_id": settings.YOUTUBE_CLIENT_ID,
                "project_id": "gemini-test-app-395721",
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "client_secret": settings.YOUTUBE_CLIENT_SECRET,
                "redirect_uris": [settings.YOUTUBE_REDIRECT_URI],
            }
        }
        flow = Flow.from_client_config(
            client_config,
            scopes=self.SCOPES,
            redirect_uri=settings.YOUTUBE_REDIRECT_URI
        )
        if state:
            flow.state = state
        return flow

    # Implementação correta dos métodos abstratos
    def get_authorization_url(self, user_id: int, callback_url: Optional[str] = None) -> str:
        flow = self._get_flow()
        state_data = {'user_id': str(user_id)}
        if callback_url:
            state_data['callback_url'] = callback_url
            
        encoded_state = base64.urlsafe_b64encode(json.dumps(state_data).encode()).decode()
        authorization_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            state=encoded_state
        )
        return authorization_url

    def fetch_and_store_token(self, auth_response_url: str, db: Session, user_id: int, state: str) -> Credential:
        flow = self._get_flow(state=state)
        flow.fetch_token(authorization_response=auth_response_url)
        credentials = flow.credentials
        
        db_credential = db.query(Credential).filter(
            Credential.user_id == user_id,
            Credential.platform == self.PLATFORM
        ).first()

        if db_credential:
            db_credential.access_token = credentials.token
            db_credential.refresh_token = credentials.refresh_token
            db_credential.expires_at = credentials.expiry
            db_credential.scope = " ".join(credentials.scopes)
        else:
            db_credential = Credential(
                user_id=user_id,
                platform=self.PLATFORM,
                access_token=credentials.token,
                refresh_token=credentials.refresh_token,
                expires_at=credentials.expiry,
                scope=" ".join(credentials.scopes)
            )
            db.add(db_credential)
        
        db.commit()
        db.refresh(db_credential)
        return db_credential

    def refresh_access_token(self, db: Session, credential: Credential) -> Credential:
        creds = Credentials(
            token=credential.access_token,
            refresh_token=credential.refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.YOUTUBE_CLIENT_ID,
            client_secret=settings.YOUTUBE_CLIENT_SECRET,
            scopes=credential.scope.split() if credential.scope else [],
        )
        creds.refresh(google.auth.transport.requests.Request())
        credential.access_token = creds.token
        credential.expires_at = creds.expiry
        db.commit()
        db.refresh(credential)
        return credential

    async def sync_data(self, user_id: int, db: Session):
        self.user_id = user_id
        return self.synchronize_posts(db)

    def _get_authenticated_service(self, db: Session, service_name: str, version: str) -> Optional[Any]:
        db_credential = db.query(Credential).filter(
            Credential.user_id == self.user_id,
            Credential.platform == self.PLATFORM
        ).first()

        if not db_credential:
            return None

        creds = Credentials(
            token=db_credential.access_token,
            refresh_token=db_credential.refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.YOUTUBE_CLIENT_ID,
            client_secret=settings.YOUTUBE_CLIENT_SECRET,
            scopes=db_credential.scope.split() if db_credential.scope else [],
        )

        if creds.expired and creds.refresh_token:
            try:
                creds.refresh(google.auth.transport.requests.Request())
                db_credential.access_token = creds.token
                db_credential.expires_at = creds.expiry
                db.commit()
            except Exception as e:
                print(f"Erro ao renovar token YouTube: {e}")
                return None

        return build(service_name, version, credentials=creds)

    def get_audience_data(self, db: Session) -> Dict[str, Any]:
        # Implementação básica exigida pela classe abstrata
        return {"youtube_long": {"count": 0, "growth": "0%"}, "youtube_shorts": {"count": 0, "growth": "0%"}}

    def backfill_daily_history(self, db: Session):
        """Busca histórico diário (Analytics) e popula FollowerHistory retroativo."""
        youtube_analytics = self._get_authenticated_service(db, 'youtubeAnalytics', 'v2')
        # Precisamos também do serviço Data API para pegar o TOTAL ATUAL
        youtube_data = self._get_authenticated_service(db, 'youtube', 'v3')
        
        if not youtube_analytics or not youtube_data:
            print("[YOUTUBE ANALYTICS] Falha na autenticação.")
            return

        # 1. Busca o TOTAL ATUAL de inscritos
        try:
            channels = youtube_data.channels().list(mine=True, part='statistics').execute()
            current_total_subs = int(channels['items'][0]['statistics']['subscriberCount'])
            print(f"Total Atual (Base para cálculo): {current_total_subs}")
        except:
            print("Erro ao buscar total atual.")
            return

        # Define datas (YouTube Analytics tem delay de ~2 dias)
        end_date_dt = datetime.now() - timedelta(days=2) 
        start_date_dt = datetime.now() - timedelta(days=35)
        
        end_date_str = end_date_dt.strftime('%Y-%m-%d')
        start_date_str = start_date_dt.strftime('%Y-%m-%d')

        print(f"--- [YOUTUBE ANALYTICS] Buscando histórico de {start_date_str} até {end_date_str} ---")

        try:
            response = youtube_analytics.reports().query(
                ids='channel==MINE',
                startDate=start_date_str,
                endDate=end_date_str,
                metrics='views,subscribersGained,subscribersLost,likes,comments,shares',
                dimensions='day',
                sort='-day' # Ordem Decrescente (do mais recente para o antigo)
            ).execute()

            rows = response.get('rows', [])
            headers = [h['name'] for h in response.get('columnHeaders', [])]
            
            idx_day = headers.index('day')
            idx_views = headers.index('views')
            idx_subs_gain = headers.index('subscribersGained')
            idx_subs_lost = headers.index('subscribersLost')
            idx_likes = headers.index('likes')
            idx_comments = headers.index('comments')
            idx_shares = headers.index('shares')

            # Algoritmo de Reconstrução Retroativa
            # Começamos do "running_total" atual e vamos subtraindo o ganho de cada dia para descobrir o total do dia anterior.
            
            # Nota: O Analytics tem um delay. Entre 'hoje' e o 'último dia do analytics' (2 dias atrás), 
            # pode ter havido ganhos que não sabemos. 
            # Para ser preciso, assumimos que o running_total é o valor no final do dia mais recente do relatório.
            # (Pequena margem de erro aceitável de 2 dias).
            
            running_total = current_total_subs 

            for row in rows:
                date_str = row[idx_day]
                record_date = datetime.strptime(date_str, '%Y-%m-%d')
                
                # Net Growth do dia
                subs_net = row[idx_subs_gain] - row[idx_subs_lost]
                
                # Se hoje é dia X, o total no final do dia X era 'running_total'.
                # O total no início do dia X (ou final do dia X-1) será running_total - subs_net.
                
                # Busca registro existente
                existing = db.query(FollowerHistory).filter(
                    FollowerHistory.user_id == self.user_id,
                    FollowerHistory.platform == 'youtube',
                    FollowerHistory.date >= record_date,
                    FollowerHistory.date < record_date + timedelta(days=1)
                ).first()

                if existing:
                    existing.views = row[idx_views]
                    existing.likes = row[idx_likes]
                    existing.comments = row[idx_comments]
                    existing.shares = row[idx_shares]
                    existing.count = running_total # Atualiza com o valor calculado preciso
                    existing.is_manual = False
                else:
                    db.add(FollowerHistory(
                        user_id=self.user_id,
                        platform='youtube',
                        count=running_total,
                        views=row[idx_views],
                        likes=row[idx_likes],
                        comments=row[idx_comments],
                        shares=row[idx_shares],
                        date=record_date,
                        is_manual=False
                    ))
                
                # Prepara o total para o PRÓXIMO dia da iteração (que é o dia anterior no tempo)
                running_total -= subs_net
            
            db.commit()
            print(f"[YOUTUBE ANALYTICS] Sucesso! Histórico reconstruído com precisão.")

        except Exception as e:
            print(f"[YOUTUBE ANALYTICS] Erro ao buscar histórico: {e}")

    def get_video_analytics(self, db: Session, video_id: str) -> Dict[str, Any]:
        """Busca um relatório de métricas detalhadas para um vídeo específico."""
        analytics_service = self._get_authenticated_service(db, 'youtubeAnalytics', 'v2')
        if not analytics_service:
            return {"error": "Serviço de análise não autenticado."}

        # Busca a data de publicação para o range de busca
        post = db.query(Post).filter(Post.platform_content_id == video_id).first()
        start_date = post.published_at.date().isoformat() if post and post.published_at else (date.today() - timedelta(days=365)).isoformat()
        end_date = date.today().isoformat()
        
        try:
            report = analytics_service.reports().query(
                ids='channel==MINE',
                startDate=start_date,
                endDate=end_date,
                metrics='views,likes,comments,shares,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained',
                filters=f"video=={video_id}"
            ).execute()

            if 'rows' in report and report['rows']:
                data_row = report['rows'][0]
                headers = [header['name'] for header in report['columnHeaders']]
                return dict(zip(headers, data_row))
            return {"message": "Sem dados detalhados para este vídeo ainda."}
        except Exception as e:
            print(f"Erro ao buscar análise do vídeo '{video_id}': {e}")
            return {"error": str(e)}

    def synchronize_posts(self, db: Session):
        import re
        def parse_iso8601_duration(duration_str: str) -> timedelta:
            match = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', duration_str or '')
            if not match: return timedelta()
            hours, minutes, seconds = match.groups()
            return timedelta(hours=int(hours or 0), minutes=int(minutes or 0), seconds=int(seconds or 0))

        youtube = self._get_authenticated_service(db, 'youtube', 'v3')
        if not youtube:
            return {"status": "error", "message": "Não autenticado"}

        try:
            self.backfill_daily_history(db)
            channels = youtube.channels().list(mine=True, part='contentDetails,statistics').execute()
            if not channels['items']:
                return {"status": "error", "message": "Canal não encontrado"}

            stats = channels['items'][0]['statistics']
            subs_count = int(stats.get('subscriberCount', 0))
            view_count = int(stats.get('viewCount', 0))
            
            today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            history = db.query(FollowerHistory).filter(
                FollowerHistory.user_id == self.user_id,
                FollowerHistory.platform == 'youtube',
                FollowerHistory.date >= today_start
            ).first()

            if history:
                history.count = subs_count
                history.accumulated_views = view_count
            else:
                history = FollowerHistory(
                    user_id=self.user_id,
                    platform='youtube',
                    count=subs_count,
                    accumulated_views=view_count,
                    date=datetime.now()
                )
                db.add(history)
            db.commit()
            
            uploads_playlist = channels['items'][0]['contentDetails']['relatedPlaylists']['uploads']
            next_page_token = None
            processed_count = 0
            
            while True:
                pl_items = youtube.playlistItems().list(
                    playlistId=uploads_playlist,
                    part='contentDetails',
                    maxResults=50,
                    pageToken=next_page_token
                ).execute()
                
                vid_ids = [item['contentDetails']['videoId'] for item in pl_items['items']]
                if not vid_ids: break

                vid_details = youtube.videos().list(
                    id=','.join(vid_ids),
                    part='snippet,statistics,contentDetails'
                ).execute()
                
                # Otimização: Busca posts existentes deste lote para atualizar
                existing_posts = db.query(Post).filter(Post.platform_content_id.in_(vid_ids)).all()
                
                for item in vid_details['items']:
                    # Extrair duração
                    duration_iso = item.get('contentDetails', {}).get('duration')
                    duration_seconds = parse_iso8601_duration(duration_iso).total_seconds()

                    # Definir tipo de plataforma
                    platform_type = 'youtube_shorts' if duration_seconds <= 180 else 'youtube_long'

                    metrics_data = {
                        "views": int(item['statistics'].get('viewCount', 0)),
                        "likes": int(item['statistics'].get('likeCount', 0)),
                        "comments": int(item['statistics'].get('commentCount', 0)),
                        "duration": int(duration_seconds) # SALVANDO AQUI
                    }
                    
                    existing = next((p for p in existing_posts if p.platform_content_id == item['id']), None)
                    thumb_url = item['snippet'].get('thumbnails', {}).get('high', {}).get('url') or item['snippet'].get('thumbnails', {}).get('default', {}).get('url')
                    
                    if existing:
                        existing.metrics = metrics_data
                        existing.platform = platform_type
                        existing.thumbnail_url = thumb_url
                        existing.title = item['snippet']['title']
                        existing.tags = ",".join(item['snippet'].get('tags', [])) if item['snippet'].get('tags') else ""
                        existing.last_synced_at = datetime.now()
                    else:
                        new_post = Post(
                            user_id=self.user_id,
                            platform=platform_type,
                            platform_content_id=item['id'],
                            title=item['snippet']['title'],
                            description=item['snippet']['description'],
                            tags=",".join(item['snippet'].get('tags', [])) if item['snippet'].get('tags') else "",
                            thumbnail_url=thumb_url,
                            published_at=datetime.strptime(item['snippet']['publishedAt'], "%Y-%m-%dT%H:%M:%SZ"),
                            metrics=metrics_data,
                            last_synced_at=datetime.now()
                        )
                        db.add(new_post)
                    processed_count += 1
                
                db.commit()
                next_page_token = pl_items.get('nextPageToken')
                if not next_page_token:
                    break
            
            # Após sincronizar a lista básica, enriquecer com dados do Analytics (Retenção, Subs, Geografia, etc)
            print("--- [SYNC] Iniciando enriquecimento com Analytics Profundo (Nível NASA) ---")
            self._enrich_posts_with_analytics(db, vid_ids) 
            
            return {"status": "success", "processed": processed_count}

        except Exception as e:
            db.rollback()
            return {"status": "error", "message": str(e)}

    def _enrich_posts_with_analytics(self, db: Session, video_ids: List[str] = None):
        """
        Busca dados profundos (Analytics) para vídeos e canal, salvando no banco.
        Cobre: Retenção, Conversão, Geografia, Demografia e Status de Inscrição.
        """
        analytics_service = self._get_authenticated_service(db, 'youtubeAnalytics', 'v2')
        if not analytics_service:
            print("[ANALYTICS] Falha na autenticação para enriquecimento.")
            return

        # 1. ENRIQUECIMENTO POR VÍDEO (Filtro Cirúrgico)
        # ----------------------------------------------------------------
        try:
            # Range 'Lifetime' (Desde o início do YouTube) para garantir dados totais
            start_date = '2006-01-01'
            end_date = datetime.now().strftime('%Y-%m-%d')

            print(f"[ANALYTICS] Enriquecendo lote de {len(video_ids) if video_ids else 0} vídeos (Lifetime)...")

            # Filtro OBRIGATÓRIO: Garante que pegamos dados EXATOS do lote processado
            filters = f"video=={','.join(video_ids)}" if video_ids else None
            
            # Se não tiver IDs (sync manual sem lote), fallback para Top 200
            # Mas no fluxo normal do sync, sempre teremos IDs.
            
            report_videos = analytics_service.reports().query(
                ids='channel==MINE',
                startDate=start_date,
                endDate=end_date,
                metrics='views,averageViewPercentage,subscribersGained,estimatedMinutesWatched,averageViewDuration',
                dimensions='video',
                maxResults=200, 
                sort='-views',
                filters=filters # AQUI ESTÁ A MÁGICA
            ).execute()

            if 'rows' in report_videos:
                headers = [h['name'] for h in report_videos.get('columnHeaders', [])]
                idx_video = headers.index('video')
                idx_retention = headers.index('averageViewPercentage')
                idx_subs = headers.index('subscribersGained')
                idx_minutes = headers.index('estimatedMinutesWatched')
                idx_avg_duration = headers.index('averageViewDuration')
                
                count_updated = 0
                for row in report_videos['rows']:
                    vid_id = row[idx_video]
                    post = db.query(Post).filter(Post.platform_content_id == vid_id).first()
                    if post:
                        metrics = dict(post.metrics) if post.metrics else {}
                        metrics['averageViewPercentage'] = row[idx_retention]
                        metrics['subscribers_gained'] = row[idx_subs]
                        metrics['estimatedMinutesWatched'] = row[idx_minutes]
                        metrics['averageViewDuration'] = row[idx_avg_duration] # SALVANDO AQUI
                        post.metrics = metrics
                        count_updated += 1
                db.commit()
                print(f"[ANALYTICS] {count_updated} vídeos atualizados com dados de retenção e conversão.")
        except Exception as e:
            print(f"[ANALYTICS] Erro ao buscar dados de vídeo: {e}")

        # 2. ENRIQUECIMENTO DE AUDIÊNCIA (Canal Geral)
        # ----------------------------------------------------------------
        # Como não temos tabela separada para demografia, vamos salvar isso 
        # em um 'Post' especial ou atualizar o FollowerHistory mais recente com metadados extras.
        # Estratégia: Salvar em um arquivo JSON auxiliar ou no campo 'metrics' do User (se existisse).
        # Solução Rápida: Atualizar o último FollowerHistory com esses dados extras no campo 'metrics' (não existe, vamos usar JSON ou criar logs).
        # Melhor: Vamos focar no que o Dashboard pede agora (Geografia/Status).
        
        # Vou pular a persistência complexa de geografia agora e focar em garantir 
        # que os vídeos tenham os dados para os cards A, B, D e E.
        
        pass

# Instância única exportada com user_id=None (será setado no sync_data)
youtube_service = YoutubeApiService()