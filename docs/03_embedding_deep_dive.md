# Text Embedding: Гүнзгий Тайлбар

Энэ баримт нь `query_embedding = self.embeddings.embed_query(content)` кодын мөрийг дэлгэрэнгүй тайлбарлана.

---

## 🎯 Embedding гэж юу вэ?

**Embedding** гэдэг нь текстийг тоон вектор (жагсаалт) болгох үйл явц юм.

### Жишээ

**Текст:**
```
"How do I install the software?"
```

**Embedding (384-dimension vector):**
```python
[0.123, -0.456, 0.789, 0.234, -0.567, ..., 0.891]
# Нийт 384 тоо
```

---

## 🤔 Яагаад Embedding Хэрэгтэй вэ?

### Асуудал: Компьютер текстийг ойлгохгүй

Компьютер зөвхөн тоогоор ажилладаг. Текстийг шууд харьцуулж, утга санааг нь ойлгож чадахгүй.

**Жишээ:**
```python
# Эдгээр асуултууд ижил утгатай боловч текст өөр
query1 = "How do I install the software?"
query2 = "What are the installation steps?"
query3 = "Software installation guide"

# Компьютер эдгээрийг яаж ижил гэж мэдэх вэ?
# → Embedding ашиглана!
```

### Шийдэл: Semantic Vector Space

Embedding нь текстийг **утга санааны орон зай** (semantic space) дээр байрлуулна.

```
                    ↑
                    │
    "install" ●     │     ● "setup"
                    │
    "software" ●────┼────● "application"
                    │
                    │     ● "program"
    ────────────────┼────────────────→
                    │
    "delete" ●      │
                    │
                    ↓
```

**Ижил утгатай үгс** → Ойролцоо байрлана  
**Өөр утгатай үгс** → Холдоно

---

## 🧠 Embedding Хэрхэн Үүсдэг вэ?

### 1. Neural Network Model

Таны системд **`sentence-transformers/all-MiniLM-L6-v2`** model ашигладаг.

#### Model Architecture

```
Input Text
    ↓
┌─────────────────────┐
│  Tokenization       │  ← Үг бүрийг тоо болгох
│  "install" → 5234   │
│  "software" → 8901  │
└─────────────────────┘
    ↓
┌─────────────────────┐
│  BERT-based         │  ← Neural network (6 давхарга)
│  Transformer        │
│  (6 layers)         │
└─────────────────────┘
    ↓
┌─────────────────────┐
│  Mean Pooling       │  ← Дундаж авах
└─────────────────────┘
    ↓
┌─────────────────────┐
│  Normalization      │  ← Normalize хийх
└─────────────────────┘
    ↓
384-dimension Vector
[0.123, -0.456, ...]
```

### 2. Дэлгэрэнгүй Алхмууд

#### Алхам 1: Tokenization (Үг задлах)

```python
# Input
text = "How do I install the software?"

# Tokenization
tokens = ["How", "do", "I", "install", "the", "software", "?"]

# Token IDs (vocabulary-с)
token_ids = [2129, 2079, 1045, 16500, 1996, 4007, 1029]
```

#### Алхам 2: Transformer Neural Network

Transformer model нь үг бүрийн **контекст** (өмнөх болон дараагийн үгс)-ийг ойлгоно.

```python
# Жишээ: "install" гэдэг үг
# Контекст: "How do I [install] the software?"

# Transformer-ийн гаралт:
# "install" → [0.5, -0.3, 0.8, ..., 0.2]  (768-dim)
# Энэ вектор нь "install software" гэсэн утгыг агуулна
```

**Transformer-ийн онцлог:**
- **Self-Attention**: Үг бүр бусад үгстэй хэрхэн холбогдохыг тооцоолно
- **Context-Aware**: Ижил үг өөр өгүүлбэрт өөр утгатай байж болно

Жишээ:
```
"Apple is a fruit" → "Apple" = [0.1, 0.9, ...]
"Apple is a company" → "Apple" = [0.8, 0.2, ...]
```

#### Алхам 3: Mean Pooling (Дундаж)

Transformer нь үг бүрт вектор үүсгэнэ. Бүх өгүүлбэрийг нэг вектор болгохын тулд дундаж авна.

```python
# Үг бүрийн вектор
word_vectors = [
    [0.5, -0.3, 0.8],  # "How"
    [0.2, 0.4, -0.1],  # "do"
    [0.1, 0.6, 0.3],   # "I"
    [0.7, -0.2, 0.5],  # "install"
    # ...
]

# Mean pooling (дундаж)
sentence_vector = mean(word_vectors)
# = [(0.5+0.2+0.1+0.7)/4, (-0.3+0.4+0.6-0.2)/4, ...]
# = [0.375, 0.125, ...]
```

#### Алхам 4: Normalization

Вектор урт нь 1 болгох (unit vector).

```python
# Өмнө
vector = [0.375, 0.125, 0.625]
length = sqrt(0.375² + 0.125² + 0.625²) = 0.738

# Normalization
normalized = [0.375/0.738, 0.125/0.738, 0.625/0.738]
           = [0.508, 0.169, 0.847]

# Одоо length = 1
```

**Яагаад normalize хийх вэ?**
- Cosine similarity тооцоолоход хялбар
- Текстийн урт (үгийн тоо) нөлөөлөхгүй

---

## 💻 Кодын Дэлгэрэнгүй

### Таны Системийн Код

```python
# backend/app/utils/embeddings.py
from langchain_huggingface import HuggingFaceEmbeddings

class GeminiEmbeddings:
    def __init__(self):
        self.client = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
            model_kwargs={'device': 'cpu'},
            encode_kwargs={'normalize_embeddings': True}
        )
    
    def embed_query(self, text: str) -> List[float]:
        """Generate embedding for query"""
        return self.client.embed_query(text)
```

### Дотоод Үйл Явц

```python
# Хэрэглэгчийн асуулт
content = "How do I install the software?"

# 1. Model load (анх удаа)
# - Model файлуудыг татаж авна (~90MB)
# - Memory-д load хийнэ

# 2. Tokenization
tokens = tokenizer.encode(content)
# → [101, 2129, 2079, 1045, 16500, 1996, 4007, 1029, 102]
#    [CLS] How  do   I    install the  software ?   [SEP]

# 3. Transformer forward pass
# - 6 давхарга neural network
# - Self-attention тооцоолол
# - Контекст ойлгох
hidden_states = model(tokens)
# → Shape: (1, 9, 384)  # (batch, tokens, hidden_dim)

# 4. Mean pooling
sentence_embedding = mean_pooling(hidden_states, attention_mask)
# → Shape: (1, 384)

# 5. Normalization
normalized_embedding = F.normalize(sentence_embedding, p=2, dim=1)
# → Shape: (1, 384)

# 6. Буцаах
query_embedding = normalized_embedding[0].tolist()
# → [0.123, -0.456, 0.789, ..., 0.234]  # 384 тоо
```

---

## 🔍 Similarity Search (Ижил төстэй хайлт)

Embedding-ийн гол зорилго нь **ижил төстэй текст олох** явдал юм.

### Cosine Similarity

```python
# Query embedding
query = [0.5, 0.3, 0.8]

# Document embeddings (ChromaDB-д хадгалагдсан)
doc1 = [0.6, 0.2, 0.7]  # "Installation guide"
doc2 = [0.1, 0.9, 0.2]  # "Pricing information"
doc3 = [0.5, 0.4, 0.8]  # "Setup instructions"

# Cosine similarity тооцоолох
similarity(query, doc1) = 0.95  # Маш ойр
similarity(query, doc2) = 0.35  # Холдуу
similarity(query, doc3) = 0.98  # Хамгийн ойр

# Эрэмбэлэх
# 1. doc3 (0.98) ← Хамгийн холбогдолтой
# 2. doc1 (0.95)
# 3. doc2 (0.35)
```

### Cosine Similarity Томъёо

```
                    A · B
cos(θ) = ─────────────────────
          ||A|| × ||B||

Normalized vector бол:
cos(θ) = A · B  (энгийн dot product)
```

**Утга:**
- `1.0` = Яг ижил
- `0.0` = Ямар ч холбоогүй
- `-1.0` = Эсрэг утгатай

---

## 📊 Бодит Жишээ

### Input: Хэрэглэгчийн Асуулт

```python
query = "How do I reset my password?"
```

### Embedding Process

```python
# 1. Tokenization
tokens = ["How", "do", "I", "reset", "my", "password", "?"]

# 2. Transformer (simplified)
# Үг бүрийн вектор (768-dim, дараа нь 384 болгоно)
embeddings = {
    "How": [0.1, 0.2, ..., 0.3],
    "do": [0.4, -0.1, ..., 0.2],
    "I": [0.2, 0.3, ..., -0.1],
    "reset": [0.8, 0.5, ..., 0.6],      # ← Гол үг
    "my": [0.1, 0.1, ..., 0.0],
    "password": [0.7, 0.6, ..., 0.5],   # ← Гол үг
    "?": [0.0, 0.0, ..., 0.0]
}

# 3. Mean pooling
sentence_embedding = average(embeddings.values())

# 4. Final embedding
query_embedding = [0.329, 0.271, ..., 0.214]  # 384 тоо
```

### ChromaDB Search

```python
# ChromaDB-д хадгалагдсан баримтын chunk-ууд
chunks = [
    {
        "text": "To reset your password, go to Settings > Security",
        "embedding": [0.325, 0.268, ..., 0.219]  # Ойролцоо!
    },
    {
        "text": "The installation process takes 5 minutes",
        "embedding": [0.112, 0.891, ..., 0.334]  # Холдуу
    },
    {
        "text": "Password reset instructions: click Forgot Password",
        "embedding": [0.331, 0.275, ..., 0.211]  # Маш ойр!
    }
]

# Similarity тооцоолох
similarities = [
    cosine_similarity(query_embedding, chunks[0]["embedding"]),  # 0.97
    cosine_similarity(query_embedding, chunks[1]["embedding"]),  # 0.23
    cosine_similarity(query_embedding, chunks[2]["embedding"]),  # 0.99
]

# Top-5 сонгох
top_results = [chunks[2], chunks[0]]  # Хамгийн ойролцоо 2
```

---

## 🎨 Visualization: Semantic Space

Embedding-ийг 2D дээр дүрсэлбэл:

```
                    ↑ password
                    │
    "reset pwd" ●   │   ● "change password"
                    │
    "forgot pwd" ●──┼──● "password recovery"
                    │
    ────────────────┼────────────────→ installation
                    │
                    │   ● "install software"
    "setup app" ●   │
                    │   ● "installation guide"
                    ↓
```

**Ижил утгатай асуултууд ойролцоо байрлана:**
- "How do I reset my password?"
- "Forgot my password"
- "Password recovery steps"

**Өөр утгатай асуултууд холдоно:**
- "How to install software?"
- "System requirements"

---

## ⚡ Performance & Optimization

### Model Specs

| Параметр | Утга |
|----------|------|
| **Model Name** | all-MiniLM-L6-v2 |
| **Parameters** | 22.7M (22.7 сая) |
| **Layers** | 6 (BERT-based) |
| **Hidden Size** | 384 |
| **Model Size** | ~90MB |
| **Speed (CPU)** | ~100 sentences/sec |
| **Speed (GPU)** | ~1000 sentences/sec |

### Яагаад MiniLM-L6-v2 вэ?

✅ **Хурдан**: Жижиг model (6 давхарга)  
✅ **Чанартай**: Semantic search-д сайн үр дүнтэй  
✅ **CPU-friendly**: GPU шаардлагагүй  
✅ **Үнэгүй**: Локал дээр ажиллана  
✅ **Багтаамжтай**: 90MB зай эзэлнэ  

### Бусад Model-тэй Харьцуулбал

| Model | Layers | Dim | Size | Speed | Quality |
|-------|--------|-----|------|-------|---------|
| **all-MiniLM-L6-v2** | 6 | 384 | 90MB | ⚡⚡⚡ | ⭐⭐⭐ |
| all-mpnet-base-v2 | 12 | 768 | 420MB | ⚡⚡ | ⭐⭐⭐⭐ |
| OpenAI text-embedding-3 | - | 1536 | API | ⚡ | ⭐⭐⭐⭐⭐ |

---

## 🎯 Хураангуй

### `embed_query()` Юу Хийдэг вэ?

```python
query_embedding = self.embeddings.embed_query(content)
```

**Энгийн хэллэгээр:**
> Текстийг 384 тооны жагсаалт болгоно. Энэ жагсаалт нь текстийн **утга санаа**-г илэрхийлнэ.

**Техникийн хэллэгээр:**
> Neural network (Transformer) ашиглан текстийг semantic vector space дээр байрлуулна. Ижил утгатай текстүүд ойролцоо, өөр утгатай текстүүд холдоно.

### Алхам бүрийн хураангуй

1. **Tokenization**: Үг → Тоо
2. **Transformer**: Контекст ойлгох (6 давхарга neural network)
3. **Mean Pooling**: Үг бүрийн вектор → Өгүүлбэрийн вектор
4. **Normalization**: Урт = 1 болгох
5. **Output**: 384-dimension vector

### Яагаад Энэ Чухал вэ?

✅ **Semantic Search**: Үг бүр таарахгүй ч утга нь ижил бол олно  
✅ **Context-Aware**: Ижил үг өөр контекстэд өөр утгатай  
✅ **Fast**: Локал дээр хурдан ажиллана  
✅ **Free**: API зардал байхгүй  

---
