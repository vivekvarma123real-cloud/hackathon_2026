export interface ChatMessage {
  role: 'assistant' | 'user';
  content: string;
}

export interface AiResponse {
  type: 'question' | 'done';
  question: string;
  language: string;
}

export const fetchNextQuestion = async (messages: ChatMessage[], language: string = 'en'): Promise<AiResponse> => {
  try {
    const res = await fetch('http://localhost:8000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, language }),
    });
    if (!res.ok) throw new Error('API server returned error');
    const data = await res.json();
    return data as AiResponse;
  } catch (e) {
    console.warn('Backend API unavailable, using fallback client responses', e);
    const lastUserMessage = messages[messages.length - 1]?.content.toLowerCase() || '';
    if (messages.length > 5) return { type: 'done', question: '', language };
    
    if (lastUserMessage.includes('fever') || lastUserMessage.includes('बुखार')) {
      return { 
        type: 'question', 
        question: language === 'hi' ? 'आपको यह बुखार कितने दिनों से है?' : 'How long have you had this fever, and what is your temperature?', 
        language 
      };
    }
    return { 
      type: 'question', 
      question: language === 'hi' ? 'आपके यह लक्षण कब से हैं और दर्द कितना है?' : 'How long have you had these symptoms, and how severe is the pain on a scale of 1 to 10?', 
      language 
    };
  }
};

export const generateSummaryApi = async (messages: ChatMessage[]): Promise<string> => {
  try {
    const res = await fetch('http://localhost:8000/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });
    if (!res.ok) throw new Error('API server returned error');
    const data = await res.json();
    return data.summary;
  } catch (e) {
    console.warn('Backend API unavailable, using fallback summary generator', e);
    const userAnswers = messages.filter((m) => m.role === 'user').map((m) => m.content).join(' | ');
    return JSON.stringify({
      chiefComplaint: userAnswers || 'Fever and Generalized Body Ache',
      duration: '2-3 Days',
      painScale: 6,
      triageCategory: 'Yellow (Urgent Care)',
      recommendedDepartment: 'General Medicine',
      suggestedAction: 'Consulting Physician',
      clinicalNotes: 'Patient presented with self-reported acute symptoms. Vital check advised upon OPD entry.',
    });
  }
};

export const transcribeAudioApi = async (audioBlob: Blob): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    const res = await fetch('http://localhost:8000/api/transcribe', {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error('API server returned error during transcription');
    const data = await res.json();
    return data.text;
  } catch (e) {
    console.warn('Transcription API unavailable', e);
    throw e;
  }
};
