from backend.database import SessionLocal
from backend.models import Post
from sqlalchemy import desc

db = SessionLocal()

print("--- Últimos 5 Posts Salvos ---")
posts = db.query(Post).order_by(desc(Post.published_at)).limit(5).all()

for p in posts:
    print(f"[{p.platform}] Data: {p.published_at} | Título: {p.title[:30]}...")

db.close()
