"""
Gemini embeddings wrapper
"""
import google.generativeai as genai
from app.config import settings
from typing import List
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import time
import random

class GeminiEmbeddings:
    """Wrapper for Google Gemini embeddings"""
    
    def __init__(self):
        """Initialize Gemini API"""
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = settings.EMBEDDING_MODEL
    
    @retry(
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=1, min=4, max=60),
        reraise=True
    )
    def embed_text(self, text: str) -> List[float]:
        """
        Generate embedding for a single text with retry logic
        
        Args:
            text: Input text
            
        Returns:
            List of floats representing the embedding
        """
        try:
            result = genai.embed_content(
                model=self.model,
                content=text,
                task_type="retrieval_document"
            )
            return result['embedding']
        except Exception as e:
            # Re-raise to trigger retry
            raise Exception(f"Error generating embedding: {str(e)}")
    
    @retry(
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=1, min=4, max=60),
        reraise=True
    )
    def embed_query(self, query: str) -> List[float]:
        """
        Generate embedding for a query with retry logic
        
        Args:
            query: Query text
            
        Returns:
            List of floats representing the embedding
        """
        try:
            result = genai.embed_content(
                model=self.model,
                content=query,
                task_type="retrieval_query"
            )
            return result['embedding']
        except Exception as e:
            raise Exception(f"Error generating query embedding: {str(e)}")
    
    @retry(
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=1, min=4, max=60),
        reraise=True
    )
    def _embed_batch_chunk(self, texts: List[str]) -> List[List[float]]:
        """
        Helper to embed a chunk of texts with retry
        """
        try:
            result = genai.embed_content(
                model=self.model,
                content=texts,
                task_type="retrieval_document"
            )
            # The new SDK returns 'embedding' as a list of lists for list input
            if 'embedding' in result:
                return result['embedding']
            raise Exception("No embedding found in response")
        except Exception as e:
            raise Exception(f"Error generating batch embedding: {str(e)}")

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for multiple texts using batching
        
        Args:
            texts: List of input texts
            
        Returns:
            List of embeddings
        """
        embeddings = []
        # Batch size of 10 to be safe with rate limits and payload size
        batch_size = 10 
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            batch_result = self._embed_batch_chunk(batch)
            embeddings.extend(batch_result)
            # Sleep between batches to respect RPM
            time.sleep(1 + random.random())
            
        return embeddings
