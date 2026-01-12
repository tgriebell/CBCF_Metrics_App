import sys
import os
import asyncio
import logging

# Configuração de Log para ver erros detalhados se houver
logging.basicConfig(level=logging.INFO)

# Adiciona o diretório atual ao path para importar os módulos do backend
sys.path.append(os.getcwd())

from backend.database import SessionLocal
from backend.data_analytics_gemini_service import data_analytics_service

async def test_analytics():
    print("\n--- INICIANDO TESTE DO ANALISTA DE DADOS ---")
    db = SessionLocal()
    try:
        # Prompt de teste simula uma pergunta comum
        prompt = "Analise meu crescimento nos últimos 30 dias e cite meu melhor vídeo."
        print(f"1. Enviando pergunta: '{prompt}'")
        print("2. Aguardando análise da IA (pode levar alguns segundos)...")
        
        # Chama o serviço real
        result = await data_analytics_service.analyze_data_with_context(prompt, db)
        
        print("\n--- SUCESSO! RESPOSTA DA IA ---")
        print(f"Resumo:\n{result.get('summary_text')}")
        
        ref_post = result.get('referenced_post')
        if ref_post:
            print(f"\nPost Destacado pela IA: {ref_post.get('title')} (Views: {ref_post.get('metrics', {}).get('views')})")
        else:
            print("\nNenhum post específico foi destacado (o que é normal dependendo dos dados).")
            
    except Exception as e:
        print(f"\n--- FALHA NO TESTE ---")
        print(f"Erro: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()
        print("\n--- FIM DO TESTE ---")

if __name__ == "__main__":
    asyncio.run(test_analytics())
