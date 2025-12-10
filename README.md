# Aero-Doc AI

**Техникийн Баримт Бичгийн Асуулт-Хариултын Портал**

RAG (Retrieval-Augmented Generation) технологи ашигласан мэдлэгийн чатбот систем. Аж ахуйн нэгжийн техникийн баримт бичгүүдээс мэдээлэл хайж, асуултад оновчтой хариулт өгдөг.

---

## 📋 Агуулга

- [Тойм](#-тойм)
- [Технологийн Стек](#-технологийн-стек)
- [Системийн Архитектур](#-системийн-архитектур)
- [Өгөгдлийн Сангийн Бүтэц](#-өгөгдлийн-сангийн-бүтэц)
- [Суулгах Заавар](#-суулгах-заавар)
- [Хөгжүүлэлтийн Орчин](#-хөгжүүлэлтийн-орчин)
- [API Endpoints](#-api-endpoints)
- [RAG Pipeline](#-rag-pipeline)
- [Төслийн Бүтэц](#-төслийн-бүтэц)
- [Хөгжүүлэлтийн Алхмууд](#-хөгжүүлэлтийн-алхмууд)
- [Тохиргоо](#-тохиргоо)
- [Тестлэх](#-тестлэх)

---

## 🎯 Тойм

**Aero-Doc AI** нь техникийн баримт бичгүүдтэй ажиллах хэрэглэгчдэд зориулсан интеллект чатбот юм. Энэ систем нь:

- ✅ PDF, Word баримт бичгүүдийг уншиж, боловсруулна
- ✅ Хэрэглэгчийн асуултад үндэслэн холбогдох мэдээллийг олно
- ✅ Google Gemini AI ашиглан оновчтой хариулт үүсгэнэ
- ✅ Чат түүхийг хадгалж, өмнөх ярианы контекстийг ашиглана
- ✅ JWT authentication ашиглан аюулгүй байдлыг хангана

---

## 🛠 Технологийн Стек

### Backend
| Технологи | Зориулалт |
|-----------|-----------|
| **Python 3.11+** | Үндсэн хэл |
| **FastAPI** | Web framework, REST API |
| **LangChain** | RAG pipeline удирдлага |
| **Google Gemini API** | LLM (Text generation + Embeddings) |
| **ChromaDB** | Vector database (embedding хадгалах) |
| **PostgreSQL** | Relational database (metadata, users, chat history) |
| **SQLAlchemy** | ORM |
| **Alembic** | Database migrations |
| **PyJWT** | JWT authentication |
| **PyPDF2** | PDF файл уншигч |
| **python-docx** | Word файл уншигч |

### Frontend
| Технологи | Зориулалт |
|-----------|-----------|
| **Next.js 14+** | React framework (App Router) |
| **TypeScript** | Type safety |
| **Tailwind CSS** | Styling |
| **Axios** | HTTP client |
| **React Query** | Server state management |

### Infrastructure
| Технологи | Зориулалт |
|-----------|-----------|
| **Docker** | Containerization |
| **Docker Compose** | Multi-container orchestration |
| **Nginx** (optional) | Reverse proxy |

---

## 🏗 Системийн Архитектур

```
┌──────────────────────────────────────────────────────────┐
│                   Next.js Frontend                        │
│  ┌────────────┐  ┌────────────┐  ┌──────────────┐       │
│  │   Login/   │  │    Chat    │  │   Document   │       │
│  │  Register  │  │ Interface  │  │   Upload     │       │
│  └────────────┘  └────────────┘  └──────────────┘       │
└────────────────┬─────────────────────────────────────────┘
                 │ HTTP + JWT Token
                 ▼
┌──────────────────────────────────────────────────────────┐
│                    FastAPI Backend                        │
│  ┌────────────────────────────────────────────────────┐  │
│  │  🔐 Auth Service                                   │  │
│  │     - User registration/login                      │  │
│  │     - JWT token generation/validation              │  │
│  └────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────┐  │
│  │  📄 Document Processing Service                    │  │
│  │     - PDF/Word parsing                             │  │
│  │     - Text chunking (1000 chars, 200 overlap)      │  │
│  │     - Embedding generation (Gemini)                │  │
│  │     - ChromaDB storage                             │  │
│  └────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────┐  │
│  │  🤖 RAG Service (LangChain)                        │  │
│  │     - Query embedding                              │  │
│  │     - Similarity search (ChromaDB)                 │  │
│  │     - Context retrieval (top-k=5)                  │  │
│  │     - Answer generation (Gemini Pro)               │  │
│  └────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────┐  │
│  │  💬 Chat Service                                   │  │
│  │     - Session management                           │  │
│  │     - Message history storage                      │  │
│  │     - Context window management                    │  │
│  └────────────────────────────────────────────────────┘  │
└──────┬───────────────────────┬───────────────────────────┘
       │                       │
       ▼                       ▼
┌─────────────┐         ┌─────────────┐
│ PostgreSQL  │         │  ChromaDB   │
│             │         │             │
│ • users     │         │ • vectors   │
│ • documents │         │ • metadata  │
│ • sessions  │         │ • chunks    │
│ • messages  │         │             │
└─────────────┘         └─────────────┘
```

---

## 🗄 Өгөгдлийн Сангийн Бүтэц

### PostgreSQL Tables

#### `users` - Хэрэглэгчид
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `documents` - Баримт бичгүүд
```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(10) NOT NULL, -- 'pdf', 'docx'
    file_path TEXT NOT NULL,
    file_size INTEGER, -- bytes
    upload_date TIMESTAMP DEFAULT NOW(),
    processed BOOLEAN DEFAULT FALSE,
    chunk_count INTEGER DEFAULT 0,
    error_message TEXT
);
```

#### `chat_sessions` - Чат session-ууд
```sql
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) DEFAULT 'New Chat',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `chat_messages` - Чат мессежүүд
```sql
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- 'user', 'assistant'
    content TEXT NOT NULL,
    sources JSONB, -- Retrieved document chunks with metadata
    created_at TIMESTAMP DEFAULT NOW()
);
```

### ChromaDB Collection

```python
collection_name = "technical_documents"

# Metadata structure:
{
    "doc_id": "uuid",
    "filename": "manual.pdf",
    "chunk_index": 0,
    "page_number": 1,
    "total_chunks": 50
}
```

---

## 📦 Суулгах Заавар

### Шаардлагатай зүйлс

- **Docker** (20.10+)
- **Docker Compose** (2.0+)
- **Google Gemini API Key** ([https://ai.google.dev](https://ai.google.dev))

### 1. Repository clone хийх

```bash
git clone https://github.com/your-org/aero-doc-ai.git
cd aero-doc-ai
```

### 2. Environment variables тохируулах

```bash
cp .env.example .env
```

`.env` файлд дараах утгуудыг оруулна:

```env
# Backend
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/aerodoc
CHROMA_HOST=chromadb
CHROMA_PORT=8000

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# JWT
SECRET_KEY=your_super_secret_key_here_min_32_chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Docker Compose ашиглан ажиллуулах

```bash
# Бүх service-үүдийг build хийж, эхлүүлэх
docker-compose up --build

# Эсвэл background-д ажиллуулах
docker-compose up -d --build
```

### 4. Хандах

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ChromaDB**: [http://localhost:8001](http://localhost:8001)

---

## 🔧 Хөгжүүлэлтийн Орчин

### Backend хөгжүүлэлт (локал)

```bash
cd backend

# Virtual environment үүсгэх
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Dependencies суулгах
pip install -r requirements.txt

# PostgreSQL болон ChromaDB ажиллаж байгаа эсэхийг шалгах
# (Docker Compose ашиглаж болно)

# Database migration
alembic upgrade head

# Development server эхлүүлэх
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend хөгжүүлэлт (локал)

```bash
cd frontend

# Dependencies суулгах
npm install

# Development server эхлүүлэх
npm run dev
```

---

## 🌐 API Endpoints

### Authentication

| Method | Endpoint | Тайлбар |
|--------|----------|---------|
| POST | `/api/auth/register` | Шинэ хэрэглэгч бүртгэх |
| POST | `/api/auth/login` | Нэвтрэх (JWT token авах) |
| GET | `/api/auth/me` | Одоогийн хэрэглэгчийн мэдээлэл |

### Documents

| Method | Endpoint | Тайлбар |
|--------|----------|---------|
| POST | `/api/documents/upload` | Баримт оруулах (PDF/Word) |
| GET | `/api/documents` | Хэрэглэгчийн бүх баримт |
| GET | `/api/documents/{id}` | Тодорхой баримтын мэдээлэл |
| DELETE | `/api/documents/{id}` | Баримт устгах |

### Chat

| Method | Endpoint | Тайлбар |
|--------|----------|---------|
| POST | `/api/chat/sessions` | Шинэ чат session үүсгэх |
| GET | `/api/chat/sessions` | Хэрэглэгчийн бүх session |
| GET | `/api/chat/sessions/{id}` | Session-ий мессежүүд |
| POST | `/api/chat/message` | Асуулт илгээх, хариулт авах |
| DELETE | `/api/chat/sessions/{id}` | Session устгах |

---

## 🧠 RAG Pipeline

### 1. Document Ingestion (Баримт оруулах)

```
┌─────────────┐
│ PDF/Word    │
│ Upload      │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Text Extraction     │
│ - PyPDF2 (PDF)      │
│ - python-docx (Word)│
└──────┬──────────────┘
       │
       ▼
┌─────────────────────────────┐
│ Text Chunking               │
│ - RecursiveCharacterText    │
│   TextSplitter              │
│ - Chunk size: 1000 chars    │
│ - Overlap: 200 chars        │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ Embedding Generation        │
│ - Gemini Embedding API      │
│ - Model: embedding-001      │
│ - Dimension: 768            │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ Store in ChromaDB           │
│ - Vector + Metadata         │
└─────────────────────────────┘
```

### 2. Query Processing (Асуулт боловсруулах)

```
┌─────────────┐
│ User Query  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│ Query Embedding             │
│ - Gemini Embedding API      │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ Similarity Search           │
│ - ChromaDB query            │
│ - top_k = 5                 │
│ - Cosine similarity         │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ Context Preparation         │
│ - Combine retrieved chunks  │
│ - Add metadata              │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ Prompt Construction         │
│ - System prompt             │
│ - Context                   │
│ - User question             │
│ - Chat history (optional)   │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ LLM Generation              │
│ - Gemini Pro API            │
│ - Temperature: 0.7          │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ Response + Sources          │
│ - Answer text               │
│ - Source documents          │
│ - Confidence score          │
└─────────────────────────────┘
```

### Prompt Template

```python
SYSTEM_PROMPT = """
Та техникийн баримт бичгийн мэргэжилтэн юм. 
Доорх контекст дээр үндэслэн хэрэглэгчийн асуултад 
оновчтой, тодорхой хариулт өгнө үү.

Хэрэв контекст дээр хариулт байхгүй бол 
"Уучлаарай, энэ асуултын хариултыг баримт бичигт олсонгүй" гэж хэлнэ үү.

Контекст:
{context}

Чат түүх:
{chat_history}
"""

USER_PROMPT = """
Асуулт: {question}
"""
```

---

## 📁 Төслийн Бүтэц

```
aero-doc-ai/
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI application
│   │   ├── config.py                  # Settings (Pydantic BaseSettings)
│   │   ├── database.py                # PostgreSQL connection
│   │   │
│   │   ├── models/                    # SQLAlchemy ORM models
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── document.py
│   │   │   ├── chat.py
│   │   │
│   │   ├── schemas/                   # Pydantic schemas (request/response)
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── document.py
│   │   │   ├── chat.py
│   │   │
│   │   ├── services/                  # Business logic
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py        # JWT, password hashing
│   │   │   ├── document_service.py    # File processing
│   │   │   ├── rag_service.py         # LangChain + Gemini
│   │   │   ├── chat_service.py        # Chat management
│   │   │   ├── vector_store.py        # ChromaDB wrapper
│   │   │
│   │   ├── routers/                   # API endpoints
│   │   │   ├── __init__.py
│   │   │   ├── auth.py                # /api/auth/*
│   │   │   ├── documents.py           # /api/documents/*
│   │   │   ├── chat.py                # /api/chat/*
│   │   │
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── security.py            # Password utilities
│   │       ├── embeddings.py          # Gemini embedding wrapper
│   │       ├── parsers.py             # PDF/Word parsers
│   │
│   ├── alembic/                       # Database migrations
│   │   ├── versions/
│   │   └── env.py
│   │
│   ├── tests/
│   │   ├── test_auth.py
│   │   ├── test_documents.py
│   │   └── test_rag.py
│   │
│   ├── uploads/                       # Uploaded files (local storage)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── alembic.ini
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx               # Landing page
│   │   │   ├── globals.css
│   │   │   │
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── register/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   └── dashboard/
│   │   │       ├── layout.tsx
│   │   │       ├── page.tsx           # Main chat interface
│   │   │       ├── history/
│   │   │       │   └── page.tsx       # Chat history
│   │   │       └── documents/
│   │   │           └── page.tsx       # Document management
│   │   │
│   │   ├── components/
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   ├── DocumentUpload.tsx
│   │   │   ├── DocumentList.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── SourceCard.tsx
│   │   │
│   │   ├── lib/
│   │   │   ├── api.ts                 # Axios instance
│   │   │   ├── auth.ts                # JWT handling
│   │   │   └── types.ts               # TypeScript types
│   │   │
│   │   └── hooks/
│   │       ├── useAuth.ts
│   │       ├── useChat.ts
│   │       └── useDocuments.ts
│   │
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── next.config.js
│   └── Dockerfile
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## ⚙️ Тохиргоо

### Gemini API Key авах

1. [Google AI Studio](https://ai.google.dev) руу орох
2. "Get API Key" дарах
3. API key-г хуулж, `.env` файлд оруулах

### ChromaDB тохиргоо

```python
# backend/app/services/vector_store.py
import chromadb

client = chromadb.HttpClient(
    host=settings.CHROMA_HOST,
    port=settings.CHROMA_PORT
)

collection = client.get_or_create_collection(
    name="technical_documents",
    metadata={"hnsw:space": "cosine"}
)
```

### Text Chunking параметрүүд

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,        # Chunk-ийн хэмжээ
    chunk_overlap=200,      # Давхцал
    length_function=len,
    separators=["\n\n", "\n", " ", ""]
)
```

### LLM параметрүүд

```python
from langchain_google_genai import ChatGoogleGenerativeAI

llm = ChatGoogleGenerativeAI(
    model="gemini-pro",
    temperature=0.7,        # Creativity (0.0-1.0)
    max_output_tokens=2048,
    google_api_key=settings.GEMINI_API_KEY
)
```

---
## 🔒 Аюулгүй Байдал

- ✅ JWT token-based authentication
- ✅ Password bcrypt hashing
- ✅ CORS тохиргоо
- ✅ Rate limiting (FastAPI middleware)
- ✅ Input validation (Pydantic)
- ✅ SQL injection prevention (SQLAlchemy ORM)
- ✅ File upload validation (file type, size)

---

## 🐛 Алдаа засах

### Backend logs харах

```bash
docker-compose logs -f backend
```

### Database шалгах

```bash
docker-compose exec postgres psql -U postgres -d aerodoc


### ChromaDB шалгах

```bash
# ChromaDB collection-ууд харах
curl http://localhost:8001/api/v1/collections
```

---

## 📚 Нэмэлт Материал

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [LangChain Documentation](https://python.langchain.com/)
- [Google Gemini API](https://ai.google.dev/docs)
- [ChromaDB Documentation](https://docs.trychroma.com/)
- [Next.js Documentation](https://nextjs.org/docs)
