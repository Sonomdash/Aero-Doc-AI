# Service Code Тайлбар: 3 Үндсэн Service

Энэ баримт нь Aero-Doc-AI системийн 3 үндсэн service файлуудыг дэлгэрэнгүй тайлбарлана:
1. `document_service.py` - Файл боловсруулалт
2. `vector_store.py` - Vector database
3. `chat_service.py` - RAG chat logic

---

## 📄 1. DocumentService (`document_service.py`)

### 🎯 Зорилго

Файл upload хийгдсэний дараа **текстийг задлаж, chunk хийж, embedding үүсгэж, ChromaDB-д хадгалах** үүрэгтэй.

### 🏗 Class Бүтэц

```python
class DocumentService:
    def __init__(self):
        self.embeddings = GeminiEmbeddings()
        self.vector_store = VectorStore()
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,        # 1000
            chunk_overlap=settings.CHUNK_OVERLAP,  # 200
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
```

#### Яагаад Эдгээр Component Ашигласан вэ?

| Component | Яагаад | Үр Дүн |
|-----------|--------|--------|
| **GeminiEmbeddings** | Текстийг vector болгох | 384-dim embeddings |
| **VectorStore** | ChromaDB-тай ажиллах | Vector хадгалалт, хайлт |
| **RecursiveCharacterTextSplitter** | Текстийг chunk хийх | Оновчтой хэмжээтэй chunk-ууд |

---

### 📝 Үндсэн Функцууд

#### 1. `upload_document()` - Файл Upload

```python
async def upload_document(self, db: Session, user: User, file: UploadFile) -> Document:
```

**Үйл явц:**

```
1. Validate File Type
   ↓
2. Validate File Size
   ↓
3. Save to Disk
   ↓
4. Create DB Record
   ↓
5. Process Document
```

**Код Дэлгэрэнгүй:**

##### Алхам 1-2: Validation

```python
# File type шалгах
file_ext = os.path.splitext(file.filename)[1].lower()
if file_ext not in ['.pdf', '.docx', '.doc']:
    raise HTTPException(status_code=400, detail=f"Unsupported file type")
```

**Яагаад:**
- Зөвхөн PDF болон Word файл дэмжинэ
- Бусад файл төрөл (image, video) боловсруулж чадахгүй
- Аюулгүй байдлын шалтгаан

**Үр дүн:**
- ✅ Зөвшөөрөгдсөн файл → Үргэлжлүүлнэ
- ❌ Буруу төрөл → 400 error

```python
# File size шалгах
file.file.seek(0, 2)  # Төгсгөл рүү очих
file_size = file.file.tell()  # Хэмжээг авах
file.file.seek(0)  # Эхлэл рүү буцах

if file_size > settings.MAX_UPLOAD_SIZE:  # 10MB
    raise HTTPException(status_code=400, detail="File too large")
```

**Яагаад:**
- Хэт том файл server-ийн memory дүүргэнэ
- Processing удаан болно
- 10MB хязгаар тохиромжтой

**Үр дүн:**
- ✅ ≤10MB → Үргэлжлүүлнэ
- ❌ >10MB → 400 error

##### Алхам 3: Disk-д Хадгалах

```python
file_path = os.path.join(settings.UPLOAD_DIR, f"{user.id}_{file.filename}")
with open(file_path, "wb") as buffer:
    shutil.copyfileobj(file.file, buffer)
```

**Яагаад:**
- Файлын бодит агуулгыг хадгалах хэрэгтэй
- Дахин processing хийх боломжтой
- Хэрэглэгч татаж авах боломжтой

**Үр дүн:**
```
./uploads/123e4567-e89b-12d3-a456-426614174000_manual.pdf
```

##### Алхам 4: Database Record

```python
document = Document(
    user_id=user.id,
    filename=file.filename,
    file_type=file_ext.replace('.', ''),
    file_path=file_path,
    file_size=file_size,
    processed=False  # Хараахан боловсруулаагүй
)
db.add(document)
db.commit()
```

**Яагаад:**
- Файлын metadata хадгалах
- Processing статус хянах
- User-тай холбох

**Үр дүн:**
```sql
INSERT INTO documents (id, user_id, filename, file_type, file_path, file_size, processed)
VALUES ('uuid', 'user-uuid', 'manual.pdf', 'pdf', './uploads/...', 1024000, false);
```

---

#### 2. `process_document()` - Файл Боловсруулалт

Энэ нь **хамгийн чухал функц** юм!

```python
async def process_document(self, db: Session, document: Document) -> None:
```

**Үйл явц:**

```
Text Extraction
    ↓
Text Chunking
    ↓
Embedding Generation
    ↓
Metadata Preparation
    ↓
Vector Store
    ↓
Update Status
```

##### Алхам 1: Text Extraction

```python
text, page_count = DocumentParser.parse_document(
    document.file_path,
    document.file_type
)
```

**Яагаад:**
- PDF/Word файлаас текст задлах хэрэгтэй
- AI зөвхөн текстээр ажиллана

**Үр дүн:**
```python
text = "Installation Guide\n\nStep 1: Download the software...\nStep 2: Run the installer..."
page_count = 15
```

**Хэрэгжүүлэлт:**
- PDF: PyPDF2 эсвэл pdfplumber
- DOCX: python-docx

##### Алхам 2: Text Chunking

```python
chunks = self.text_splitter.split_text(text)
```

**Яагаад chunk хийх вэ?**

| Асуудал | Шийдэл |
|---------|--------|
| Бүх текстийг нэг дор embedding хийж болохгүй | Chunk-аар хуваах |
| LLM-д хэт урт context өгч болохгүй | Жижиг хэсгүүд |
| Semantic search нарийвчлалтай байх ёстой | Тодорхой хэсэг олох |

**Chunk Parameters:**

```python
chunk_size=1000        # 1000 тэмдэгт
chunk_overlap=200      # 200 тэмдэгт давхцал
separators=["\n\n", "\n", " ", ""]
```

**Яагаад эдгээр утга вэ?**

- **1000 тэмдэгт**: Хангалттай контекст агуулна, embedding-д тохиромжтой
- **200 давхцал**: Chunk хоорондын холбоо алдагдахгүй
- **Separators**: Догол мөр → мөр → зай дарааллаар хуваана (утга санаа хадгална)

**Үр дүн:**
```python
chunks = [
    "Installation Guide\n\nStep 1: Download the software from...",
    "...from our website. Step 2: Run the installer and follow...",
    "...follow the on-screen instructions. Step 3: Configure..."
]
# Нийт: 15 chunk
```

##### Алхам 3: Embedding Generation

```python
embeddings = self.embeddings.embed_batch(chunks)
```

**Яагаад:**
- Chunk бүрийг vector болгох
- Semantic search хийх боломжтой болно

**Үр дүн:**
```python
embeddings = [
    [0.123, -0.456, 0.789, ..., 0.234],  # Chunk 1 (384-dim)
    [0.234, -0.567, 0.891, ..., 0.345],  # Chunk 2 (384-dim)
    [0.345, -0.678, 0.912, ..., 0.456],  # Chunk 3 (384-dim)
    # ... 15 chunk
]
```

**Performance:**
- 15 chunk × ~100ms = ~1.5 секунд (CPU дээр)
- Batch processing ашигласан учраас хурдан

##### Алхам 4: Metadata Preparation

```python
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
```

**Яагаад metadata хэрэгтэй вэ?**

| Metadata | Зорилго |
|----------|---------|
| `doc_id` | Chunk-ыг баримттай холбох |
| `filename` | Эх сурвалж харуулах |
| `chunk_index` | Chunk-ын дараалал |
| `total_chunks` | Нийт chunk тоо |
| `user_id` | User isolation |

**Үр дүн:**
```python
[
    {"doc_id": "uuid", "filename": "manual.pdf", "chunk_index": 0, "total_chunks": 15, "user_id": "user-uuid"},
    {"doc_id": "uuid", "filename": "manual.pdf", "chunk_index": 1, "total_chunks": 15, "user_id": "user-uuid"},
    ...
]
```

##### Алхам 5: Vector Store

```python
self.vector_store.add_documents(
    doc_id=document.id,
    chunks=chunks,
    embeddings=embeddings,
    metadatas=metadatas
)
```

**Яагаад:**
- ChromaDB-д хадгалах
- Similarity search хийх боломжтой болно

**Үр дүн:**
- ChromaDB-д 15 chunk хадгалагдана
- Chunk бүр: текст + embedding + metadata

##### Алхам 6: Update Status

```python
document.processed = True
document.chunk_count = len(chunks)
document.error_message = None
db.commit()
```

**Яагаад:**
- Processing дууссаныг тэмдэглэх
- Frontend-д статус харуулах
- Chunk тоог хадгалах

**Үр дүн:**
```sql
UPDATE documents 
SET processed = true, chunk_count = 15, error_message = null
WHERE id = 'uuid';
```

---

#### 3. `delete_document()` - Файл Устгах

```python
def delete_document(self, db: Session, doc_id: UUID, user_id: UUID) -> None:
```

**3 газраас устгана:**

```python
# 1. Vector store-с
self.vector_store.delete_document(doc_id)

# 2. Disk-с
if os.path.exists(document.file_path):
    os.remove(document.file_path)

# 3. Database-с
db.delete(document)
db.commit()
```

**Яагаад 3 газар вэ?**
- Файл 3 газар хадгалагдсан учраас
- Бүгдийг нь устгах ёстой
- Өгөгдөл алдагдахгүй байх

---

## 🔢 2. VectorStore (`vector_store.py`)

### 🎯 Зорилго

**ChromaDB**-тай ажиллах wrapper class. Vector хадгалалт болон similarity search хийнэ.

### 🏗 Class Бүтэц

```python
class VectorStore:
    def __init__(self):
        self.client = chromadb.HttpClient(
            host=settings.CHROMA_HOST,  # "localhost"
            port=settings.CHROMA_PORT,  # 8000
            settings=Settings(anonymized_telemetry=False)
        )
        self.collection_name = "technical_documents"
        self.collection = self._get_or_create_collection()
```

#### Яагаад ChromaDB вэ?

| Давуу тал | Тайлбар |
|-----------|---------|
| **Open Source** | Үнэгүй, локал дээр ажиллана |
| **Python-friendly** | Хялбар интеграц |
| **HTTP API** | Docker-д ажиллуулж болно |
| **Cosine similarity** | Semantic search-д тохиромжтой |
| **Metadata filter** | User isolation хялбар |

#### Яагаад HttpClient вэ?

```python
chromadb.HttpClient(host="localhost", port=8000)
```

**Шалтгаан:**
- ChromaDB тусдаа server-д ажиллана
- Docker container-д байна
- Backend-с HTTP-ээр холбогдоно

**Үр дүн:**
- Scalable: ChromaDB-г тусдаа scale хийж болно
- Isolation: ChromaDB унавал backend үргэлжлэх
- Multi-instance: Олон backend нэг ChromaDB ашиглаж болно

---

### 📝 Үндсэн Функцууд

#### 1. `_get_or_create_collection()` - Collection Үүсгэх

```python
def _get_or_create_collection(self):
    try:
        collection = self.client.get_collection(name=self.collection_name)
    except:
        collection = self.client.create_collection(
            name=self.collection_name,
            metadata={"hnsw:space": "cosine"}
        )
    return collection
```

**Яагаад try/except вэ?**
- Collection байвал авах
- Байхгүй бол үүсгэх
- Idempotent operation

**`hnsw:space: cosine` гэж юу вэ?**

| Parameter | Утга |
|-----------|------|
| **HNSW** | Hierarchical Navigable Small World - хурдан similarity search algorithm |
| **Cosine** | Cosine similarity ашиглана |

**Яагаад Cosine вэ?**
- Normalized vector-д тохиромжтой
- Angle-based similarity (direction)
- Embedding-д стандарт

**Үр дүн:**
```
Collection: "technical_documents"
Distance metric: Cosine
Index: HNSW (fast approximate nearest neighbor)
```

---

#### 2. `add_documents()` - Vector Хадгалах

```python
def add_documents(
    self,
    doc_id: UUID,
    chunks: List[str],
    embeddings: List[List[float]],
    metadatas: List[Dict[str, Any]]
) -> None:
    ids = [f"{doc_id}_{i}" for i in range(len(chunks))]
    
    self.collection.add(
        ids=ids,
        documents=chunks,
        embeddings=embeddings,
        metadatas=metadatas
    )
```

**Параметрүүд:**

| Parameter | Жишээ | Зорилго |
|-----------|-------|---------|
| `ids` | `["uuid_0", "uuid_1", ...]` | Unique identifier |
| `documents` | `["chunk text 1", ...]` | Бодит текст |
| `embeddings` | `[[0.1, 0.2, ...], ...]` | 384-dim vectors |
| `metadatas` | `[{"filename": "..."}, ...]` | Нэмэлт мэдээлэл |

**Яагаад ID format `{doc_id}_{i}` вэ?**
- Chunk бүр unique ID авна
- Document-оор нь олж устгаж болно
- Chunk index мэдэгдэнэ

**Үр дүн:**
```
ChromaDB-д хадгалагдсан:
- 15 chunk
- 15 embedding (384-dim each)
- 15 metadata
```

---

#### 3. `search()` - Similarity Search

Энэ нь **RAG-ын гол функц** юм!

```python
def search(
    self,
    query_embedding: List[float],
    top_k: int = 5,
    filter_metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
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
```

**Үйл явц:**

```
Query Embedding
    ↓
ChromaDB HNSW Index
    ↓
Cosine Similarity
    ↓
Top-K Results
    ↓
Return
```

**Жишээ:**

```python
# Input
query_embedding = [0.5, 0.3, 0.8, ..., 0.2]  # 384-dim
top_k = 5

# ChromaDB дотор
# Chunk 1: [0.52, 0.29, 0.81, ...] → distance: 0.02 (маш ойр!)
# Chunk 2: [0.1, 0.9, 0.2, ...] → distance: 0.85 (холдуу)
# Chunk 3: [0.51, 0.31, 0.79, ...] → distance: 0.03 (ойр)
# ...

# Output
{
    "ids": ["uuid_5", "uuid_0", "uuid_12", "uuid_3", "uuid_8"],
    "documents": [
        "Installation steps: 1. Download...",
        "To install the software...",
        "Setup instructions for...",
        "Installation guide...",
        "Software installation..."
    ],
    "metadatas": [
        {"filename": "manual.pdf", "chunk_index": 5},
        {"filename": "manual.pdf", "chunk_index": 0},
        {"filename": "guide.pdf", "chunk_index": 12},
        ...
    ],
    "distances": [0.02, 0.03, 0.05, 0.08, 0.12]
}
```

**Яагаад top_k=5 вэ?**
- Хангалттай контекст
- Хэт олон бол irrelevant мэдээлэл орно
- LLM-д багтана

**filter_metadata гэж юу вэ?**

```python
# User-specific search
filter_metadata = {"user_id": "user-uuid"}
```

**Үр дүн:**
- Зөвхөн тухайн хэрэглэгчийн баримтаас хайна
- User isolation

---

#### 4. `delete_document()` - Vector Устгах

```python
def delete_document(self, doc_id: UUID) -> None:
    # Document-ын бүх chunk-ыг олох
    results = self.collection.get(
        where={"doc_id": str(doc_id)}
    )
    
    # Устгах
    if results['ids']:
        self.collection.delete(ids=results['ids'])
```

**Үйл явц:**

```
1. Metadata-аар хайх (doc_id)
2. Бүх chunk ID авах
3. Chunk бүрийг устгах
```

**Үр дүн:**
```
Document-ын 15 chunk бүгд ChromaDB-с устана
```

---

## 💬 3. ChatService (`chat_service.py`)

### 🎯 Зорилго

**RAG pipeline**-ийн гол logic. Хэрэглэгчийн асуултад хариулах.

### 🏗 Class Бүтэц

```python
class ChatService:
    def __init__(self):
        self.vector_store = VectorStore()
        self.embeddings = GeminiEmbeddings()
        
        self.llm = ChatGroq(
            model=settings.LLM_MODEL,  # "llama-3.3-70b-versatile"
            api_key=settings.GROQ_API_KEY,
            temperature=0.7
        )
        
        self.system_prompt = """..."""
```

#### Яагаад Groq вэ?

| Давуу тал | Тайлбар |
|-----------|---------|
| **Хурдан** | LPU технологи - дэлхийн хамгийн хурдан inference |
| **Үнэгүй** | Free tier бага хязгаартай |
| **Чанартай** | Llama 3.3 70B - маш ухаалаг |
| **API** | Хялбар интеграц |

#### Яагаад temperature=0.7 вэ?

```python
temperature=0.7  # 0.0-1.0
```

| Утга | Үр дүн |
|------|--------|
| **0.0** | Deterministic, ижил асуултад ижил хариулт |
| **0.7** | Креатив боловч хяналттай |
| **1.0** | Маш креатив, санамсаргүй |

**0.7 сонгосон шалтгаан:**
- Техникийн баримтад тодорхой байх ёстой
- Гэхдээ жаахан уян хатан байх нь сайн
- Стандарт утга

---

### 📝 Үндсэн Функцууд

#### 1. `send_message()` - RAG Pipeline

Энэ нь **хамгийн чухал функц** юм!

```python
async def send_message(
    self, 
    db: Session, 
    user_id: UUID, 
    session_id: UUID, 
    content: str
) -> ChatMessage:
```

**7 Алхам:**

```
1. Validate Session
2. Save User Message
3. Query Embedding
4. Vector Search
5. Context Preparation
6. LLM Generation
7. Save Assistant Message
```

##### Алхам 1: Validate Session

```python
session = self.get_session(db, session_id, user_id)
```

**Яагаад:**
- Session байгаа эсэхийг шалгах
- User эзэмшиж байгаа эсэхийг шалгах
- Аюулгүй байдал

**Үр дүн:**
- ✅ Session олдсон → Үргэлжлүүлнэ
- ❌ Олдоогүй → 404 error

##### Алхам 2: Save User Message

```python
user_msg = ChatMessage(
    session_id=session_id,
    role="user",
    content=content
)
db.add(user_msg)
db.commit()
```

**Яагаад:**
- Түүх хадгалах
- Хэрэглэгч хариултаа харах
- Audit trail

**Үр дүн:**
```sql
INSERT INTO chat_messages (session_id, role, content)
VALUES ('session-uuid', 'user', 'How do I install the software?');
```

##### Алхам 3: Query Embedding

```python
query_embedding = self.embeddings.embed_query(content)
```

**Яагаад:**
- Асуултыг vector болгох
- Vector search хийх боломжтой болно

**Үр дүн:**
```python
query_embedding = [0.329, 0.271, ..., 0.214]  # 384-dim
```

##### Алхам 4: Vector Search

```python
search_results = self.vector_store.search(
    query_embedding=query_embedding,
    top_k=5
)
```

**Яагаад:**
- Холбогдох баримтын хэсгүүдийг олох
- Semantic similarity ашиглана

**Үр дүн:**
```python
{
    "documents": [
        "To install the software, first download...",
        "Installation steps: 1. Run installer...",
        "Setup guide: Begin by downloading...",
        "Installation requirements: Python 3.8+...",
        "Quick start: Download and install..."
    ],
    "metadatas": [
        {"filename": "manual.pdf", "chunk_index": 5},
        {"filename": "guide.pdf", "chunk_index": 2},
        ...
    ],
    "distances": [0.02, 0.05, 0.08, 0.12, 0.15]
}
```

##### Алхам 5: Context Preparation

```python
context_parts = []
sources = []

docs = search_results.get("documents", [])
metas = search_results.get("metadatas", [])

for i, doc_text in enumerate(docs):
    meta = metas[i] if i < len(metas) else {}
    filename = meta.get("filename", "Unknown")
    context_parts.append(f"Source: {filename}\nContent: {doc_text}")
    
    source_entry = {
        "doc_id": meta.get("doc_id"),
        "filename": filename,
        "chunk_index": meta.get("chunk_index"),
        "page_number": meta.get("page_number")
    }
    if source_entry not in sources:
        sources.append(source_entry)

context_str = "\n\n".join(context_parts)
```

**Яагаад:**
- LLM-д өгөх контекст бэлтгэх
- Эх сурвалж хадгалах

**Үр дүн:**
```
Source: manual.pdf
Content: To install the software, first download...

Source: guide.pdf
Content: Installation steps: 1. Run installer...

Source: manual.pdf
Content: Setup guide: Begin by downloading...

Source: guide.pdf
Content: Installation requirements: Python 3.8+...

Source: manual.pdf
Content: Quick start: Download and install...
```

##### Алхам 6: LLM Generation

```python
messages = [
    SystemMessage(content=self.system_prompt.format(context=context_str)),
    HumanMessage(content=content)
]

response = self.llm.invoke(messages)
answer_text = response.content
```

**System Prompt:**

```
You are Aero-Doc AI, an intelligent assistant designed to help users 
understand their technical documents.

Use the following pieces of retrieved context to answer the user's question.

Guidelines:
1. Base your answer ONLY on the provided context.
2. If the answer is not in the context, say "I cannot find the answer..."
3. Cite the source document filenames when possible.
4. Keep answers concise and professional.

Context:
[олдсон chunk-ууд энд]
```

**Яагаад энэ prompt вэ?**

| Guideline | Шалтгаан |
|-----------|----------|
| **ONLY context** | Хуурамч мэдээлэл үүсгэхгүй байх |
| **Cannot find** | Хариулт байхгүй бол хэлэх |
| **Cite sources** | Эх сурвалж харуулах |
| **Concise** | Товч, тодорхой |

**Groq API Call:**

```python
# Request
POST https://api.groq.com/openai/v1/chat/completions
{
    "model": "llama-3.3-70b-versatile",
    "messages": [
        {"role": "system", "content": "..."},
        {"role": "user", "content": "How do I install the software?"}
    ],
    "temperature": 0.7
}

# Response (0.5 секунд!)
{
    "choices": [{
        "message": {
            "content": "To install the software, follow these steps:\n\n1. Download the installer from the official website\n2. Run the installer executable\n3. Follow the on-screen instructions\n4. Ensure you have Python 3.8 or higher installed\n\nSource: manual.pdf, guide.pdf"
        }
    }]
}
```

**Үр дүн:**
```
answer_text = "To install the software, follow these steps:..."
```

##### Алхам 7: Save Assistant Message

```python
assistant_msg = ChatMessage(
    session_id=session_id,
    role="assistant",
    content=answer_text,
    sources=sources  # JSONB
)
db.add(assistant_msg)

# Session title шинэчлэх
if session.title == "New Chat":
    session.title = content[:30] + "..."

db.commit()
db.refresh(assistant_msg)

return assistant_msg
```

**Яагаад:**
- Хариултыг хадгалах
- Эх сурвалж хадгалах
- Session title шинэчлэх

**Үр дүн:**
```sql
INSERT INTO chat_messages (session_id, role, content, sources)
VALUES (
    'session-uuid',
    'assistant',
    'To install the software, follow these steps:...',
    '[{"filename": "manual.pdf", "chunk_index": 5}, ...]'::jsonb
);

UPDATE chat_sessions
SET title = 'How do I install the softw...'
WHERE id = 'session-uuid' AND title = 'New Chat';
```

---

## 📊 Бүтэн Үйл Явцын Жишээ

### Хэрэглэгчийн Асуулт

```
"How do I reset my password?"
```

### 1. DocumentService (Upload үед)

```
PDF Upload
    ↓
Text: "Password Reset\n\nTo reset your password, go to Settings > Security..."
    ↓
Chunks: [
    "Password Reset\n\nTo reset your password, go to...",
    "...go to Settings > Security and click Reset Password...",
    "...click Reset Password. Enter your email and..."
]
    ↓
Embeddings: [
    [0.7, 0.6, 0.5, ...],  # "password reset" semantic
    [0.71, 0.59, 0.51, ...],
    [0.69, 0.61, 0.49, ...]
]
    ↓
ChromaDB: 3 chunks хадгалагдана
```

### 2. VectorStore (Search үед)

```
Query: "How do I reset my password?"
    ↓
Query Embedding: [0.68, 0.62, 0.48, ...]
    ↓
ChromaDB Search:
    - Chunk 1: distance 0.02 (маш ойр!)
    - Chunk 2: distance 0.03
    - Chunk 3: distance 0.05
    ↓
Top-3 Results буцаана
```

### 3. ChatService (Response үед)

```
Context:
"Source: user_guide.pdf
Content: Password Reset\n\nTo reset your password, go to...

Source: user_guide.pdf
Content: ...go to Settings > Security and click Reset Password...

Source: user_guide.pdf
Content: ...click Reset Password. Enter your email and..."
    ↓
LLM Prompt:
System: "You are Aero-Doc AI... Context: [дээрх context]"
User: "How do I reset my password?"
    ↓
Groq API (Llama 3.3 70B):
    ↓
Response:
"To reset your password:
1. Go to Settings > Security
2. Click Reset Password
3. Enter your email address
4. Follow the instructions sent to your email

Source: user_guide.pdf"
    ↓
Save to Database
```

---

## 🎯 Хураангуй

### DocumentService

| Функц | Зорилго | Үр Дүн |
|--------|---------|--------|
| `upload_document()` | Файл хадгалах, боловсруулах | Disk + DB + ChromaDB |
| `process_document()` | Текст задлах, chunk, embed | Vector database бэлэн |
| `delete_document()` | Бүх газраас устгах | Цэвэр устгал |

### VectorStore

| Функц | Зорилго | Үр Дүн |
|--------|---------|--------|
| `add_documents()` | Vector хадгалах | ChromaDB-д chunk-ууд |
| `search()` | Similarity search | Top-K холбогдох chunk-ууд |
| `delete_document()` | Vector устгах | ChromaDB-с цэвэрлэх |

### ChatService

| Функц | Зорилго | Үр Дүн |
|--------|---------|--------|
| `send_message()` | RAG pipeline | AI хариулт + эх сурвалж |
| `create_session()` | Session үүсгэх | Шинэ чат |
| `get_user_sessions()` | Түүх авах | Бүх session-ууд |

---

## 🔗 Холбоотой Файлууд

- [document_service.py](file:///Users/soonko/Documents/Dentsv/Aero-Doc-AI/backend/app/services/document_service.py)
- [vector_store.py](file:///Users/soonko/Documents/Dentsv/Aero-Doc-AI/backend/app/services/vector_store.py)
- [chat_service.py](file:///Users/soonko/Documents/Dentsv/Aero-Doc-AI/backend/app/services/chat_service.py)

---

Энэ тайлбар нь 3 үндсэн service файлуудын бүрэн дэлгэрэнгүй мэдээллийг агуулсан болно! 🚀
