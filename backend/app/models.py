"""DB ERD definitions"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Table, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from .database import Base


# Util functions
def _generate_uuid():
    return str(uuid.uuid4())

def _get_utc_now():
    return datetime.now(timezone.utc)


# Define junction table for many-to-many relationship between Session and Character
session_characters = Table(
    "session_characters",
    Base.metadata,
    Column("session_id", String, ForeignKey("sessions.id", ondelete="CASCADE"), primary_key=True),
    Column("character_id", String, ForeignKey("characters.id", ondelete="CASCADE"), primary_key=True),
)


# DB Models
class User(Base):
    __tablename__ = "users"
    # user_id is provided by frontend as UUID string
    id = Column(String, primary_key=True, index=True)
    created_at = Column(DateTime, default=_get_utc_now)

    # One-to-many relationship with Session
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")

class Character(Base):
    __tablename__ = "characters"

    id = Column(String, primary_key=True, default=_generate_uuid, index=True)
    name = Column(String, index=True)
    description = Column(String)
    persona_data = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=_get_utc_now)

    # Many-to-many relationship with Session
    sessions = relationship("Session", secondary=session_characters, back_populates="characters")

class Session(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True, default=_generate_uuid, index=True)
    user_id = Column(String, ForeignKey("users.id"), index=True)
    title = Column(String, default="New Chat")
    created_at = Column(DateTime, default=_get_utc_now)

    # Relationships
    user = relationship("User", back_populates="sessions")
    characters = relationship("Character", secondary=session_characters, back_populates="sessions")
    messages = relationship("Message", back_populates="session", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("sessions.id"), index=True)
    role = Column(String)   # 'user' or 'assistant'
    content = Column(Text)
    created_at = Column(DateTime, default=_get_utc_now)
    
    # Character reference
    character_id = Column(String, ForeignKey("characters.id"), nullable=True)

    # Relationships
    session = relationship("Session", back_populates="messages")
    character = relationship("Character")