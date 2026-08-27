# FastAPI RAG Document Q&A

A robust backend API that allows users to upload documents and ask context-aware questions about their contents using a Retrieval-Augmented Generation (RAG) pipeline. 

## Features
* **Multi-Format Uploads:** Extracts text from `.pdf`, `.docx`, and `.txt` files.
* **Vector Storage:** Uses ChromaDB for efficient semantic search and document retrieval.
* **Gemini LLM Integration:** Powered by Google's `gemini-3.6-flash` model for fast, grounded answers.
* **Conversational Memory:** Tracks chat history across active sessions to handle follow-up questions.

## Quick Start

1. **Clone and Install**
   ```bash
   git clone [https://github.com/yourusername/fastapi-rag-pipeline.git](https://github.com/yourusername/fastapi-rag-pipeline.git)
   cd fastapi-rag-pipeline
   pip install -r requirements.txt

```

2. **Environment Setup**
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_google_api_key
# MONGODB_URI=mongodb+srv://... (Coming soon)

```


3. **Run the Server**
```bash
uvicorn main:app --reload

```


Navigate to `http://127.0.0.1:8000/docs` to test the API endpoints in the Swagger UI.

---



```

```
