from backend.database import SessionLocal
from backend.models import Post
from sqlalchemy import func
import json

db = SessionLocal()

print("--- DIAGNÓSTICO DE BANCO DE DADOS (TIKTOK) ---")
posts = db.query(Post).filter(Post.platform == 'tiktok').all()
print(f"Total de Posts Encontrados: {len(posts)}")

if posts:
    print("\n--- AMOSTRA DE 5 VÍDEOS ---")
    for i, p in enumerate(posts[:5]):
        print(f"[{i+1}] ID: {p.id}")
        print(f"    Data: {p.published_at} (Tipo: {type(p.published_at)})")
        print(f"    Título: {p.title}")
        print(f"    Métricas: {p.metrics}")
        print("-" * 30)
else:
    print("Nenhum post encontrado. O banco está vazio para TikTok.")

db.close()
