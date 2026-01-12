from backend.database import SessionLocal
from backend.models import Post

db = SessionLocal()
posts = db.query(Post).filter(Post.platform == 'tiktok').limit(5).all()

print("--- TikTok Thumbnail URLs ---")
for p in posts:
    print(f"ID: {p.id} | URL: {p.thumbnail_url}")

db.close()
