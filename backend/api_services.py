from typing import Optional, Dict, Any, List
from datetime import datetime, date, timedelta
import re

# Google API specific imports
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import google.auth.transport.requests
from google_auth_httplib2 import AuthorizedHttp
import httplib2
import certifi

# Local imports
from .config import get_settings
from .models import Credential, Post # Import Credential from models.py
from sqlalchemy.orm import Session # Import Session directly
from .tiktok_service import TiktokApiService # Importa o novo serviço
from .base_service import ApiService

settings = get_settings()

settings = get_settings()

import base64
import json

# ... (other imports)

class YoutubeApiService(ApiService):
    PLATFORM = "youtube"
    # Escopos para YouTube Analytics API (somente leitura de relatórios)
    SCOPES = [
        "https://www.googleapis.com/auth/youtube.readonly",
        "https://www.googleapis.com/auth/yt-analytics.readonly",
        "https://www.googleapis.com/auth/yt-analytics-monetary.readonly"
    ]

    def _get_flow(self, state: Optional[str] = None):
        """Helper para criar o objeto OAuth Flow."""
        client_config = {
            "web": { # Ou "installed" para apps de desktop, mas a Flow.from_client_config espera "web" ou "installed"
                "client_id": settings.YOUTUBE_CLIENT_ID,
                "project_id": "gemini-test-app-395721", # Este pode ser um placeholder ou vir das settings
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
            flow.state = state # Restaurar o estado se for um callback
        return flow
    
    @staticmethod
    def get_public_video_stats(video_url: str) -> Dict[str, Any]:
        """
        Busca estatísticas públicas de um vídeo do YouTube usando a API Key.
        """
        from .utils import get_video_id_from_url # Importa o helper do novo módulo utils
        video_id = get_video_id_from_url(video_url)
        if not video_id:
            return {}

        try:
            youtube_data_service = build('youtube', 'v3', developerKey=settings.YOUTUBE_API_KEY)
            request = youtube_data_service.videos().list(part="statistics", id=video_id)
            response = request.execute()
            
            if not response['items']:
                return {}

            stats = response['items'][0]['statistics']
            return {
                "views": int(stats.get('viewCount', 0)),
                "likes": int(stats.get('likeCount', 0)),
                "comments": int(stats.get('commentCount', 0)),
                "last_updated": datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Erro ao buscar estatísticas públicas do vídeo: {e}")
            return {}

    def get_authorization_url(self, user_id: int, callback_url: Optional[str] = None) -> str:
        """
        Retorna a URL de autorização do YouTube.
        O user_id e o callback_url opcional são codificados no 'state'.
        """
        flow = self._get_flow()
        
        state_data = {'user_id': str(user_id)}
        if callback_url:
            state_data['callback_url'] = callback_url
        
        encoded_state = base64.urlsafe_b64encode(json.dumps(state_data).encode()).decode()

        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            state=encoded_state
        )
        return authorization_url

    def fetch_and_store_token(self, auth_response_url: str, db: Session, user_id: int, state: str) -> Credential:
        """
        Completa o fluxo OAuth, busca o token e o armazena para o usuário.
        """
        flow = self._get_flow(state=state)
        flow.fetch_token(authorization_response=auth_response_url)

        credentials = flow.credentials
        
        # Armazenar credenciais no banco de dados
        credential_data = {
            "token": credentials.token,
            "refresh_token": credentials.refresh_token,
            "token_uri": credentials.token_uri,
            "client_id": credentials.client_id,
            "client_secret": credentials.client_secret,
            "scopes": credentials.scopes,
            "expiry": credentials.expiry.isoformat() if credentials.expiry else None
        }

        # Atualiza ou cria a credencial para o usuário e plataforma
        db_credential = db.query(Credential).filter(
            Credential.user_id == user_id,
            Credential.platform == self.PLATFORM
        ).first()

        if db_credential:
            db_credential.access_token = credential_data["token"]
            db_credential.refresh_token = credential_data["refresh_token"]
            db_credential.expires_at = credentials.expiry
            db_credential.scope = " ".join(credentials.scopes)
        else:
            db_credential = Credential(
                user_id=user_id,
                platform=self.PLATFORM,
                access_token=credential_data["token"],
                refresh_token=credential_data["refresh_token"],
                expires_at=credentials.expiry,
                scope=" ".join(credentials.scopes)
            )
            db.add(db_credential)
        
        db.commit()
        db.refresh(db_credential)
        return db_credential
    
    def refresh_access_token(self, db: Session, credential: Credential) -> Credential:
        """
        Usa o refresh_token para obter um novo access_token se o atual estiver expirado.
        """
        creds = Credentials(
            token=credential.access_token,
            refresh_token=credential.refresh_token,
            token_uri="https://oauth2.googleapis.com/token",  # CORREÇÃO
            client_id=settings.YOUTUBE_CLIENT_ID,
            client_secret=settings.YOUTUBE_CLIENT_SECRET,
            scopes=credential.scope.split() if credential.scope else [],
        )

        try:
            creds.refresh(google.auth.transport.requests.Request())
            # Atualiza o token no DB
            credential.access_token = creds.token
            credential.expires_at = creds.expiry
            db.commit()
            db.refresh(credential)
            return credential
        except Exception as e:
            print(f"Erro ao atualizar token do YouTube: {e}")
            # Em caso de falha, pode ser necessário re-autenticar.
            # Por enquanto, apenas relançamos a exceção ou retornamos a credencial antiga.
            raise e
    
    def _get_authenticated_analytics_service(self, db: Session) -> Optional[Any]:
        """
        Obtém um objeto de serviço autenticado para fazer chamadas à API YouTube Analytics.
        Gerencia o refresh do token e desabilita a verificação SSL (workaround de dev).
        """
        db_credential = db.query(Credential).filter(
            Credential.user_id == self.user_id,
            Credential.platform == self.PLATFORM
        ).first()

        if not db_credential:
            return None

        if db_credential.expires_at and db_credential.expires_at < datetime.now():
            try:
                db_credential = self.refresh_access_token(db, db_credential)
            except Exception as e:
                return None

        creds = Credentials(
            token=db_credential.access_token,
            refresh_token=db_credential.refresh_token,
            token_uri="https://oauth2.googleapis.com/token",  # CORREÇÃO
            client_id=settings.YOUTUBE_CLIENT_ID,
            client_secret=settings.YOUTUBE_CLIENT_SECRET,
            scopes=db_credential.scope.split() if db_credential.scope else [],
        )

        http = httplib2.Http(disable_ssl_certificate_validation=True)
        authed_http = AuthorizedHttp(creds, http=http)
        return build('youtubeAnalytics', 'v2', http=authed_http)

    def _get_authenticated_data_service(self, db: Session) -> Optional[Any]:
        """
        Obtém um objeto de serviço autenticado para fazer chamadas à API YouTube Data v3.
        Gerencia o refresh do token e desabilita a verificação SSL (workaround de dev).
        """
        db_credential = db.query(Credential).filter(
            Credential.user_id == self.user_id,
            Credential.platform == self.PLATFORM
        ).first()

        if not db_credential:
            return None

        if db_credential.expires_at and db_credential.expires_at < datetime.now():
            try:
                db_credential = self.refresh_access_token(db, db_credential)
            except Exception as e:
                return None

        creds = Credentials(
            token=db_credential.access_token,
            refresh_token=db_credential.refresh_token,
            token_uri="https://oauth2.googleapis.com/token",  # CORREÇÃO
            client_id=settings.YOUTUBE_CLIENT_ID,
            client_secret=settings.YOUTUBE_CLIENT_SECRET,
            scopes=db_credential.scope.split() if db_credential.scope else [],
        )

        http = httplib2.Http(disable_ssl_certificate_validation=True)
        authed_http = AuthorizedHttp(creds, http=http)
        return build('youtube', 'v3', http=authed_http)

    def _get_channel_id(self, db: Session) -> Optional[str]:
        """
        Obtém o ID do canal do usuário autenticado.
        """
        youtube_data_service = self._get_authenticated_data_service(db)
        if not youtube_data_service:
            return None
        try:
            channels_response = youtube_data_service.channels().list(
                mine=True,
                part='id'
            ).execute()
            if channels_response['items']:
                return channels_response['items'][0]['id']
            return None
        except Exception as e:
            print(f"Erro ao obter ID do canal do YouTube: {e}")
            return None

    def get_audience_data(self, db: Session) -> Dict[str, Any]:
        """
        Recupera dados de audiência (ex: inscritos totais e crescimento) do YouTube Data API v3 e Analytics API v2.
        Calcula o crescimento percentual de inscritos nos últimos 30 dias.
        """
        youtube_data_service = self._get_authenticated_data_service(db)
        youtube_analytics_service = self._get_authenticated_analytics_service(db)
        channel_id = self._get_channel_id(db)

        if not youtube_data_service or not youtube_analytics_service or not channel_id:
            return {"error": "YouTube não autenticado ou token expirado."}

        try:
            # 1. Obter contagem atual de inscritos (YouTube Data API v3)
            channels_response = youtube_data_service.channels().list(
                mine=True,
                part='statistics'
            ).execute()

            if not channels_response['items']:
                return {"error": "Nenhum canal associado à conta autenticada."}
            
            current_subscriber_count = int(channels_response['items'][0]['statistics']['subscriberCount'])

            # 2. Estimar contagem de inscritos de 30 dias atrás (YouTube Analytics API v2)
            # Para isso, somamos as mudanças líquidas nos últimos 30 dias
            end_date = date.today()
            start_date = end_date - timedelta(days=29) # 30 dias no total

            analytics_report = youtube_analytics_service.reports().query(
                ids=f'channel=={channel_id}',
                startDate=start_date.isoformat(),
                endDate=end_date.isoformat(),
                metrics='subscribersGained,subscribersLost',
                dimensions='day'
            ).execute()
            
            net_change_last_30_days = 0
            if 'rows' in analytics_report:
                for row in analytics_report['rows']:
                    # row: ['2023-01-01', subscribersGained, subscribersLost]
                    net_change_last_30_days += (row[1] - row[2]) # Gained - Lost

            # A contagem 30 dias atrás é a contagem atual menos a mudança líquida dos últimos 30 dias
            # CUIDADO: Esta é uma ESTIMATIVA. A API não fornece "total de inscritos em data X".
            # Para precisão absoluta, precisaríamos armazenar snapshots diários.
            subscriber_count_30_days_ago = current_subscriber_count - net_change_last_30_days

            growth_percentage = 0
            if subscriber_count_30_days_ago > 0:
                growth_percentage = ((current_subscriber_count - subscriber_count_30_days_ago) / subscriber_count_30_days_ago) * 100
            elif current_subscriber_count > 0: # Se antes era 0 e agora não, crescimento infinito (ou alto)
                growth_percentage = 1000 # Valor arbitrário alto para indicar grande crescimento de 0

            return {
                "youtube_long": {
                    "count": current_subscriber_count,
                    "growth": f"{growth_percentage:.2f}%" if growth_percentage != 0 else "0.00%"
                },
                "youtube_shorts": {"count": "N/A", "growth": "N/A"} # Shorts ainda não separado
            }

        except Exception as e:
            print(f"Erro ao buscar dados de audiência do YouTube: {e}")
            # Retorna uma estrutura de dados padrão em caso de erro, para evitar que o frontend quebre
            return {
                "youtube_long": {"count": 0, "growth": "0.00%"},
                "youtube_shorts": {"count": 0, "growth": "0.00%"}
            }

    def get_daily_subscriber_growth(self, db: Session, start_date: date, end_date: date) -> List[Dict[str, Any]]:
        """
        Recupera as métricas diárias de crescimento do canal usando a API do YouTube Analytics.
        Agora inclui TEMPO ASSISTIDO e DURAÇÃO MÉDIA.
        """
        analytics_service = self._get_authenticated_analytics_service(db)
        channel_id = self._get_channel_id(db)
        if not analytics_service or not channel_id:
            return []

        try:
            report = analytics_service.reports().query(
                ids=f'channel=={channel_id}',
                startDate=start_date.isoformat(),
                endDate=end_date.isoformat(),
                metrics='views,likes,dislikes,comments,shares,subscribersGained,subscribersLost,videosAddedToPlaylists,estimatedMinutesWatched,averageViewDuration',
                dimensions='day'
            ).execute()

            daily_data = []
            if 'rows' in report:
                for row in report['rows']:
                    # Mapeamento expandido
                    day_str, views, likes, dislikes, comments, shares, gained, lost, playlist_adds, minutes_watched, avg_duration = row
                    
                    net_growth = gained - lost
                    daily_data.append({
                        "date": day_str,
                        "views": views,
                        "likes": likes,
                        "dislikes": dislikes,
                        "comments": comments,
                        "shares": shares,
                        "saves": playlist_adds,
                        "gained": gained,
                        "lost": lost,
                        "net_growth": net_growth,
                        "minutes_watched": minutes_watched,
                        "avg_view_duration": avg_duration # Segundos
                    })
            return daily_data
        except Exception as e:
            print(f"Erro ao buscar crescimento diário de inscritos do YouTube: {e}")
            return []

    def get_monthly_subscriber_growth(self, db: Session, start_date: date, end_date: date) -> List[Dict[str, Any]]:
        """
        Recupera as métricas mensais de crescimento do canal usando a API do YouTube Analytics.
        """
        analytics_service = self._get_authenticated_analytics_service(db)
        channel_id = self._get_channel_id(db)
        if not analytics_service or not channel_id:
            return []

        try:
            report = analytics_service.reports().query(
                ids=f'channel=={channel_id}',
                startDate=start_date.isoformat(),
                endDate=end_date.isoformat(),
                metrics='views,likes,dislikes,comments,shares,subscribersGained,subscribersLost,videosAddedToPlaylists,estimatedMinutesWatched,averageViewDuration',
                dimensions='month'
            ).execute()

            monthly_data = []
            if 'rows' in report:
                for row in report['rows']:
                    month_str, views, likes, dislikes, comments, shares, gained, lost, playlist_adds, minutes_watched, avg_duration = row
                    net_growth = gained - lost
                    monthly_data.append({
                        "month": month_str,
                        "views": views,
                        "likes": likes,
                        "dislikes": dislikes,
                        "comments": comments,
                        "shares": shares,
                        "saves": playlist_adds,
                        "gained": gained,
                        "lost": lost,
                        "net_growth": net_growth,
                        "minutes_watched": minutes_watched,
                        "avg_view_duration": avg_duration
                    })
            return monthly_data
        except Exception as e:
            print(f"Erro ao buscar crescimento mensal de inscritos do YouTube: {e}")
            return []

    def get_video_analytics(self, db: Session, video_id: str) -> Dict[str, Any]:
        """
        Busca um relatório de métricas detalhadas para um vídeo específico.
        """
        analytics_service = self._get_authenticated_analytics_service(db)
        if not analytics_service:
            return {"error": "Serviço de análise não autenticado."}

        # Busca a data de publicação do vídeo para usar como data de início
        post = db.query(Post).filter(Post.platform_content_id == video_id).first()
        if not post or not post.published_at:
            start_date = (date.today() - timedelta(days=365*5)).isoformat() # Usa uma data antiga como padrão
        else:
            start_date = post.published_at.date().isoformat()

        end_date = date.today().isoformat()
        
        try:
            report = analytics_service.reports().query(
                ids=f'channel=={self._get_channel_id(db)}',
                startDate=start_date,
                endDate=end_date,
                metrics='views,likes,dislikes,comments,shares,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained,subscribersLost',
                filters=f"video=={video_id}"
            ).execute()

            if 'rows' in report and report['rows']:
                # As métricas de vídeo único vêm em uma única linha
                data_row = report['rows'][0]
                headers = [header['name'] for header in report['columnHeaders']]
                return dict(zip(headers, data_row))
            else:
                return {"message": "Nenhum dado de análise encontrado para este vídeo no período."}

        except Exception as e:
            print(f"Erro ao buscar análise do vídeo '{video_id}': {e}")
            return {"error": str(e)}

    def synchronize_posts(self, db: Session):
        """
        Busca todos os vídeos do canal do usuário, os classifica como 'long' ou 'shorts'
        baseado na duração, e os salva/atualiza no banco de dados.
        """
        import re
        from datetime import timedelta

        def parse_iso8601_duration(duration_str: str) -> timedelta:
            """Analisa uma string de duração ISO 8601 (ex: PT1M5S) para um objeto timedelta."""
            match = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', duration_str or '')
            if not match:
                return timedelta()
            hours, minutes, seconds = match.groups()
            return timedelta(
                hours=int(hours) if hours else 0,
                minutes=int(minutes) if minutes else 0,
                seconds=int(seconds) if seconds else 0
            )

        youtube_data_service = self._get_authenticated_data_service(db)
        if not youtube_data_service:
            return {"error": "Falha na autenticação com o YouTube."}

        try:
            channels_response = youtube_data_service.channels().list(mine=True, part='contentDetails').execute()
            if not channels_response.get('items'):
                return {"error": "Nenhum canal do YouTube encontrado."}
            uploads_playlist_id = channels_response['items'][0]['contentDetails']['relatedPlaylists']['uploads']
            print(f"DEBUG: ID da playlist de uploads obtido: {uploads_playlist_id}")
        except Exception as e:
            print(f"DEBUG: Erro ao buscar o canal do YouTube: {e}")
            return {"error": str(e)}

        all_video_ids = []
        next_page_token = None
        while True:
            try:
                playlist_response = youtube_data_service.playlistItems().list(
                    playlistId=uploads_playlist_id,
                    part='contentDetails',
                    maxResults=50,
                    pageToken=next_page_token
                ).execute()
                new_video_ids = [item['contentDetails']['videoId'] for item in playlist_response.get('items', [])]
                all_video_ids.extend(new_video_ids)
                next_page_token = playlist_response.get('nextPageToken')
                if not next_page_token:
                    break
            except Exception as e:
                return {"error": str(e)}
        
        updated_count = 0
        created_count = 0
        for i in range(0, len(all_video_ids), 50):
            batch_ids = all_video_ids[i:i+50]
            try:
                # Busca de detalhes, estatísticas, e player (para dimensões)
                videos_response = youtube_data_service.videos().list(
                    part="snippet,contentDetails,statistics,player",
                    id=",".join(batch_ids)
                ).execute()
                
                # Busca de inscritos ganhos (Analytics API)
                analytics_service = self._get_authenticated_analytics_service(db)
                subscribers_gained_map = {}
                if analytics_service:
                    try:
                        start_date_analytics = '2005-02-14'
                        end_date_analytics = datetime.now().strftime('%Y-%m-%d')
                        
                        analytics_response = analytics_service.reports().query(
                            ids=f'channel=={channels_response["items"][0]["id"]}',
                            startDate=start_date_analytics,
                            endDate=end_date_analytics,
                            metrics='subscribersGained',
                            dimensions='video',
                            filters=f"video=={','.join(batch_ids)}"
                        ).execute()

                        if 'rows' in analytics_response:
                            for row in analytics_response['rows']:
                                video_id_from_analytics, subscribers_gained = row
                                subscribers_gained_map[video_id_from_analytics] = subscribers_gained
                    except Exception as e:
                        print(f"Alerta: Não foi possível buscar 'subscribersGained' do Analytics API para o lote: {e}")

                for video_item in videos_response.get('items', []):
                    video_id = video_item['id']
                    
                    # --- NOVA LÓGICA DE CLASSIFICAÇÃO (SOMENTE PELA DURAÇÃO) ---
                    platform_type = "youtube_long" # Padrão
                    duration_iso = video_item.get('contentDetails', {}).get('duration')
                    duration_seconds = parse_iso8601_duration(duration_iso).total_seconds()

                    # Se a duração for maior que 3 minutos (180 segundos), é longo.
                    # Caso contrário (3 minutos ou menos), é um Short.
                    if duration_seconds > 180:
                        platform_type = "youtube_long"
                    else:
                        platform_type = "youtube_shorts"
                    # --- FIM DA NOVA LÓGICA ---

                    stats = video_item.get('statistics', {})
                    metrics = {
                        "views": int(stats.get('viewCount', 0)),
                        "likes": int(stats.get('likeCount', 0)),
                        "comments": int(stats.get('commentCount', 0)),
                        "subscribers_gained": int(subscribers_gained_map.get(video_id, 0)),
                        "last_updated": datetime.now().isoformat()
                    }

                    existing_post = db.query(Post).filter_by(user_id=self.user_id, platform_content_id=video_id).first()

                    # Lógica robusta para extração de Thumbnail (MaxRes -> Standard -> High -> Medium -> Default)
                    thumbs = video_item['snippet'].get('thumbnails', {})
                    thumb_url = (
                        thumbs.get('maxres', {}).get('url') or 
                        thumbs.get('standard', {}).get('url') or 
                        thumbs.get('high', {}).get('url') or 
                        thumbs.get('medium', {}).get('url') or 
                        thumbs.get('default', {}).get('url')
                    )

                    if existing_post:
                        existing_post.metrics = metrics
                        existing_post.last_synced_at = datetime.now()
                        existing_post.platform = platform_type
                        existing_post.thumbnail_url = thumb_url # Força atualização da thumbnail
                        existing_post.title = video_item['snippet']['title'] # Força atualização do título
                        updated_count += 1
                        try:
                            db.commit()
                        except Exception as e:
                            db.rollback()
                            print(f"Erro ao comitar atualização do post {video_id}: {e}")
                    else:
                        new_post = Post(
                            user_id=self.user_id,
                            platform=platform_type,
                            platform_id=video_item['snippet']['channelId'],
                            platform_content_id=video_id,
                            title=video_item['snippet']['title'],
                            description=video_item['snippet']['description'],
                            published_at=datetime.strptime(video_item['snippet']['publishedAt'], '%Y-%m-%dT%H:%M:%SZ'),
                            thumbnail_url=thumb_url,
                            metrics=metrics,
                            last_synced_at=datetime.now()
                        )
                        db.add(new_post)
                        created_count += 1
                        try:
                            db.commit()
                        except Exception as e:
                            db.rollback()
                            # Se falhou ao inserir, provavelmente já existe (concorrência). Tenta atualizar.
                            print(f"Erro de concorrência ao inserir post {video_id} (tentando recuperar e atualizar): {e}")
                            try:
                                retry_post = db.query(Post).filter_by(user_id=self.user_id, platform_content_id=video_id).first()
                                if retry_post:
                                    retry_post.metrics = metrics
                                    retry_post.last_synced_at = datetime.now()
                                    db.commit()
                                    updated_count += 1
                                    created_count -= 1 # Corrige a contagem pois foi update, não create
                            except Exception as retry_error:
                                print(f"Falha definitiva ao salvar post {video_id}: {retry_error}")

            except Exception as e:
                print(f"Erro ao processar lote de vídeos {batch_ids}: {e}")

        return {"status": "success", "processed_videos": updated_count + created_count, "new_videos": created_count, "updated_videos": updated_count}




# Mapeamento de serviços de API por plataforma
API_SERVICES: Dict[str, type[ApiService]] = {
    "youtube": YoutubeApiService,
    "tiktok": TiktokApiService
}

# Helper para obter a instância do serviço
def get_api_service(platform: str, user_id: int) -> Optional[ApiService]:
    service_class = API_SERVICES.get(platform)
    if service_class:
        return service_class(user_id)
    return None
