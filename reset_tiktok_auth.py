from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.models import Credential, Base

# Configuração do Banco
DATABASE_URL = "sqlite:///./cbcf_metrics.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

try:
    # Busca e deleta credenciais do TikTok
    creds = db.query(Credential).filter(Credential.platform == "tiktok").all()
    
    if creds:
        count = len(creds)
        for cred in creds:
            db.delete(cred)
        db.commit()
        print(f"SUCESSO: {count} credencial(is) do TikTok removida(s). O status deve voltar para 'Desconectado'.")
    else:
        print("AVISO: Nenhuma credencial do TikTok encontrada no banco.")

except Exception as e:
    print(f"ERRO: {e}")
finally:
    db.close()
