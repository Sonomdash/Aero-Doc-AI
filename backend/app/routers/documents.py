"""
Document API endpoints
"""
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.database import get_db
from app.routers.auth import get_current_user
from app.services.document_service import DocumentService
from app.schemas.document import DocumentResponse
from app.models.user import User

router = APIRouter(
    prefix="/api/documents",
    tags=["documents"]
)

# Initialize service
document_service = DocumentService()


@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload and process a document (PDF or DOCX).
    The file will be stored, text extracted, chunked, and embedded into ChromaDB.
    """
    return await document_service.upload_document(db, current_user, file)


@router.get("", response_model=List[DocumentResponse])
async def get_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all documents uploaded by the current user"""
    return document_service.get_user_documents(db, current_user.id)


@router.get("/{doc_id}", response_model=DocumentResponse)
async def get_document(
    doc_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get details of a specific document"""
    return document_service.get_document_by_id(db, doc_id, current_user.id)


@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    doc_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a document and its embeddings"""
    document_service.delete_document(db, doc_id, current_user.id)
