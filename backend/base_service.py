from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session

try:
    from .models import Credential
except ImportError:
    from models import Credential

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
    def get_authorization_url(self, user_id: int) -> str:
        """Retorna a URL para iniciar o fluxo OAuth 2.0."""
        pass

    @abstractmethod
    def fetch_and_store_token(self, *args, **kwargs) -> Credential:
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
