import hashlib
import re
import chromadb
from embeddings import get_model, chunk_text
from memory import db

Client = chromadb.PersistentClient(path="chroma_db")
collection = Client.get_or_create_collection(name = "documents")

small_doc_threshold = 200

small_docs = db["small_documents"]

def add_chunk(chunks, filename):
    if not chunks:
        return

    collection.delete(where={"source": filename})
    embeddings = get_model().encode(chunks).tolist()
    ids = [hashlib.md5((f"{filename}_{i}_{chunk}").encode()).hexdigest() for i, chunk in enumerate(chunks)]

    metadatas = [{"source": filename} for _ in chunks]
    collection.upsert(documents=chunks, embeddings=embeddings, ids=ids, metadatas=metadatas)

def retrieve(question: str, filename: str=None, top_k: int=5, max_distance: float=1.25) -> list[str]:
    where_filter = {"source": filename.lower()} if filename else None

    results = collection.query(
        query_texts = [question],
        n_results = top_k,
        where = where_filter,
        include=["documents", "distances"]
    )
    
    if not results["documents"] or not results["documents"][0]:
        return []

    docs = results["documents"][0]
    distances = results["distances"][0] if "distances" in results and results["distances"] else [0.0] * len(docs)
    
    filtered_chunks=[]
    for doc, dist in zip(docs, distances):
        if dist <= max_distance:
            filtered_chunks.append(doc)
        else:
            print(f" Dropped irrelevant chunk (distance {dist:.2f} > max_distance)")
    
    if not filtered_chunks and docs:
        print(f"All chuks exceed the broad query threshold. Using best available chunks as a fallback.")
        return docs[:3]
    
    return filtered_chunks 

def store_document(text, filename):
    if filename:
        filename = filename.lower()
    word_count = len(text.split())
    print(f"\n----- Debug---- store_document\n")
    print(f"Filename: '{filename}', Word count: {word_count}" )
    
    if word_count < small_doc_threshold:
        result = small_docs.update_one(
            {"filename": filename},
            {"$set": {"text": text}},
            upsert=True
        )
        collection.delete(where={"source": filename})
        print(f"Upserted into small_documents. matched={result.matched_count}, modified={result.modified_count}")
        return word_count, True

    else:
        small_docs.delete_one({"filename": filename})
        chunks = chunk_text(text)
        add_chunk(chunks, filename)
        print(f"Stored {len(chunks)} in ChromaDB")
        return word_count, False

def delete_document(filename):
    filename = filename.lower()
    collection.delete(where={"source": filename})
    small_docs.delete_one({"filename": filename})

def get_context(query, filename):
    print(f"\n--- debug Content----\n")
    print(f"Looking up filename: {filename}")
    if filename:
        small_doc = small_docs.find_one({
            "filename": {"$regex": f"^{re.escape(filename)}$", "$options": "i"}
        })
        if small_doc:
            print(f"Found in MongoDB {len(small_doc['text'])} chars")
            return [small_doc["text"]]

        print(f"Not found in small_documents, Checking chromaDB.....\n")
    results = retrieve(query, filename)
    print(f"ChromaDb returned {len(results)} chunks")
    return results