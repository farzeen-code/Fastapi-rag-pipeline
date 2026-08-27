import io
import docx
from pypdf import PdfReader
from fastapi import FastAPI, File, UploadFile, HTTPException
from pydantic import BaseModel
from embeddings import chunk_text
from vector_store import add_chunk, retrieve
from generate import generate_answer
from memory import add_message, get_history


app = FastAPI(title="RAG Document Q&A")

class QueryRequest(BaseModel):
    session_id: str
    question: str

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    content = await file.read()

    if file.filename.endswith(".docx"):
        doc = docx.Document(io.BytesIO(content))
        text = "\n".join([para.text for para in doc.paragraphs])

    elif file.filename.endswith(".txt"):
        try:
            text = content.decode("utf-8")
        except UnicodeDecodeError:
            text = content.decode("cp1252", errors="replace")

    elif file.filename.endswith(".pdf"):
        pdf = PdfReader(io.BytesIO(content))
        text = "\n".join([page.extract_text() or "" for page in pdf.pages])

    else:
        raise HTTPException(
            status_code = 400,
            detail= "Unsupported file type. Try .txt or .docx file."
        )
        
    chunks = chunk_text(text)
    add_chunk(chunks, file.filename)

    return {"status": "ok", "chunks_added": len(chunks), "filename": file.filename}

@app.post("/query")
def queryDocument(request: QueryRequest):
    relevant_chunks = retrieve(request.question)
    history = get_history(request.session_id)
    answer = generate_answer(request.question, relevant_chunks, history)

    add_message(request.session_id, "user", request.question)
    add_message(request.session_id, "assistant", answer)

    return {"answer": answer, "sources": relevant_chunks}