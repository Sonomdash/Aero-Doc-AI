from typing import List
from langchain_huggingface import HuggingFaceEmbeddings
from app.config import settings

class GeminiEmbeddings:
    """
    Wrapper for Embeddings (Validating to HuggingFace for free tier)
    Keeping class name 'GeminiEmbeddings' to avoid refactoring all imports immediately, 
    but strictly using local HuggingFace model.
    """
    
    def __init__(self):
        # settings.EMBEDDING_MODEL should be 'sentence-transformers/all-MiniLM-L6-v2'
        self.client = HuggingFaceEmbeddings(
            model_name=settings.EMBEDDING_MODEL,
            model_kwargs={'device': 'cpu'},
            encode_kwargs={'normalize_embeddings': True}
        )

    def embed_text(self, text: str) -> List[float]:
        """Generate embedding for a single text"""
        return self.client.embed_query(text)

    def embed_query(self, text: str) -> List[float]:
        """Generate embedding for query"""
        return self.client.embed_query(text)

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts"""
        return self.client.embed_documents(texts)
