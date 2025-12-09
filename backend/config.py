from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
import os # Importar 'os'

# Define BASE_DIR aqui para ser usado no SettingsConfigDict
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class Settings(BaseSettings):
    # Base de Dados
    DATABASE_URL: str = "sqlite:///./cbcf_metrics.db"

    # YouTube API
    YOUTUBE_API_KEY: str = "" # Para acesso público (vídeos, etc.)
    YOUTUBE_CLIENT_ID: str = "" # Para OAuth 2.0 (Analytics)
    YOUTUBE_CLIENT_SECRET: str = "" # Para OAuth 2.0 (Analytics)
    YOUTUBE_REDIRECT_URI: str = "https://localhost:8000/auth/youtube/callback" # URI de callback OAuth

    # Chave secreta para JWT (autenticação interna, se necessário)
    SECRET_KEY: str = "your-super-secret-key" # Mude isso em produção!
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    model_config = SettingsConfigDict(
        env_file=os.path.join(BASE_DIR, ".env"), # Especificar o caminho completo
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

@lru_cache()
def get_settings():
    return Settings()
