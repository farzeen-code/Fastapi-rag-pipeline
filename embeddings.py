import re
from sentence_transformers import SentenceTransformer

_model  = None

def get_model():
    global _model
    if _model is None:
        print("Loading embedding model into memory...")
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model
        
    
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
                