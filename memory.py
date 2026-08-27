import pymongo
import os

client = pymongo.MongoClient(os.environ.get("MONGODB_URI"))
db = client["rag_doc_qa"]
conversations = db["conversations"]

def add_message(session_id, role, content):
    conversations.update_one(
        {"_id": session_id},
        {"$push": {"messages": {"role": role, "content": content}}},
        upsert = True
    )

def get_history(session_id, limit=6):
    convo = conversations.find_one({"_id": session_id})
    if convo is None:
        return []
    return convo["messages"][-limit:]