# Aero-Doc AI - Эхлүүлэх Заавар

## 1. Gemini API Key Авах

### Алхам 1: Google AI Studio руу орох
1. Браузер нээж [https://ai.google.dev](https://ai.google.dev) руу орно
2. Google account-аараа нэвтэрнэ
3. "Get API Key" товч дарна

### Алхам 2: API Key үүсгэх
1. "Create API Key" дарна
2. Төсөл сонгох (эсвэл шинээр үүсгэх)
3. API key хуулна (жишээ: `AIzaSyC...`)

### Алхам 3: `.env` файлд оруулах
```bash
# Төслийн үндсэн директорт
cd /Users/soonko/Documents/Dentsv/Aero-Doc-AI

# .env файлыг засах
nano .env
# эсвэл
code .env
```

`.env` файлд дараах мөрийг олж, өөрийн API key-г оруулна:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Өөрчлөх:
```env
GEMINI_API_KEY=AIzaSyC_YOUR_ACTUAL_KEY_HERE
```

### Алхам 4: SECRET_KEY үүсгэх
JWT-д зориулсан аюулгүй түлхүүр үүсгэх:

```bash
# Python ашиглан random key үүсгэх
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

Гарсан үр дүнг `.env` файлд оруулна:
```env
SECRET_KEY=your_generated_secret_key_here
```

---

## 2. Docker Эхлүүлэх

### Шаардлагатай зүйлс шалгах
```bash
# Docker суусан эсэхийг шалгах
docker --version
docker-compose --version
```

Хэрэв суугаагүй бол:
- Mac: [https://docs.docker.com/desktop/install/mac-install/](https://docs.docker.com/desktop/install/mac-install/)

### Бүх service-үүдийг эхлүүлэх
```bash
cd /Users/soonko/Documents/Dentsv/Aero-Doc-AI

# Build хийж, эхлүүлэх
docker-compose up --build

# Эсвэл background-д ажиллуулах
docker-compose up -d --build
```

### Logs харах
```bash
# Бүх service-ийн logs
docker-compose logs -f

# Зөвхөн backend
docker-compose logs -f backend

# Зөвхөн postgres
docker-compose logs -f postgres
```

---

## 3. Шалгах

### Service-үүд ажиллаж байгаа эсэхийг шалгах
```bash
docker-compose ps
```

Дараах зүйлс харагдах ёстой:
```
NAME                   STATUS    PORTS
aerodoc-backend        Up        0.0.0.0:8000->8000/tcp
aerodoc-chromadb       Up        0.0.0.0:8001->8000/tcp
aerodoc-postgres       Up        0.0.0.0:5432->5432/tcp
aerodoc-frontend       Up        0.0.0.0:3000->3000/tcp
```

### Browser-ээр шалгах
- **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Backend Health**: [http://localhost:8000/health](http://localhost:8000/health)
- **ChromaDB**: [http://localhost:8001](http://localhost:8001)

---

## 4. API Тест Хийх

### 4.1 User Registration
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "full_name": "Test User"
  }'
```

Амжилттай бол:
```json
{
  "id": "uuid-here",
  "email": "test@example.com",
  "full_name": "Test User",
  "created_at": "2025-12-08T..."
}
```

### 4.2 User Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Амжилттай бол:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Token-г хуулж авна!**

### 4.3 Get Current User
```bash
# TOKEN-г дээрх login-ээс авсан утгаар солих
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Амжилттай бол:
```json
{
  "id": "uuid-here",
  "email": "test@example.com",
  "full_name": "Test User",
  "created_at": "2025-12-08T..."
}
```

---

## 5. Database Шалгах

### PostgreSQL руу холбогдох
```bash
docker-compose exec postgres psql -U postgres -d aerodoc
```

### Tables харах
```sql
\dt

-- Үр дүн:
--  users
--  documents
--  chat_sessions
--  chat_messages
```

### Users харах
```sql
SELECT * FROM users;
```

### Гарах
```sql
\q
```

---

## 6. Зогсоох / Устгах

### Service-үүдийг зогсоох
```bash
docker-compose stop
```

### Service-үүдийг устгах (data хадгална)
```bash
docker-compose down
```

### Бүгдийг устгах (data ч устгана)
```bash
docker-compose down -v
```

---

## 7. Алдаа Засах

### Backend container ажиллахгүй байвал
```bash
# Logs харах
docker-compose logs backend

# Container дотор орох
docker-compose exec backend bash

# Dependencies шалгах
pip list
```

### PostgreSQL холбогдохгүй байвал
```bash
# PostgreSQL logs
docker-compose logs postgres

# Connection шалгах
docker-compose exec postgres pg_isready -U postgres
```

### ChromaDB ажиллахгүй байвал
```bash
# ChromaDB logs
docker-compose logs chromadb

# Health check
curl http://localhost:8001/api/v1/heartbeat
```

---

## 8. Development Mode

### Backend-г локал дээр ажиллуулах (Docker-гүйгээр)
```bash
cd backend

# Virtual environment
python3 -m venv venv
source venv/bin/activate

# Dependencies
pip install -r requirements.txt

# Database migration
alembic upgrade head

# Run server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Анхаар**: PostgreSQL болон ChromaDB Docker-т ажиллаж байх ёстой!

---

## Дараагийн Алхам

Phase 1 амжилттай ажиллаж байвал:
- ✅ Backend API ажиллаж байна
- ✅ PostgreSQL холбогдсон
- ✅ JWT authentication ажиллаж байна
- ✅ ChromaDB бэлэн байна

**Phase 2 руу шилжих бэлэн! 🚀**

Phase 2-д хийх:
- 📄 Document upload (PDF/Word)
- 🧠 RAG Pipeline (LangChain + Gemini)
- 💬 Chat endpoints

---

**Асуулт байвал лавлана уу!** 😊
