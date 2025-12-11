# Aero-Doc-AI: Техникийн Баримт Бичиг

Энэ директор нь Aero-Doc-AI системийн дэлгэрэнгүй техникийн тайлбаруудыг агуулна.

---

## 📚 Баримтын Жагсаалт

### 1. [File Upload Тайлбар](./01_file_upload_explanation.md)

**Агуулга:**
- Frontend файл upload UI (drag & drop)
- Backend validation болон processing
- 3 давхарга хадгалалт:
  - File System (`./uploads/`)
  - PostgreSQL (metadata)
  - ChromaDB (vector embeddings)
- Document processing pipeline
- Text extraction, chunking, embedding generation

**Хэнд зориулсан:** Frontend болон backend хөгжүүлэгчид

---

### 2. [Chat Logic & RAG Pipeline](./02_chat_logic_explanation.md)

**Агуулга:**
- RAG (Retrieval-Augmented Generation) pipeline
- 7 алхамтай chat flow:
  1. User message → Database
  2. Query embedding
  3. Vector similarity search (ChromaDB)
  4. Context preparation
  5. LLM prompt construction
  6. Groq API (Llama 3) response
  7. Assistant message → Database
- Frontend-backend interaction
- Database schema
- Source citation mechanism

**Хэнд зориулсан:** AI/ML болон backend хөгжүүлэгчид

---

### 3. [Text Embedding: Гүнзгий Тайлбар](./03_embedding_deep_dive.md)

**Агуулга:**
- `embed_query()` функцийн дэлгэрэнгүй тайлбар
- Neural network architecture:
  - Tokenization
  - Transformer (6 layers, BERT-based)
  - Mean pooling
  - Normalization
- Semantic vector space
- Cosine similarity
- Model specs: `sentence-transformers/all-MiniLM-L6-v2`

**Хэнд зориулсан:** AI/ML engineers, техникийн архитектууд

---

### 4. [Service Code Тайлбар](./04_service_code_explanation.md)

**Агуулга:**
- 3 үндсэн service файлын дэлгэрэнгүй тайлбар:
  - `DocumentService`: Файл боловсруулалт, chunk, embedding
  - `VectorStore`: ChromaDB wrapper, similarity search
  - `ChatService`: RAG pipeline, LLM integration
- Код бүрийн зорилго, яагаад ашигласан, ямар үр дүн гарч байгаа
- Алхам бүрийн дэлгэрэнгүй тайлбар
- Бодит жишээнүүд

**Хэнд зориулсан:** Backend хөгжүүлэгчид, код ойлгох хүсэлтэй хүмүүс

---

## 🎯 Хурдан Лавлагаа

### Системийн Бүтэц

```
User Query
    ↓
Frontend (Next.js)
    ↓
Backend API (FastAPI)
    ↓
┌─────────────┬──────────────┬─────────────┐
│  PostgreSQL │   ChromaDB   │  Groq API   │
│  (metadata) │   (vectors)  │  (Llama 3)  │
└─────────────┴──────────────┴─────────────┘
```

### Технологийн Stack

| Компонент | Технологи |
|-----------|-----------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS |
| **Backend** | FastAPI, Python 3.11+ |
| **Database** | PostgreSQL |
| **Vector DB** | ChromaDB |
| **Embeddings** | HuggingFace (local) |
| **LLM** | Groq (Llama 3.3 70B) |
