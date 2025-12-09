import re
from typing import Optional

def get_video_id_from_url(url: str) -> Optional[str]:
    """Extrai o ID do vídeo de várias URLs do YouTube."""
    if not url:
        return None
    # Padrão para URLs padrão e encurtadas
    regex = r"(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(?:shorts\/)?([a-zA-Z0-9_-]{11})"
    match = re.search(regex, url)
    return match.group(1) if match else None
