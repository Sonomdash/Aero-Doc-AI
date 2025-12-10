"""
Chat API Router
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.database import get_db
from app.models.user import User
from app.routers.auth import get_current_user
from app.services.chat_service import ChatService
from app.schemas.chat import (
    ChatSessionCreate, 
    ChatSessionResponse, 
    ChatSessionListResponse,
    ChatMessageRequest, 
    ChatMessageResponse,
    ChatHistoryResponse
)

router = APIRouter(
    prefix="/api/chat",
    tags=["chat"]
)

# Initialize service
chat_service = ChatService()

@router.post("/sessions", response_model=ChatSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_chat_session(
    session_data: ChatSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new chat session"""
    return chat_service.create_session(db, current_user, session_data.title)

@router.get("/sessions", response_model=ChatSessionListResponse)
async def get_chat_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all chat sessions for the current user"""
    sessions = chat_service.get_user_sessions(db, current_user)
    return ChatSessionListResponse(
        sessions=sessions,
        total=len(sessions)
    )

@router.get("/sessions/{session_id}", response_model=ChatHistoryResponse)
async def get_chat_history(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get chat history for a specific session"""
    session = chat_service.get_session(db, session_id, current_user.id)
    # Messages are loaded via relationship mechanism in Pydantic schema if set up correctly.
    # However, strict Pydantic models might need explicit conversion or the relationship to be eager loaded.
    # Let's ensure schema compatibility.
    return ChatHistoryResponse(
        session=session,
        messages=session.messages
    )

@router.post("/sessions/{session_id}/messages", response_model=ChatMessageResponse)
async def send_message(
    session_id: UUID,
    message_data: ChatMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a message to a chat session (RAG)"""
    # Verify session ID matches path
    if session_id != message_data.session_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session ID in path does not match body"
        )
    
    return await chat_service.send_message(
        db, 
        current_user.id, 
        session_id, 
        message_data.content
    )
