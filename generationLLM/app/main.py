# app.py
from fastapi import FastAPI, UploadFile, Form, HTTPException
from pydantic import BaseModel
from llmUtils import extract_text_by_type, single_query_answer
from pymongo import MongoClient
from pymongo.server_api import ServerApi
import gridfs
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from typing import Dict
from threading import Lock
import json
import gridfs
from bson import ObjectId

load_dotenv()  # Load environment variables from .env file
client = MongoClient(os.environ["MONGODB_URL"])  # from env
db = client["studyAssist"]
users = db["users"]
fs = gridfs.GridFS(db, collection="uploads")

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

def findSession(session_id: str):
    for user in users.find():
        for session in user.get("sessions", []):
            if str(session["_id"]) == session_id:
                print("✅ User found with session ID:", session_id)
                return session
    print("❌ Session not found")
    return None  # Return None if session is not found

def parseConfigMap(session: str):
    generationDict = {}
    
    generationList = json.loads(session.get("generationList", [])[0])
    configMap = (session.get("configMap", {}))[0]
    configDict = json.loads(str(configMap))
    
    for generation in generationList:
        print("Generation:", generation)
        if generation in configDict:
            generationDict[generation] = configDict[generation]
        else:
            generationDict[generation] = {}
            
    return generationDict

def getFiles(session):
    fileObjects = []
    files = session.get("files", [])
    
    for file in files:
        gridFsId = file.get('gridFsId')
        
        if gridFsId:
            try:
                object_id = ObjectId(gridFsId)
                fileContents = fs.get(object_id)
                
                if fileContents:
                    fileObjects.append({
                        "name": file.get('fileName', 'Unknown'),
                        "contentType": fileContents.content_type,
                        "size": fileContents.length,
                        "id": str(fileContents._id),
                        "content": fileContents.read()  # Assuming it's binary data
                    })
                else:
                    print(f"File with _id '{gridFsId}' not found in GridFS.")
            except Exception as e:
                print(f"Error retrieving file with _id '{gridFsId}': {e}")
        else:
            print(f"Invalid gridFsId found in session file: {file}")
    
    return fileObjects       
    
def getInstructions(session: str):
    instructions = session.get("instructions", "")
    if not instructions:
        return "No instructions provided."
    
    return instructions
    
def getStudyContent(generation: str, generationConfig: str, generationInstructions, generalInstructions: str, files: str):
    query: str = f"""Your task is to generate a certain type of study content based on the context of the files that have been provided
        and the general instructions which are: {generalInstructions}. The specific type of content you need to generate is: 
        {generation}. For this type of study content, you need to follow these instructions: {generationInstructions}. You must also 
        follow the parameters (if any) that have been provided: {generationConfig}. The content that you generate will be converted to
        a PDF, so please ensure that it is well-structured and formatted. The content of the files have been provided above, these files
        are very important in setting the focus of the content that you generate. Please provide the well-formatted content below:""" 
    
    # for each file in the context, provide the name, file type, and use the extractt_text_by_type function to extract the text using the files parameter
    context = ""
    for file in files:
        extracted_text = extract_text_by_type(file['content'], file['contentType'])
        if not extracted_text:
            print(f"❌ No text extracted from file: {file['name']}")
            continue
        context += f"File Name: {file['name']}\nFile Type: {file['contentType']}\nContent:\n{extracted_text}\n\n"
    
    # print("Context for generation:", context)
    print("Query for generation:", query)
    
    # single_query_answer(
    #     query=query,
    #     context=context
    # )

def main():
    files = (getFiles(findSession('68404e861c7ea1973a183bb8')))
    instructions = getInstructions(findSession('68404e861c7ea1973a183bb8'))
    generationConfig = parseConfigMap(findSession('68404e861c7ea1973a183bb8'))
    print(generationConfig)
    
    for generation in generationConfig:
        print("Generation:", generation)
        getStudyContent(
            generation=generation,
            generationConfig=generationConfig.get(generation, {}),
            generationInstructions=generationConfig[generation].get("instructions", ""),
            generalInstructions=instructions,
            files=files
        )
    
    
if __name__ == "__main__":
    main()
