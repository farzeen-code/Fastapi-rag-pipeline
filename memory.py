import pymongo
import os
import certifi
from dotenv import load_dotenv
from datetime import datetime, timezone

load_dotenv()

client = pymongo.MongoClient(os.environ.get("MONGODB_URI"), tlsCAFile=certifi.where())
db = client["rag_doc_qa"]
conversations = db["conversations"]

def init_db():
    conversations.create_index("updated_at", expireAfterSeconds=86400)

def add_message(session_id, role, content):
    message = {"role": role, "content": content}
    
    conversations.update_one(
        {"session_id": session_id},
        {   
            # keeps only the last 20 messages
            "$push": {
                "messages": {
                    "$each": [message], 
                    "$slice": -20
                }
            },
            "$set": {"updated_at": datetime.now(timezone.utc)}
        },
        upsert = True
    )

def get_history(session_id, limit=6):
    convo = conversations.find_one({"session_id": session_id})
    if convo is None:
        return []
    return convo["messages"][-limit:]