import re
from chromadb.utils.embedding_functions import DefaultEmbeddingFunction


embedding_fn  = None

def get_embedding_function():
    global embedding_fn
    if embedding_fn is None:
        embedding_fn = DefaultEmbeddingFunction()
    return embedding_fn
        
    
def chunk_text(text: str, chunk_size: int=600, overlap: int=100):
    if not text or not text.strip():
        return []
    
    separators = ["\n\n", "\n", r"(?<=[.?!])\s+", " "]
    
    def split_recursive(content: str, sep_index: int) -> list[str]:
        if len(content) <= chunk_size or sep_index >= len(separators):
            return [content.strip()] if content.strip() else []
        
        sep = separators[sep_index]
        if sep.startswith(r"(?<="):
            parts = re.split(sep, content)
        else:
            parts = content.split(sep)
            
        chunks = []
        current_chunk = ""
        
        for part in parts:
            part = part.strip()
            if not part:
                continue
            
            if len(current_chunk) + len(part) +1 > chunk_size:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                    current_chunk = current_chunk[-overlap:] + " " + part if len(current_chunk) > overlap else part
                else:
                    chunks.extend(split_recursive(part, sep_index+1))
                    
            else:
                current_chunk = f"{current_chunk} {part}".strip()
        
        if current_chunk:
            chunks.append(current_chunk.strip())
            
        return chunks

    return split_recursive(text, 0)
                