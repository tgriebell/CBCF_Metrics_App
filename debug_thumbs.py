from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend.models import Post

db = SessionLocal()

# Verificar ID 9 (Youtube)
post_yt = db.query(Post).filter(Post.id == 9).first()
print(f"--- POST #9 (YouTube) ---")
if post_yt:
    print(f"Título: {post_yt.title}")
    print(f"Thumb URL: {post_yt.thumbnail_url}")
else:
    print("Post #9 não encontrado.")

# Verificar ID 351 (TikTok)
post_tk = db.query(Post).filter(Post.id == 351).first()
print(f"\n--- POST #351 (TikTok) ---")
if post_tk:
    print(f"Título: {post_tk.title}")
    print(f"Thumb URL: {post_tk.thumbnail_url}")
else:
    print("Post #351 não encontrado.")

db.close()
