from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
from typing import Dict, Any, List

app = FastAPI()

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "qwen2.5:3b"

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]

class SummaryRequest(BaseModel):
    messages: List[Message]

@app.post("/api/chat")
async def chat(request: ChatRequest):
    conversation_history = ""
    for msg in request.messages:
        role = "AI Assistant" if msg.role == "assistant" else "Patient"
        conversation_history += f"{role}: {msg.content}\n"

    prompt = f"""You are a professional medical AI assistant taking a patient's medical history.
Your goal is to gather clinically relevant information about the patient's main complaint.

RULES:
1. Ask exactly ONE question at a time.
2. Keep your question short, simple, and patient-friendly.
3. NEVER repeat a question you have already asked.
4. If the patient has already provided information, do not ask for it again.
5. Do NOT diagnose or prescribe medicines.
6. When you have collected enough medically relevant information to form a complete clinical history, output EXACTLY the word "[DONE]" and nothing else.

Conversation History so far:
{conversation_history}

Based on the conversation history, what is your next single question? (Or output [DONE] if finished).
"""

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                OLLAMA_URL,
                json={
                    "model": MODEL_NAME,
                    "prompt": prompt,
                    "stream": False
                },
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()
            reply = data.get("response", "").strip()
            
            # Small cleanup in case the LLM prefixed it
            if reply.startswith("AI Assistant:"):
                reply = reply.replace("AI Assistant:", "").strip()
            
            return {"reply": reply}
    except Exception as e:
        print(f"Error calling Ollama: {e}")
        raise HTTPException(status_code=500, detail="Failed to communicate with Ollama")

@app.post("/api/generate")
async def generate_summary(request: SummaryRequest):
    conversation_history = ""
    for msg in request.messages:
        role = "AI Assistant" if msg.role == "assistant" else "Patient"
        conversation_history += f"{role}: {msg.content}\n"
    
    prompt = f"""You are a medical scribe. Based on the following interview transcript with a patient, generate a structured clinical history.

Interview Transcript:
{conversation_history}

Format the output strictly with these sections:
- Chief Complaint
- History of Present Illness
- Past Medical History
- Past Surgical History
- Current Medications
- Allergies
- Family History
- Personal History
- Review of Systems

RULES:
1. ONLY use information provided by the patient in the transcript.
2. If information for a section was not provided, write EXACTLY "Not provided".
3. NEVER invent patient information.
4. DO NOT write "None" if it was not asked or answered; write "Not provided".
"""

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                OLLAMA_URL,
                json={
                    "model": MODEL_NAME,
                    "prompt": prompt,
                    "stream": False
                },
                timeout=60.0
            )
            response.raise_for_status()
            data = response.json()
            return {"summary": data.get("response", "").strip()}
    except Exception as e:
        print(f"Error calling Ollama: {e}")
        raise HTTPException(status_code=500, detail="Failed to communicate with Ollama")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
