import google.generativeai as genai
import os
from dotenv import load_dotenv

# Tenta carregar do backend/.env
load_dotenv(dotenv_path='backend/.env')
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    # Tenta carregar do .env na raiz se falhar
    load_dotenv(dotenv_path='.env')
    api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("ERRO: GEMINI_API_KEY não encontrada nos arquivos .env")
else:
    try:
        genai.configure(api_key=api_key)
        print("--- Modelos Disponíveis ---")
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"- {m.name}")
        print("-------------------------")
    except Exception as e:
        print(f"Erro ao listar modelos: {e}")