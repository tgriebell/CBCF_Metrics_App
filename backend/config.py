from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
import os # Importar 'os'
import sys

# Define BASE_DIR compatível com PyInstaller
def get_base_path():
    if hasattr(sys, '_MEIPASS'):
        return sys._MEIPASS
    return os.path.dirname(os.path.abspath(__file__))

BASE_DIR = get_base_path()

class Settings(BaseSettings):
    # Base de Dados
    DATABASE_URL: str = "sqlite:///./cbcf_metrics.db"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Se estiver rodando como executável (PyInstaller), forçar caminho gravável no APPDATA
        if getattr(sys, 'frozen', False):
            app_data = os.getenv('APPDATA')
            if app_data:
                db_dir = os.path.join(app_data, 'CBCF_Metrics')
                os.makedirs(db_dir, exist_ok=True)
                self.DATABASE_URL = f"sqlite:///{os.path.join(db_dir, 'cbcf_metrics.db')}"

    # === Configurações da API ===
    # Esta seção define as chaves e credenciais para as diversas APIs utilizadas.
    # O plano agora é utilizar a Google AI Gemini API (GEMINI_API_KEY) para todas as funcionalidades de IA.

    # Configuração da Google AI Gemini API (para conversação geral de IA e Análise de Dados AI)
    # Esta chave funcionará para ambas as fases da IA, sem depender de uma conta de faturamento do Google Cloud.
    GEMINI_API_KEY: str
    GEMINI_CLIENTE_ID: str # Mantido para OAuth, se necessário para Gemini API (menos comum)
    GEMINI_GEMINI_CLIENT_SECRET: str # Mantido para OAuth
    GEMINI_REDIRECT_URI: str = "https://localhost:8000/auth/gemini/callback" # Mantido para OAuth

    # YouTube API
    YOUTUBE_API_KEY: str = "" # Para acesso público (vídeos, etc.)
    YOUTUBE_CLIENT_ID: str = "" # Para OAuth 2.0 (Analytics)
    YOUTUBE_CLIENT_SECRET: str = "" # Para OAuth 2.0 (Analytics)
    YOUTUBE_REDIRECT_URI: str = "https://localhost:8000/auth/youtube/callback" # URI de callback OAuth

    # TikTok API
    TIKTOK_CLIENT_KEY: str = "awf2nagrtfxbaj2m"
    TIKTOK_CLIENT_SECRET: str = "CSKIHOwMMPKqXMWscchHhBgJFhdC55Ax"
    TIKTOK_REDIRECT_URI: str = "https://127.0.0.1:8000/auth/tiktok/callback"

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
