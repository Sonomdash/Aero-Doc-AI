"""
Chat schemas
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID


class ChatSessionCreate(BaseModel):
    """Create new chat session"""
    title: Optional[str] = "New Chat"


class ChatSessionResponse(BaseModel):
    """Chat session response"""
    id: UUID
    user_id: UUID
    title: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ChatMessageRequest(BaseModel):
    """Send message request"""
    session_id: UUID
    content: str = Field(..., min_length=1, max_length=5000)


class SourceDocument(BaseModel):
    """Source document chunk"""
    doc_id: str
    filename: str
    chunk_index: int
    content: str
    page_number: Optional[int] = None


class ChatMessageResponse(BaseModel):
    """Chat message response"""
    id: UUID
    session_id: UUID
    role: str
    content: str
    sources: Optional[List[Dict[str, Any]]] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class ChatHistoryResponse(BaseModel):
    """Chat history for a session"""
    session: ChatSessionResponse
    messages: List[ChatMessageResponse]


class ChatSessionListResponse(BaseModel):
    """List of chat sessions"""
    sessions: List[ChatSessionResponse]
    total: int
