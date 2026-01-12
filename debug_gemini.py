import sys
import os
import asyncio
import textwrap

# Add the current directory to sys.path so we can import backend modules
sys.path.append(os.getcwd())

try:
    from backend.config import get_settings
    import google.generativeai as genai
except ImportError as e:
    print(f"Erro de importação: {e}")
    sys.exit(1)

async def list_gemini_models():
    print("--- Listando Modelos Gemini Disponíveis ---")
    
    try:
        settings = get_settings()
        api_key = settings.GEMINI_API_KEY
        
        if not api_key:
            print("ERRO: GEMINI_API_KEY não encontrada nas configurações (verifique backend/.env).")
            return

        print(f"Chave API carregada (começa com: {api_key[:4]}...)")
        
        genai.configure(api_key=api_key)
        
        print("\nBuscando modelos disponíveis...")
        for m in genai.list_models():
            # Filtra apenas modelos que suportam generateContent (texto, como um chat)
            if 'generateContent' in m.supported_generation_methods:
                print("--------------------------------------------------")
                print(f"Nome: {m.name}")
                print(f"Versão: {m.version}")
                print(f"DisplayName: {m.display_name}")
                print(f"Description: {textwrap.shorten(m.description, width=100, placeholder='...')}")
                print(f"Entrada de Tokens: {m.input_token_limit}")
                print(f"Saída de Tokens: {m.output_token_limit}")
                print(f"Geração de Métodos Suportados: {m.supported_generation_methods}")
                print("--------------------------------------------------")

    except Exception as e:
        print("\n--- FALHA ---")
        print(f"Ocorreu um erro ao listar modelos: {e}")
        print("Verifique sua chave de API e sua conexão com a internet.")

if __name__ == "__main__":
    asyncio.run(list_gemini_models())
