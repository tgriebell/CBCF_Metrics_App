import asyncio
from backend.tiktok_service import tiktok_service
from backend.database import SessionLocal
from backend.models import Post, User

async def refresh_all_covers():
    db = SessionLocal()
    user = db.query(User).filter(User.username == "testuser").first()
    
    if not user:
        print("Usuário não encontrado.")
        return

    print("--- INICIANDO ATUALIZAÇÃO FORÇADA DE CAPAS TIKTOK ---")
    
    # 1. Tenta pegar a lista completa de vídeos via API (se a API permitir paginação profunda)
    # O tiktok_service.sync_data já faz isso, mas vamos chamar focado em atualizar
    try:
        print("Solicitando dados atualizados à API...")
        result = await tiktok_service.sync_data(user.id, db)
        print(f"Sincronização concluída. Resultado: {result}")
        
        # 2. Verifica se o vídeo #351 foi atualizado
        post_351 = db.query(Post).filter(Post.id == 351).first()
        if post_351:
            print(f"\n--- VERIFICAÇÃO PÓS-SYNC (ID #351) ---")
            print(f"Novo Link: {post_351.thumbnail_url}")
        else:
            print("Post #351 ainda não encontrado/atualizado.")
            
    except Exception as e:
        print(f"Erro fatal durante a atualização: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(refresh_all_covers())
