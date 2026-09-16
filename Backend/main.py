import json
import os
import aiofiles
from faster_whisper import WhisperModel, download_model
from fastapi import FastAPI, HTTPException, File, UploadFile
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

print("Loading faster-whisper model...")
MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "faster-whisper-small")
try:
    if os.path.exists(MODEL_DIR) and os.path.exists(os.path.join(MODEL_DIR, "model.bin")):
        print(f"Loading local model from {MODEL_DIR}")
        whisper_model = WhisperModel(MODEL_DIR, device="cuda", compute_type="int8_float16")
        whisper_model_cpu = WhisperModel(MODEL_DIR, device="cpu", compute_type="int8")
    else:
        print("Downloading faster-whisper small model to local directory...")
        downloaded_path = download_model("small", output_dir=MODEL_DIR)
        whisper_model = WhisperModel(downloaded_path, device="cuda", compute_type="int8_float16")
        whisper_model_cpu = WhisperModel(downloaded_path, device="cpu", compute_type="int8")
    print("faster-whisper model loaded successfully!")
except Exception as e:
    print(f"Warning: Could not load Whisper model: {e}")
    whisper_model = None
    whisper_model_cpu = None

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    language: str = "en"

class SummaryRequest(BaseModel):
    messages: List[Message]

@app.post("/api/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    if whisper_model is None:
        raise HTTPException(status_code=500, detail="Whisper model not loaded")
    
    temp_file_path = f"temp_{file.filename}"
    async with aiofiles.open(temp_file_path, 'wb') as out_file:
        content = await file.read()
        await out_file.write(content)
    
    try:
        try:
            segments, info = whisper_model.transcribe(temp_file_path)
            text = "".join([segment.text for segment in segments])
        except Exception as cuda_e:
            print(f"CUDA transcription failed ({cuda_e}), falling back to CPU...")
            segments, info = whisper_model_cpu.transcribe(temp_file_path)
            text = "".join([segment.text for segment in segments])
            
        return {"text": text.strip()}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@app.post("/api/chat")
async def chat(request: ChatRequest):
    conversation_history = ""
    for msg in request.messages:
        role = "AI Assistant" if msg.role == "assistant" else "Patient"
        conversation_history += f"{role}: {msg.content}\n"

    prompt = f"""You are a professional medical AI assistant taking a patient's medical history.
Your goal is to gather clinically relevant information about the patient's main complaint.
You MUST output your response as valid JSON matching this schema:
{{
  "type": "question" | "done",
  "question": "The question text in the target language (if type is question), or empty string if done",
  "language": "{request.language}"
}}

RULES:
1. Ask exactly ONE question at a time. NEVER ask multiple questions.
2. Keep your question short, simple, and patient-friendly.
3. NEVER repeat a question you have already asked.
4. Respond in the following language: {request.language}. If 'hi', respond in Hindi. If 'en', respond in English.
5. Do NOT diagnose or prescribe medicines.
6. When you have collected enough medically relevant information to form a complete clinical history, set "type" to "done".

Conversation History so far:
{conversation_history}

Based on the conversation history, output your single next JSON response.
"""

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                OLLAMA_URL,
                json={
                    "model": MODEL_NAME,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json"
                },
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()
            reply = data.get("response", "").strip()
            
            # Ensure it is valid JSON
            try:
                json_reply = json.loads(reply)
                return json_reply
            except json.JSONDecodeError:
                return {"type": "question", "question": reply, "language": request.language}
                
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
