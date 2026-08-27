import os
from dotenv import load_dotenv
from google import genai

load_dotenv()
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

def build_prompt(query: str, context_chunks: list[str], history: list[dict]) -> str:

    context_text = "\n\n---\n\n".join(context_chunks)
    history_text = ""
    if history:
        history_lines = [f"{turn['role'].capitalize()}: {turn['content']}" for turn in history]
        history_text = "\n".join(history_lines)
    prompt = f"""You are a helpful assistant that answers questions strictly based on the provided document excerpts.

    Rules:
    1. Answer the question using ONLY the provided context below.
    2. If the context does not contain enough information to answer, say: "I cannot find the answer in the provided document."
    3. Do not make up facts or extrapolate beyond the text.

    Conversation History:
    {history_text if history_text else "(No previous messages.)" }
    
    Context:
    {context_text}

    Question: {query}
    Answer:"""

    return prompt

def generate_answer(query: str, context_chunks: list[str], history: list[dict]) -> str:
    prompt = build_prompt(query, context_chunks, history)

    response = client.models.generate_content(
        model= "gemini-3.6-flash",
        contents = prompt
    )
    return response.text