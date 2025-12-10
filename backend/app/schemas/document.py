"""
Document schemas
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID


class DocumentUploadResponse(BaseModel):
    """Document upload response"""
    id: UUID
    filename: str
    file_type: str
    file_size: Optional[int]
    upload_date: datetime
    processed: bool
    
    class Config:
        from_attributes = True


class DocumentResponse(BaseModel):
    """Document detail response"""
    id: UUID
    user_id: UUID
    filename: str
    file_type: str
    file_size: Optional[int]
    upload_date: datetime
    processed: bool
    chunk_count: int
    error_message: Optional[str]
    
    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    """List of documents"""
    documents: list[DocumentResponse]
    total: int
