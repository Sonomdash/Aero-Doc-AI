"""
ChromaDB vector store service
"""
import chromadb
from chromadb.config import Settings
from app.config import settings
from typing import List, Dict, Any, Optional
from uuid import UUID


class VectorStore:
    """ChromaDB vector store wrapper"""
    
    def __init__(self):
        """Initialize ChromaDB client"""
        self.client = chromadb.HttpClient(
            host=settings.CHROMA_HOST,
            port=settings.CHROMA_PORT,
            settings=Settings(anonymized_telemetry=False)
        )
        self.collection_name = "technical_documents"
        self.collection = self._get_or_create_collection()
    
    def _get_or_create_collection(self):
        """Get or create the documents collection"""
        try:
            collection = self.client.get_collection(name=self.collection_name)
        except:
            collection = self.client.create_collection(
                name=self.collection_name,
                metadata={"hnsw:space": "cosine"}
            )
        return collection
    
    def add_documents(
        self,
        doc_id: UUID,
        chunks: List[str],
        embeddings: List[List[float]],
        metadatas: List[Dict[str, Any]]
    ) -> None:
        """
        Add document chunks to vector store
        
        Args:
            doc_id: Document UUID
            chunks: List of text chunks
            embeddings: List of embeddings for each chunk
            metadatas: List of metadata dicts for each chunk
        """
        # Generate unique IDs for each chunk
        ids = [f"{doc_id}_{i}" for i in range(len(chunks))]
        
        self.collection.add(
            ids=ids,
            documents=chunks,
            embeddings=embeddings,
            metadatas=metadatas
        )
    
    def search(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Search for similar documents
        
        Args:
            query_embedding: Query embedding vector
            top_k: Number of results to return
            filter_metadata: Optional metadata filter
            
        Returns:
            Dictionary with ids, documents, metadatas, and distances
        """
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where=filter_metadata
        )
        
        return {
            "ids": results['ids'][0] if results['ids'] else [],
            "documents": results['documents'][0] if results['documents'] else [],
            "metadatas": results['metadatas'][0] if results['metadatas'] else [],
            "distances": results['distances'][0] if results['distances'] else []
        }
    
    def delete_document(self, doc_id: UUID) -> None:
        """
        Delete all chunks for a document
        
        Args:
            doc_id: Document UUID
        """
        # Get all chunk IDs for this document
        results = self.collection.get(
            where={"doc_id": str(doc_id)}
        )
        
        if results['ids']:
            self.collection.delete(ids=results['ids'])
    
    def get_collection_stats(self) -> Dict[str, Any]:
        """Get collection statistics"""
        count = self.collection.count()
        return {
            "collection_name": self.collection_name,
            "total_chunks": count
        }
