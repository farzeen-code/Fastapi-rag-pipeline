from sentence_transformers import SentenceTransformer

model  = SentenceTransformer("all-MiniLM-L6-v2")

def chunk_text(text, chunk_size = 500, overlap = 50):
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunks.append(" ".join(words[start:end]))
        start += chunk_size - overlap

    return chunks

def embed_chunks(chunks):
    return model.encode(chunks)

if __name__ == "__main__":
    sample = """Retrieval-Augmented Generation (RAG) is a technique that 
    grants an LLM access to external knowledge bases. By retrieving relevant 
    document snippets and injecting them into the prompt context, RAG minimizes 
    hallucinations and grounds responses in facts."""

    chunk = chunk_text(sample, chunk_size=15, overlap=5)
    embeddings = embed_chunks(chunk)

    print("Number of chunks: ", len(chunk))
    print(f"\nEmbeddings: {embeddings.shape}")