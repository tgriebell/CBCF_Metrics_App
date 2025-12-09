from sqlalchemy import create_engine, Column, Integer, String, JSON, DateTime, ForeignKey
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
    platform = Column(String, index=True)
    title = Column(String)
    url = Column(String)
    cover_image = Column(String, nullable=True)
    description = Column(String, default="")
    tags = Column(String, default="")
    status = Column(String, default="postado")
    metrics = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
