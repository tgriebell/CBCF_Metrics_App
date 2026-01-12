from backend.database import SessionLocal
from backend.models import Post
from collections import defaultdict
from sqlalchemy import func
import json
from datetime import datetime

db = SessionLocal()

print("--- DIAGNÓSTICO DE MÉTRICAS (SIMULAÇÃO DO GRÁFICO) ---")

# Simulando o período do gráfico
start_date = datetime.strptime("2020-01-01", "%Y-%m-%d")
end_date = datetime.now()

print(f"Período: {start_date} até {end_date}")

platforms = ['youtube', 'tiktok']

for platform in platforms:
    posts = db.query(Post).filter(
        Post.platform.like(f"%{platform}%"),
        Post.published_at >= start_date
    ).all()
    
    print(f"\nPlataforma: {platform.upper()}")
    print(f"Posts encontrados: {len(posts)}")
    
    platform_aggregation = defaultdict(lambda: {"views": 0, "likes": 0})
    
    for p in posts:
        m_key = p.published_at.strftime('%Y-%m')
        
        m = p.metrics
        if isinstance(m, str):
            try: m = json.loads(m)
            except: m = {}
        elif not isinstance(m, dict):
            m = {}
            
        views = int(m.get("views") or 0)
        likes = int(m.get("likes") or 0)
        
        platform_aggregation[m_key]["views"] += views
        platform_aggregation[m_key]["likes"] += likes

    print(f"--- RESULTADO {platform.upper()} ---")
    sorted_keys = sorted(platform_aggregation.keys())
    for key in sorted_keys:
        data = platform_aggregation[key]
        if data['views'] > 0:
            print(f"{key}: {data['views']} Views, {data['likes']} Likes")

db.close()
