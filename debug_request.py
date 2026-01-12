import asyncio
from backend.gemini_service import gemini_service

async def test_debug():
    print("--- Teste de Debug Iniciado ---")
    try:
        # Testa Resposta Geral (Deve usar gemini-3-flash-preview)
        response = await gemini_service.generate_general_response("Explique o que é IA em 5 palavras.")
        print(f"Resposta IA: {response}")
        
        # Testa Título (Deve usar gemini-2.5-flash)
        title = await gemini_service.generate_short_title("Explique o que é IA em 5 palavras.")
        print(f"Título Gerado: {title}")
        
    except Exception as e:
        print(f"Erro: {e}")

if __name__ == "__main__":
    asyncio.run(test_debug())