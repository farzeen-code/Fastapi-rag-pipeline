import hashlib
import uuid
import chromadb
from embeddings import model

Client = chromadb.PersistentClient(path="chroma_db")
collection = Client.get_or_create_collection(name = "documents")

def add_chunk(chunks, filename):
    if not chunks:
        return

    collection.delete(where={"source": filename})
    embeddings = model.encode(chunks).tolist()
    ids = [hashlib.md5(chunk.encode()).hexdigest() for chunk in chunks]

    metadatas = [{"source": filename} for _ in range(len(chunks))]
    collection.upsert(documents=chunks, embeddings=embeddings, ids=ids, metadatas=metadatas)

def retrieve(query, top_k=3):
    query_embedding = model.encode([query]).tolist()
    results = collection.query(query_embeddings=query_embedding, n_results = top_k)
    return results["documents"][0]