import json
import os
import re
import sys
import aiofiles
from faster_whisper import WhisperModel
from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
from typing import Dict, Any, List, Optional

# Fix Windows console encoding for Hindi/Unicode output
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if sys.stderr.encoding != 'utf-8':
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

app = FastAPI()

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_BASE = "http://localhost:11434"
OLLAMA_CHAT_URL = f"{OLLAMA_BASE}/api/chat"
MODEL_NAME = "qwen2.5:3b"

# ============================================================
# WHISPER MODEL — Load once at startup from local directory
# ============================================================

MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "faster-whisper-small")
whisper_model = None
whisper_model_cpu = None

print("[WHISPER] Loading faster-whisper model...")
try:
    if os.path.exists(os.path.join(MODEL_DIR, "model.bin")):
        print(f"[WHISPER] Loading from local directory: {MODEL_DIR}")
        whisper_model = WhisperModel(MODEL_DIR, device="cuda", compute_type="int8_float16")
        whisper_model_cpu = WhisperModel(MODEL_DIR, device="cpu", compute_type="int8")
        print("[WHISPER] Model loaded successfully (CUDA + CPU fallback)")
    else:
        print(f"[WHISPER] ERROR: model.bin not found at {MODEL_DIR}")
        print("[WHISPER] Please download the faster-whisper small model to Backend/models/faster-whisper-small/")
except Exception as e:
    print(f"[WHISPER] WARNING: Could not load model: {e}")

# ============================================================
# CLINICAL QUESTION DEFINITIONS (10 categories)
# ============================================================

QUESTION_ORDER = [
    "chief_complaint",
    "location",
    "onset",
    "duration",
    "severity",
    "aggravating_relieving",
    "associated_symptoms",
    "past_history",
    "medications_allergies",
    "additional_information",
]

PREDEFINED_QUESTIONS = {
    "chief_complaint": {
        "en": "What problem are you experiencing today?",
        "hi": "आज आपको किस समस्या के लिए मदद चाहिए?",
    },
    "location": {
        "en": "Where exactly are you having the problem or pain?",
        "hi": "आपको समस्या या दर्द ठीक कहाँ हो रहा है?",
    },
    "onset": {
        "en": "When did this problem start?",
        "hi": "यह समस्या कब शुरू हुई?",
    },
    "duration": {
        "en": "How long have you had this problem?",
        "hi": "आपको यह समस्या कितने समय से है?",
    },
    "severity": {
        "en": "How severe is it on a scale of 1 to 10?",
        "hi": "1 से 10 के पैमाने पर यह समस्या या दर्द कितना गंभीर है?",
    },
    "aggravating_relieving": {
        "en": "What makes it better or worse?",
        "hi": "किस चीज़ से यह समस्या बेहतर या बदतर होती है?",
    },
    "associated_symptoms": {
        "en": "Do you have any other symptoms along with this problem?",
        "hi": "इस समस्या के साथ आपको और कोई लक्षण हैं?",
    },
    "past_history": {
        "en": "Have you had this problem before, or do you have any important medical conditions?",
        "hi": "क्या आपको यह समस्या पहले भी हुई है, या आपको कोई महत्वपूर्ण बीमारी है?",
    },
    "medications_allergies": {
        "en": "Are you currently taking any medicines, and do you have any allergies?",
        "hi": "क्या आप अभी कोई दवा ले रहे हैं, और क्या आपको किसी दवा या चीज़ से एलर्जी है?",
    },
    "additional_information": {
        "en": "Is there anything else about your problem that you think the doctor should know?",
        "hi": "क्या आपकी समस्या के बारे में और कुछ है जो डॉक्टर को जानना चाहिए?",
    },
}

# ============================================================
# RED FLAG KEYWORDS
# ============================================================

RED_FLAG_KEYWORDS_EN = [
    "severe chest pain", "chest tightness", "difficulty breathing", "can't breathe",
    "cannot breathe", "unconscious", "fainted", "fainting", "sudden weakness",
    "paralysis", "severe bleeding", "blood loss", "seizure", "convulsion",
    "suicidal", "self-harm", "want to die", "overdose", "stroke",
    "heart attack", "not breathing",
]

RED_FLAG_KEYWORDS_HI = [
    "सीने में तेज दर्द", "सांस नहीं आ रही", "बेहोश", "बेहोशी",
    "अचानक कमज़ोरी", "लकवा", "खून बह रहा", "दौरा", "मिर्गी",
    "आत्महत्या", "मरना चाहता", "मरना चाहती", "हार्ट अटैक",
    "सांस लेने में तकलीफ", "खून की उल्टी",
]


def check_red_flags(text: str) -> bool:
    """Check if patient answer contains emergency red flag keywords."""
    lower = text.lower()
    for kw in RED_FLAG_KEYWORDS_EN:
        if kw in lower:
            return True
    for kw in RED_FLAG_KEYWORDS_HI:
        if kw in text:
            return True
    return False


# ============================================================
# REQUEST / RESPONSE MODELS
# ============================================================

class Message(BaseModel):
    role: str
    content: str

class InterviewRequest(BaseModel):
    sessionLanguage: str  # "en" or "hi"
    currentQuestionId: str  # current category being asked
    latestAnswer: str  # patient's latest answer text
    structuredAnswers: Dict[str, str]  # answers collected so far
    conversationHistory: List[Message]  # full conversation so far
    chiefComplaint: str = ""  # initial complaint if any

class SummaryRequest(BaseModel):
    sessionLanguage: str
    structuredAnswers: Dict[str, str]
    conversationHistory: List[Message]

# Legacy model kept for backward compatibility
class ChatRequest(BaseModel):
    messages: List[Message]
    language: str = "en"


# ============================================================
# HELPER: Call Ollama
# ============================================================

async def call_ollama(system_prompt: str, user_prompt: str, json_mode: bool = True, timeout: float = 60.0) -> Optional[str]:
    """Call local Ollama with the Qwen model. Returns raw response text or None on failure."""
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]
    
    payload = {
        "model": MODEL_NAME,
        "messages": messages,
        "stream": False,
    }
    if json_mode:
        payload["format"] = "json"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(OLLAMA_CHAT_URL, json=payload, timeout=timeout)
            response.raise_for_status()
            data = response.json()
            content = data.get("message", {}).get("content", "").strip()
            return content
    except httpx.TimeoutException:
        print("[OLLAMA] Request timed out")
        return None
    except httpx.ConnectError:
        print("[OLLAMA] Cannot connect to Ollama at localhost:11434. Is Ollama running?")
        return None
    except Exception as e:
        print(f"[OLLAMA] Error: {e}")
        return None


def safe_parse_json(text: str) -> Optional[dict]:
    """Try to parse JSON from Ollama response, with fallback extraction."""
    if not text:
        return None
    # Try direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # Try to find JSON object in the text
    match = re.search(r'\{[^{}]*\}', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass
    return None


def get_next_question_id(current_id: str, structured_answers: Dict[str, str]) -> Optional[str]:
    """Get the next unanswered question ID after current_id in the sequence."""
    try:
        current_idx = QUESTION_ORDER.index(current_id)
    except ValueError:
        current_idx = -1
    
    for i in range(current_idx + 1, len(QUESTION_ORDER)):
        qid = QUESTION_ORDER[i]
        # Skip if already answered
        if structured_answers.get(qid, "").strip():
            continue
        return qid
    
    return None  # All questions answered


# ============================================================
# ENDPOINT: /api/transcribe
# ============================================================

@app.post("/api/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    if whisper_model is None:
        raise HTTPException(status_code=500, detail="Whisper model not loaded. Check server logs.")
    
    temp_file_path = f"temp_{file.filename}"
    async with aiofiles.open(temp_file_path, 'wb') as out_file:
        content = await file.read()
        await out_file.write(content)
    
    try:
        detected_lang = "en"
        try:
            segments, info = whisper_model.transcribe(temp_file_path, vad_filter=True)
            segment_list = list(segments)
            text = "".join([s.text for s in segment_list])
            detected_lang = info.language if info.language else "en"
        except Exception as cuda_e:
            print(f"[WHISPER] CUDA failed ({cuda_e}), falling back to CPU...")
            if whisper_model_cpu is None:
                raise HTTPException(status_code=500, detail="Whisper CPU fallback not available")
            
            # Use VAD filter to prevent silence hallucination (which causes massive CPU lag)
            segments, info = whisper_model_cpu.transcribe(temp_file_path, vad_filter=True, beam_size=1)
            segment_list = list(segments)
            text = "".join([s.text for s in segment_list])
            detected_lang = info.language if info.language else "en"
        
        cleaned = text.strip()
        print(f"[WHISPER] Transcribed: '{cleaned}' (detected: {detected_lang})")
        return {"text": cleaned, "detectedLanguage": detected_lang}
    
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)


# ============================================================
# ENDPOINT: /api/interview (State Machine)
# ============================================================

SYSTEM_PROMPT = """You are MediKiosk, a clinical intake assistant at a hospital self-service kiosk.

Your job is to collect structured medical information from a patient before they meet a doctor.

You are NOT a doctor. You do NOT diagnose. You do NOT prescribe medicines.

CRITICAL RULES:
1. You MUST respond in valid JSON only.
2. You MUST use ONLY the session language specified for your question text.
3. Ask EXACTLY ONE question at a time. NEVER combine multiple questions.
4. Use short, simple language suitable for a hospital kiosk patient.
5. Do NOT invent patient information or symptoms.
6. Do NOT give medical diagnoses or treatment advice.
7. Extract the key clinical information from the patient's answer."""


@app.post("/api/interview")
async def interview(request: InterviewRequest):
    lang = request.sessionLanguage
    current_qid = request.currentQuestionId
    answer = request.latestAnswer.strip()
    structured = request.structuredAnswers.copy()
    history = request.conversationHistory
    
    print(f"\n[INTERVIEW] === Processing ===")
    print(f"[INTERVIEW] questionId={current_qid}, language={lang}")
    print(f"[INTERVIEW] answer='{answer[:100]}...' " if len(answer) > 100 else f"[INTERVIEW] answer='{answer}'")
    
    # ---- Check for red flags ----
    if answer and check_red_flags(answer):
        print(f"[INTERVIEW] RED FLAG detected in answer!")
        red_flag_msg = {
            "en": "Your symptoms may require immediate emergency attention. Please proceed to the Emergency Department immediately or alert hospital staff.",
            "hi": "आपके लक्षणों को तुरंत आपातकालीन ध्यान की आवश्यकता हो सकती है। कृपया तुरंत आपातकालीन विभाग में जाएं या अस्पताल के कर्मचारियों को सूचित करें।",
        }
        return {
            "type": "red_flag",
            "questionId": None,
            "question": red_flag_msg.get(lang, red_flag_msg["en"]),
            "inputType": None,
            "language": lang,
            "complete": True,
            "extractedInfo": answer,
        }
    
    # ---- Use Qwen to extract structured info from answer ----
    if answer and current_qid:
        extract_prompt = f"""The patient was asked about: {current_qid}
The patient's answer was: "{answer}"

Extract the key medical information from this answer in 1-2 short sentences.
Return JSON: {{"extracted": "the key information"}}"""
        
        print(f"[QWEN] request started (extract)")
        extract_response = await call_ollama(SYSTEM_PROMPT, extract_prompt, json_mode=True, timeout=30.0)
        print(f"[QWEN] response received (extract)")
        print(f"[QWEN] parsed response: {extract_response}")
        extracted = None
        if extract_response:
            parsed = safe_parse_json(extract_response)
            if parsed and "extracted" in parsed:
                extracted = parsed["extracted"]
        
        # Store the answer
        structured[current_qid] = extracted if extracted else answer
        print(f"[INTERVIEW] Stored answer for {current_qid}: '{structured[current_qid][:80]}'")
    
    # ---- Determine next question ----
    next_qid = get_next_question_id(current_qid, structured)
    
    if next_qid is None:
        # All questions covered
        print(f"[INTERVIEW] All categories covered. Interview complete.")
        return {
            "type": "complete",
            "questionId": None,
            "question": None,
            "inputType": None,
            "language": lang,
            "complete": True,
            "extractedInfo": structured.get(current_qid, answer),
            "structuredAnswers": structured,
        }
    
    # ---- Check if next question is relevant (use Qwen) ----
    chief = structured.get("chief_complaint", request.chiefComplaint or "")
    
    # For chief_complaint, always ask. For others, check relevance.
    should_ask = True
    if next_qid != "chief_complaint" and chief:
        relevance_prompt = f"""The patient's chief complaint is: "{chief}"
The information collected so far: {json.dumps(structured, ensure_ascii=False)}

Is the category "{next_qid}" relevant for this patient's complaint?
Categories: location, onset, duration, severity, aggravating_relieving, associated_symptoms, past_history, medications_allergies, additional_information

Return JSON: {{"relevant": true}} or {{"relevant": false}}"""
        
        print(f"[QWEN] request started (relevance)")
        rel_response = await call_ollama(SYSTEM_PROMPT, relevance_prompt, json_mode=True, timeout=20.0)
        print(f"[QWEN] response received (relevance)")
        print(f"[QWEN] parsed response: {rel_response}")
        if rel_response:
            rel_parsed = safe_parse_json(rel_response)
            if rel_parsed and "relevant" in rel_parsed:
                should_ask = bool(rel_parsed["relevant"])
                if not should_ask:
                    print(f"[INTERVIEW] Skipping {next_qid} (not relevant)")
                    # Mark as skipped and find the next one
                    structured[next_qid] = ""
                    # Recursively find next relevant question
                    for _ in range(len(QUESTION_ORDER)):
                        next_qid = get_next_question_id(next_qid, structured)
                        if next_qid is None:
                            # All done
                            return {
                                "type": "complete",
                                "questionId": None,
                                "question": None,
                                "inputType": None,
                                "language": lang,
                                "complete": True,
                                "extractedInfo": structured.get(current_qid, answer),
                                "structuredAnswers": structured,
                            }
                        # Check this one too — but limit Qwen calls. 
                        # For simplicity, accept the next one as relevant.
                        break
    
    # ---- Generate the question text ----
    # Start with the predefined question as the safe fallback
    fallback_question = PREDEFINED_QUESTIONS.get(next_qid, {}).get(lang, "")
    
    # Try to get a contextual question from Qwen
    question_text = fallback_question
    
    if chief and next_qid != "chief_complaint":
        context_prompt = f"""Session language: {"Hindi" if lang == "hi" else "English"}
Patient's chief complaint: "{chief}"
Information collected so far: {json.dumps(structured, ensure_ascii=False)}

Generate EXACTLY ONE short, simple question for the category: "{next_qid}"
The question must be in {"Hindi" if lang == "hi" else "English"} ONLY.
Keep it under 20 words. Do NOT combine multiple questions.

Return JSON: {{"question": "your single question in the correct language"}}"""
        
        print(f"[QWEN] request started (context_question)")
        q_response = await call_ollama(SYSTEM_PROMPT, context_prompt, json_mode=True, timeout=30.0)
        print(f"[QWEN] response received (context_question)")
        print(f"[QWEN] parsed response: {q_response}")
        if q_response:
            q_parsed = safe_parse_json(q_response)
            if q_parsed and "question" in q_parsed:
                generated_q = q_parsed["question"].strip()
                # Validate language
                if lang == "hi":
                    # Check if it contains at least some Hindi characters (Devanagari)
                    has_hindi = bool(re.search(r'[\u0900-\u097F]', generated_q))
                    if has_hindi:
                        question_text = generated_q
                    else:
                        print(f"[INTERVIEW] Qwen returned English for Hindi session, using fallback")
                        question_text = fallback_question
                elif lang == "en":
                    # Check it's not predominantly Hindi
                    hindi_chars = len(re.findall(r'[\u0900-\u097F]', generated_q))
                    if hindi_chars > len(generated_q) * 0.3:
                        print(f"[INTERVIEW] Qwen returned Hindi for English session, using fallback")
                        question_text = fallback_question
                    else:
                        question_text = generated_q
    
    # Final safety: if question_text is empty, use predefined
    if not question_text:
        question_text = fallback_question or f"Please provide more information about your {next_qid.replace('_', ' ')}."
    
    # Validate single question (heuristic: check for multiple ? marks)
    q_marks = question_text.count('?') + question_text.count('?')  # ASCII + Hindi question mark
    if q_marks > 1:
        # Multiple questions detected — use the predefined single question
        print(f"[INTERVIEW] Multiple questions detected ({q_marks} ?), using predefined")
        question_text = fallback_question
    
    print(f"[INTERVIEW] nextQuestion={next_qid}, text='{question_text[:80]}'")
    
    return {
        "type": "question",
        "questionId": next_qid,
        "question": question_text,
        "inputType": "text",
        "language": lang,
        "complete": False,
        "extractedInfo": structured.get(current_qid, answer) if current_qid else None,
        "structuredAnswers": structured,
    }


# ============================================================
# ENDPOINT: /api/summary
# ============================================================

@app.post("/api/summary")
async def generate_summary(request: SummaryRequest):
    lang = request.sessionLanguage
    structured = request.structuredAnswers
    not_reported = "Not reported" if lang == "en" else "जानकारी नहीं दी गई"
    
    print(f"\n[SUMMARY] Generating clinical summary (language={lang})")
    
    # Build summary from structured answers
    summary = {
        "chiefComplaint": structured.get("chief_complaint", not_reported),
        "location": structured.get("location", not_reported),
        "onset": structured.get("onset", not_reported),
        "duration": structured.get("duration", not_reported),
        "severity": structured.get("severity", not_reported),
        "aggravatingRelievingFactors": structured.get("aggravating_relieving", not_reported),
        "associatedSymptoms": structured.get("associated_symptoms", not_reported),
        "pastMedicalHistory": structured.get("past_history", not_reported),
        "medications": not_reported,
        "allergies": not_reported,
        "additionalInformation": structured.get("additional_information", not_reported),
    }
    
    # Split medications_allergies if present
    med_allergy = structured.get("medications_allergies", "")
    if med_allergy:
        summary["medications"] = med_allergy
        summary["allergies"] = med_allergy
        # Try to split using Qwen
        split_prompt = f"""Given this patient response about medications and allergies: "{med_allergy}"
Split into medications and allergies separately.
Return JSON: {{"medications": "...", "allergies": "..."}}
If either is not mentioned, use "{not_reported}"."""
        
        split_response = await call_ollama(SYSTEM_PROMPT, split_prompt, json_mode=True, timeout=20.0)
        if split_response:
            split_parsed = safe_parse_json(split_response)
            if split_parsed:
                summary["medications"] = split_parsed.get("medications", med_allergy)
                summary["allergies"] = split_parsed.get("allergies", not_reported)
    
    # Replace empty strings with not_reported
    for key in summary:
        if not summary[key] or not summary[key].strip():
            summary[key] = not_reported
    
    print(f"[SUMMARY] Generated summary with {sum(1 for v in summary.values() if v != not_reported)} filled fields")
    
    return {"summary": summary, "language": lang}


# ============================================================
# ENDPOINT: /api/health (check Ollama connectivity)
# ============================================================

@app.get("/api/health")
async def health_check():
    ollama_ok = False
    whisper_ok = whisper_model is not None
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{OLLAMA_BASE}/api/tags", timeout=5.0)
            ollama_ok = resp.status_code == 200
    except Exception:
        pass
    
    return {
        "status": "ok" if (ollama_ok and whisper_ok) else "degraded",
        "ollama": ollama_ok,
        "whisper": whisper_ok,
        "model": MODEL_NAME,
    }


# ============================================================
# LEGACY ENDPOINT: /api/chat (kept for backward compatibility)
# ============================================================

@app.post("/api/chat")
async def chat(request: ChatRequest):
    """Legacy chat endpoint. Use /api/interview instead."""
    conversation_history = ""
    for msg in request.messages:
        role = "AI Assistant" if msg.role == "assistant" else "Patient"
        conversation_history += f"{role}: {msg.content}\n"

    prompt = f"""Based on the conversation history, ask exactly ONE short follow-up question.
Respond in {"Hindi" if request.language == "hi" else "English"}.
Return JSON: {{"type": "question", "question": "your question", "language": "{request.language}"}}

Conversation:
{conversation_history}"""

    response = await call_ollama(SYSTEM_PROMPT, prompt, json_mode=True, timeout=30.0)
    if response:
        parsed = safe_parse_json(response)
        if parsed:
            return parsed
    
    # Fallback
    return {"type": "question", "question": PREDEFINED_QUESTIONS["location"].get(request.language, "Where is the problem?"), "language": request.language}


# ============================================================
# LEGACY ENDPOINT: /api/generate (kept for backward compatibility)
# ============================================================

@app.post("/api/generate")
async def generate_legacy_summary(request: ChatRequest):
    """Legacy summary endpoint. Use /api/summary instead."""
    conversation_history = ""
    for msg in request.messages:
        role = "AI Assistant" if msg.role == "assistant" else "Patient"
        conversation_history += f"{role}: {msg.content}\n"
    
    prompt = f"""Based on this patient interview, generate a structured clinical summary.
Interview: {conversation_history}

Return a clear summary with sections: Chief Complaint, History of Present Illness, Past Medical History, Current Medications, Allergies.
Only use information from the transcript. Write "Not provided" for missing sections."""
    
    response = await call_ollama(SYSTEM_PROMPT, prompt, json_mode=False, timeout=60.0)
    if response:
        return {"summary": response}
    
    return {"summary": "Summary generation failed. Please try again."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
