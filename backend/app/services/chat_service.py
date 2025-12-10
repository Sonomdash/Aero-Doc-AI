"""
Chat service for RAG pipeline
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.chat import ChatSession, ChatMessage
from app.models.user import User
from app.services.vector_store import VectorStore
from app.utils.embeddings import GeminiEmbeddings
from app.config import settings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from typing import List, Dict, Any, Optional
from uuid import UUID
import json

class ChatService:
    """Service for chat and RAG operations"""
    
    def __init__(self):
        self.vector_store = VectorStore()
        self.embeddings = GeminiEmbeddings()
        self.llm = ChatGoogleGenerativeAI(
            model=settings.LLM_MODEL,
            google_api_key=settings.GEMINI_API_KEY,
            temperature=0.7,
        )
        self.system_prompt = """You are Aero-Doc AI, an intelligent assistant designed to help users understand their technical documents.
        Use the following pieces of retrieved context to answer the user's question.
        
        Guidelines:
        1. Base your answer ONLY on the provided context.
        2. If the answer is not in the context, say "I cannot find the answer in the provided documents."
        3. Cite the source document filenames when possible.
        4. Keep answers concise and professional.
        
        Context:
        {context}
        """

    def create_session(self, db: Session, user: User, title: str = "New Chat") -> ChatSession:
        """Create a new chat session"""
        session = ChatSession(user_id=user.id, title=title)
        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    def get_user_sessions(self, db: Session, user: User) -> List[ChatSession]:
        """Get all chat sessions for a user"""
        return db.query(ChatSession).filter(
            ChatSession.user_id == user.id
        ).order_by(ChatSession.updated_at.desc()).all()

    def get_session(self, db: Session, session_id: UUID, user_id: UUID) -> ChatSession:
        """Get a specific session"""
        session = db.query(ChatSession).filter(
            ChatSession.id == session_id,
            ChatSession.user_id == user_id
        ).first()
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found"
            )
        return session

    async def send_message(
        self, 
        db: Session, 
        user_id: UUID, 
        session_id: UUID, 
        content: str
    ) -> ChatMessage:
        """
        Process user message and generate RAG response
        """
        # 1. Validate session
        session = self.get_session(db, session_id, user_id)
        
        # 2. Save user message
        user_msg = ChatMessage(
            session_id=session_id,
            role="user",
            content=content
        )
        db.add(user_msg)
        db.commit()
        
        try:
            # 3. Retrieve relevant documents (RAG)
            query_embedding = self.embeddings.embed_query(content)
            search_results = self.vector_store.search(
                query_embedding=query_embedding,
                top_k=5
            )
            
            # Format context from results
            context_parts = []
            sources = []
            
            # Helper to safely access result lists
            docs = search_results.get("documents", [])
            metas = search_results.get("metadatas", [])
            
            for i, doc_text in enumerate(docs):
                meta = metas[i] if i < len(metas) else {}
                filename = meta.get("filename", "Unknown")
                context_parts.append(f"Source: {filename}\nContent: {doc_text}")
                
                # Add unique source to list
                source_entry = {
                    "doc_id": meta.get("doc_id"),
                    "filename": filename,
                    "chunk_index": meta.get("chunk_index"),
                    "page_number": meta.get("page_number")
                }
                if source_entry not in sources:
                    sources.append(source_entry)
            
            context_str = "\n\n".join(context_parts)
            
            # 4. Generate response with LLM
            # Fetch recent history (optional, for context)
            # history = db.query(ChatMessage).filter(
            #     ChatMessage.session_id == session_id
            # ).order_by(ChatMessage.created_at.desc()).limit(10).all()
            
            messages = [
                SystemMessage(content=self.system_prompt.format(context=context_str)),
                HumanMessage(content=content)
            ]
            
            response = self.llm.invoke(messages)
            answer_text = response.content
            
            # 5. Save assistant response
            assistant_msg = ChatMessage(
                session_id=session_id,
                role="assistant",
                content=answer_text,
                sources=sources
            )
            db.add(assistant_msg)
            
            # Update session timestamp
            session.title = content[:30] + "..." if session.title == "New Chat" else session.title
            
            db.commit()
            db.refresh(assistant_msg)
            
            return assistant_msg
            
        except Exception as e:
            # Log error?
            error_msg = f"Error generating response: {str(e)}"
            # Create an error message from assistant?
            assistant_msg = ChatMessage(
                session_id=session_id,
                role="assistant",
                content="I encountered an error while processing your request.",
                sources=[{"error": str(e)}]
            )
            db.add(assistant_msg)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=error_msg
            )
