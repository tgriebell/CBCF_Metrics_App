import requests
import urllib3
import time

# Desabilitar avisos de certificado
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

url = "https://127.0.0.1:8000/api/sync/youtube"
headers = {"Authorization": "Bearer fake-token"}

try:
    print(f"--- DISPARANDO SYNC YOUTUBE ---")
    print(f"URL: {url}")
    start = time.time()
    response = requests.get(url, headers=headers, verify=False)
    duration = time.time() - start
    
    if response.status_code == 200:
        print(f"✅ Sucesso! (Tempo: {duration:.2f}s)")
        print("Resposta:", response.json())
    else:
        print(f"❌ Falha. Status: {response.status_code}")
        print("Erro:", response.text)

except Exception as e:
    print(f"❌ Erro de Conexão: {e}")
