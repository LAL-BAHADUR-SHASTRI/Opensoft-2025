from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, JSON
from sqlalchemy.sql import expression

from app.core.database import Base

# Database model for chat messages
class ChatMessage(Base):  # Renamed from ChatMessageModel
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), nullable=False, index=True)
    employee_id = Column(String(20), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    is_from_user = Column(Boolean, default=True, nullable=False)
    
    # Content fields - only one will be used depending on is_from_user
    question = Column(Text, nullable=True)  # Bot's question
    response = Column(Text, nullable=True)  # User's response
    
# Pydantic models for API requests and responses
class ChatStartRequest(BaseModel):
    employee_id: Optional[str] = None

class ChatMessageRequest(BaseModel):
    session_id: str
    message: str

class ChatResponse(BaseModel):
    session_id: str
    question: Optional[str] = None
    final_analysis: Optional[Dict[str, Any]] = None
    timestamp: datetime

# Models for chat history
class ChatMessageModel(BaseModel):  # Keep the Pydantic model name the same
    timestamp: datetime
    is_from_user: bool
    question: Optional[str] = None
    response: Optional[str] = None
    sentiment: Optional[str] = None
    keywords: Optional[List[str]] = None

class ChatHistorySession(BaseModel):
    session_id: str
    start_time: datetime
    end_time: datetime
    messages: List[ChatMessageModel]

class ChatHistoryResponse(BaseModel):
    history: List[ChatHistorySession]