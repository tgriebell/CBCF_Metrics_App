from sqlalchemy import create_engine, Column, Integer, String, JSON, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from datetime import datetime

# Base declarativa para os modelos SQLAlchemy
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime, default=datetime.now)

    credentials = relationship("Credential", back_populates="user")
    posts = relationship("Post", back_populates="user")
    conversations = relationship("Conversation", back_populates="user")

class Credential(Base):
    __tablename__ = "credentials"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    platform = Column(String, index=True)
    access_token = Column(String)
    refresh_token = Column(String, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    scope = Column(String, nullable=True)

    user = relationship("User", back_populates="credentials")
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

class Post(Base):
    __tablename__ = "posts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    platform = Column(String, index=True)
    platform_id = Column(String, index=True, nullable=True) # ID do canal/perfil
    platform_content_id = Column(String, index=True, unique=True) # ID único do vídeo/post
    title = Column(String)
    url = Column(String, nullable=True)
    thumbnail_url = Column(String, nullable=True)
    description = Column(String, default="")
    tags = Column(String, default="")
    status = Column(String, default="postado")
    metrics = Column(JSON, default={})
    is_pattern = Column(Boolean, default=False) # Indica se é um post padrão/referência
    published_at = Column(DateTime)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    last_synced_at = Column(DateTime, default=datetime.now)

    user = relationship("User", back_populates="posts")

class Conversation(Base):
    __tablename__ = "conversations"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, default="Nova Conversa") # Título curto para o menu
    type = Column(String, default="general") # 'general', 'analytics'
    prompt = Column(Text) # Alterado para Text
    response = Column(Text) # Alterado para Text (Pode ser JSON stringified gigante)
    messages = Column(JSON, default=[]) # Histórico completo da conversa [{role, content}, ...]
    feedback = Column(Integer, default=0)
    timestamp = Column(DateTime, default=datetime.now)

    user = relationship("User", back_populates="conversations")

class FollowerHistory(Base):
    __tablename__ = "follower_history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    platform = Column(String, index=True)
    count = Column(Integer) # Seguidores
    views = Column(Integer, default=0)
    likes = Column(Integer, default=0)
    comments = Column(Integer, default=0)
    shares = Column(Integer, default=0)
    profile_views = Column(Integer, default=0)
    
    # Novas métricas de audiência
    total_viewers = Column(Integer, default=0)
    new_viewers = Column(Integer, default=0)
    returning_viewers = Column(Integer, default=0)
    
    # Métricas Acumuladas (Para cálculo de Delta Diário)
    accumulated_views = Column(Integer, default=0)
    accumulated_likes = Column(Integer, default=0)
    accumulated_comments = Column(Integer, default=0)
    accumulated_shares = Column(Integer, default=0)
    
    date = Column(DateTime, default=datetime.now) # Data do registro
    is_manual = Column(Boolean, default=False) # Indica se o registro foi inserido manualmente