import requests
import urllib3

# Desabilitar avisos de certificado (já que é localhost auto-assinado)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

url = "https://127.0.0.1:8000/api/sync/tiktok"
# Precisa do token? O backend usa Depends(get_current_user) mas o token é fake "fake-token"
headers = {"Authorization": "Bearer fake-token"}

try:
    print(f"Iniciando sincronização forçada: {url}")
    response = requests.get(url, headers=headers, verify=False)
    
    if response.status_code == 200:
        print("✅ Sincronização concluída com sucesso!")
        print("Resposta:", response.json())
    else:
        print(f"❌ Falha na sincronização. Status: {response.status_code}")
        print("Erro:", response.text)

except Exception as e:
    print(f"❌ Erro ao conectar: {e}")
