# app.py
from fastapi import FastAPI, UploadFile, Form, HTTPException
from pydantic import BaseModel
#from llmUtils import extract_text_from_pdf, single_query_answer
from pymongo import MongoClient
import gridfs
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from typing import Dict
from threading import Lock

load_dotenv()  # Load environment variables from .env file
client = MongoClient(os.environ["MONGODB_URL"])  # from env
db = client["your-db"]
fs = gridfs.GridFS(db)

app = FastAPI()

# Thread-safe global dictionary
progress_store: Dict[str, Dict] = {}
progress_lock = Lock()
    
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # or ["*"] for all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/progress/{session_id}")
def get_progress(session_id: str):
    with progress_lock:
        if session_id not in progress_store:
            raise HTTPException(status_code=404, detail="Session not found")

        return progress_store[session_id]
    
class GenRequest(BaseModel):
    sessionId: str
    apiKey: str
    
@app.post("/generate")
async def generate(data: GenRequest):
    if data.apiKey.strip() != str(os.environ["LLM_API_KEY"]).strip():
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    session_id = data.sessionId

    

    return { "message": "Study content generated" }
