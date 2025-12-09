from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List
from datetime import datetime, date, timedelta

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
from .models import Credential # Import Credential from models.py
from sqlalchemy.orm import Session # Import Session directly

settings = get_settings()

class ApiService(ABC):
    """
    Classe base abstrata para serviços de API de mídia social.
    Define a interface comum para autenticação e recuperação de dados.
    """
    PLATFORM: str = ""
    SCOPES: List[str] = []

    def __init__(self, user_id: int):
        self.user_id = user_id

    @abstractmethod
    def get_authorization_url(self) -> str:
        """Retorna a URL para iniciar o fluxo OAuth 2.0."""
        pass

    @abstractmethod
    def fetch_and_store_token(self, auth_response_url: str, db: Session) -> Dict[str, Any]:
        """
        Completa o fluxo OAuth 2.0, busca o token e o armazena no banco de dados.
        Retorna os detalhes da credencial.
        """
        pass

    @abstractmethod
    def refresh_access_token(self, db: Session, credential: Credential) -> Credential:
        """
        Usa o refresh_token para obter um novo access_token se o atual estiver expirado.
        Atualiza e retorna a credencial.
        """
        pass
    
    @abstractmethod
    def get_audience_data(self, db: Session) -> Dict[str, Any]:
        """
        Recupera dados de audiência (ex: inscritos) usando a credencial armazenada.
        """
        pass

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

    def get_authorization_url(self, user_id: int) -> str:
        """
        Retorna a URL de autorização do YouTube.
        O user_id é codificado no 'state' para ser recuperado no callback.
        """
        flow = self._get_flow()
        # Incluímos o user_id no 'state' para identificá-lo após o redirecionamento
        authorization_url, state = flow.authorization_url(
            access_type='offline', # Necessário para obter um refresh_token
            include_granted_scopes='true',
            state=str(user_id) # Usamos o user_id como state
        )
        return authorization_url

    def fetch_and_store_token(self, auth_response_url: str, db: Session, user_id: int) -> Credential:
        """
        Completa o fluxo OAuth, busca o token e o armazena para o usuário.
        """
        flow = self._get_flow(state=str(user_id)) # Passa o state para o flow para que ele possa processar
        flow.fetch_token(authorization_response=auth_response_url)

        credentials = flow.credentials
        # user_id já é passado, não precisa extrair de flow.state

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
            token_uri=settings.YOUTUBE_REDIRECT_URI,
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
            token_uri=settings.YOUTUBE_REDIRECT_URI,
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
            token_uri=settings.YOUTUBE_REDIRECT_URI,
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
            return {"error": str(e)}

    def get_daily_subscriber_growth(self, db: Session, start_date: date, end_date: date) -> List[Dict[str, Any]]:
        """
        Recupera as métricas diárias de crescimento do canal usando a API do YouTube Analytics.
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
                metrics='views,likes,dislikes,comments,shares,subscribersGained,subscribersLost',
                dimensions='day'
            ).execute()

            daily_data = []
            if 'rows' in report:
                for row in report['rows']:
                    day_str, views, likes, dislikes, comments, shares, gained, lost = row
                    net_growth = gained - lost
                    daily_data.append({
                        "date": day_str,
                        "views": views,
                        "likes": likes,
                        "dislikes": dislikes,
                        "comments": comments,
                        "shares": shares,
                        "gained": gained,
                        "lost": lost,
                        "net_growth": net_growth
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
                metrics='views,likes,dislikes,comments,shares,subscribersGained,subscribersLost',
                dimensions='month'
            ).execute()

            monthly_data = []
            if 'rows' in report:
                for row in report['rows']:
                    month_str, views, likes, dislikes, comments, shares, gained, lost = row
                    net_growth = gained - lost
                    monthly_data.append({
                        "month": month_str,
                        "views": views,
                        "likes": likes,
                        "dislikes": dislikes,
                        "comments": comments,
                        "shares": shares,
                        "gained": gained,
                        "lost": lost,
                        "net_growth": net_growth
                    })
            return monthly_data
        except Exception as e:
            print(f"Erro ao buscar crescimento mensal de inscritos do YouTube: {e}")
            return []

# Mapeamento de serviços de API por plataforma
API_SERVICES: Dict[str, type[ApiService]] = {
    "youtube": YoutubeApiService
}

# Helper para obter a instância do serviço
def get_api_service(platform: str, user_id: int) -> Optional[ApiService]:
    service_class = API_SERVICES.get(platform)
    if service_class:
        return service_class(user_id)
    return None
