from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# --- Schemas para Posts ---
class PostBase(BaseModel):
    platform: str
    title: str
    url: Optional[str] = ""
    description: Optional[str] = ""
    tags: Optional[str] = ""
    status: Optional[str] = "postado"
    thumbnail_url: Optional[str] = None

class PostCreate(PostBase):
    pass

class Post(PostBase):
    id: int
    published_at: Optional[datetime] = None
    metrics: dict = {}
    is_pattern: bool = False # Novo campo

    class Config:
        from_attributes = True

# --- Schemas para IA ---
class GenerateRequest(BaseModel):
    prompt: str
    context_type: Optional[str] = "chat" # 'chat' (padrão) ou 'report' (dashboard)
    conversation_id: Optional[int] = None # ID para continuar conversa existente

# --- Schemas para Conversas com IA ---
class ConversationBase(BaseModel):
    prompt: str
    response: str

class ConversationCreate(ConversationBase):
    pass

class Conversation(ConversationBase):
    id: int
    user_id: int
    title: Optional[str] = None
    type: Optional[str] = "general"
    messages: Optional[List[dict]] = [] # Histórico estruturado
    timestamp: datetime
    feedback: int

    class Config:
        from_attributes = True

class FeedbackCreate(BaseModel):
    feedback_value: int

class HistoryUpdate(BaseModel):
    date: str  # Formato YYYY-MM-DD
    platform: str
    count: int # Seguidores totais no fechamento do dia
    views: Optional[int] = 0
    likes: Optional[int] = 0
    comments: Optional[int] = 0
    shares: Optional[int] = 0
    profile_views: Optional[int] = 0
    is_final: bool = True # True = Fecha o dia (23:59); False = Rascunho (12:00)
