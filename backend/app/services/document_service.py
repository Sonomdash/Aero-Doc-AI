"""
Document processing service
"""
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException, status
from app.models.document import Document
from app.models.user import User
from app.utils.parsers import DocumentParser
from app.utils.embeddings import GeminiEmbeddings
from app.services.vector_store import VectorStore
from app.config import settings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from typing import List, Dict, Any
from uuid import UUID
import os
import shutil


class DocumentService:
    """Service for document processing"""
    
    def __init__(self):
        self.embeddings = GeminiEmbeddings()
        self.vector_store = VectorStore()
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
    
    async def upload_document(
        self,
        db: Session,
        user: User,
        file: UploadFile
    ) -> Document:
        """
        Upload and process a document
        
        Args:
            db: Database session
            user: Current user
            file: Uploaded file
            
        Returns:
            Document: Created document object
        """
        # Validate file type
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in ['.pdf', '.docx', '.doc']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type: {file_ext}"
            )
        
        # Validate file size
        file.file.seek(0, 2)  # Seek to end
        file_size = file.file.tell()
        file.file.seek(0)  # Reset to beginning
        
        if file_size > settings.MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File too large. Max size: {settings.MAX_UPLOAD_SIZE} bytes"
            )
        
        # Save file
        file_path = os.path.join(settings.UPLOAD_DIR, f"{user.id}_{file.filename}")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Create document record
        document = Document(
            user_id=user.id,
            filename=file.filename,
            file_type=file_ext.replace('.', ''),
            file_path=file_path,
            file_size=file_size,
            processed=False
        )
        
        db.add(document)
        db.commit()
        db.refresh(document)
        
        # Process document asynchronously (in background)
        try:
            await self.process_document(db, document)
        except Exception as e:
            document.error_message = str(e)
            document.processed = False
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error processing document: {str(e)}"
            )
        
        return document
    
    async def process_document(self, db: Session, document: Document) -> None:
        """
        Process document: extract text, chunk, embed, store in vector DB
        
        Args:
            db: Database session
            document: Document object
        """
        try:
            # Extract text
            text, page_count = DocumentParser.parse_document(
                document.file_path,
                document.file_type
            )
            
            if not text.strip():
                raise Exception("No text extracted from document")
            
            # Split into chunks
            chunks = self.text_splitter.split_text(text)
            
            if not chunks:
                raise Exception("No chunks created from document")
            
            # Generate embeddings
            embeddings = self.embeddings.embed_batch(chunks)
            
            # Prepare metadata
            metadatas = [
                {
                    "doc_id": str(document.id),
                    "filename": document.filename,
                    "chunk_index": i,
                    "total_chunks": len(chunks),
                    "user_id": str(document.user_id)
                }
                for i in range(len(chunks))
            ]
            
            # Store in vector database
            self.vector_store.add_documents(
                doc_id=document.id,
                chunks=chunks,
                embeddings=embeddings,
                metadatas=metadatas
            )
            
            # Update document status
            document.processed = True
            document.chunk_count = len(chunks)
            document.error_message = None
            db.commit()
            
        except Exception as e:
            document.processed = False
            document.error_message = str(e)
            db.commit()
            raise
    
    def get_user_documents(self, db: Session, user_id: UUID) -> List[Document]:
        """Get all documents for a user"""
        return db.query(Document).filter(Document.user_id == user_id).all()
    
    def get_document_by_id(self, db: Session, doc_id: UUID, user_id: UUID) -> Document:
        """Get document by ID (with user validation)"""
        document = db.query(Document).filter(
            Document.id == doc_id,
            Document.user_id == user_id
        ).first()
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        return document
    
    def delete_document(self, db: Session, doc_id: UUID, user_id: UUID) -> None:
        """Delete document and its vectors"""
        document = self.get_document_by_id(db, doc_id, user_id)
        
        # Delete from vector store
        try:
            self.vector_store.delete_document(doc_id)
        except Exception as e:
            print(f"Error deleting from vector store: {e}")
        
        # Delete file
        if os.path.exists(document.file_path):
            os.remove(document.file_path)
        
        # Delete from database
        db.delete(document)
        db.commit()
