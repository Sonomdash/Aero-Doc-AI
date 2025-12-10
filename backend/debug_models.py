import google.generativeai as genai
import os
from app.config import settings

def list_available_models():
    print(f"Checking models with API Key: {settings.GEMINI_API_KEY[:5]}...")
    genai.configure(api_key=settings.GEMINI_API_KEY)
    
    print("\n--- Available Models ---")
    try:
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"Name: {m.name}")
                print(f"Display Name: {m.display_name}")
                print("-" * 20)
    except Exception as e:
        print(f"Error listing models: {e}")

if __name__ == "__main__":
    list_available_models()
