from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.models import Post
from datetime import datetime

# Conecta ao banco
SQLALCHEMY_DATABASE_URL = "sqlite:///./cbcf_metrics.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

print(f"--- DIAGNÓSTICO DE POSTS (YOUTUBE) ---")
print(f"Horário do Sistema (Local): {datetime.now()}")
print("-" * 60)

# Busca os últimos 10 posts do YouTube
posts = db.query(Post).filter(Post.platform.like('%youtube%')).order_by(Post.published_at.desc()).limit(10).all()

if not posts:
    print("Nenhum post do YouTube encontrado no banco.")
else:
    for p in posts:
        print(f"ID: {p.id} | Plataforma: {p.platform}")
        print(f"Título: {p.title}")
        print(f"Publicado em (DB): {p.published_at}")
        print(f"---")

db.close()
