import os
from googleapiclient.discovery import build
from dotenv import load_dotenv

# Carrega as variáveis de ambiente do arquivo .env
load_dotenv()

# Pega a chave da API do ambiente
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
YOUTUBE_API_SERVICE_NAME = "youtube"
YOUTUBE_API_VERSION = "v3"

def get_video_stats(video_id):
    """
    Busca as estatísticas de um vídeo específico do YouTube.
    """
    if not YOUTUBE_API_KEY:
        # Retorna dados de exemplo se a chave da API não estiver configurada
        print("AVISO: Chave da API do YouTube não configurada. Usando dados de exemplo.")
        return {
            'viewCount': '1000',
            'likeCount': '100',
            'commentCount': '10',
            'favoriteCount': '0', # A API v3 geralmente retorna 0 para isso
        }

    try:
        youtube = build(
            YOUTUBE_API_SERVICE_NAME, 
            YOUTUBE_API_VERSION, 
            developerKey=YOUTUBE_API_KEY
        )

        request = youtube.videos().list(
            part="statistics",
            id=video_id
        )
        response = request.execute()

        if response['items']:
            return response['items'][0]['statistics']
        else:
            return None
            
    except Exception as e:
        print(f"Ocorreu um erro ao chamar a API do YouTube: {e}")
        # Em caso de erro, podemos retornar dados de exemplo ou None
        return {
            'viewCount': '0',
            'likeCount': '0',
            'commentCount': '0',
        }

if __name__ == '__main__':
    # Exemplo de como usar a função (para teste)
    # Substitua pelo ID de um vídeo real para testar
    sample_video_id = "dQw4w9WgXcQ" 
    stats = get_video_stats(sample_video_id)
    if stats:
        print(f"Estatísticas para o vídeo {sample_video_id}:")
        print(f"  - Visualizações: {stats.get('viewCount')}")
        print(f"  - Curtidas: {stats.get('likeCount')}")
        print(f"  - Comentários: {stats.get('commentCount')}")
