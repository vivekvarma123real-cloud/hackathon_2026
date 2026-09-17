'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePatientStore } from '@/store/usePatientStore';
import { BottomNavBar } from '@/components/BottomNavBar';
import { ShaderCanvas } from '@/components/ShaderCanvas';
import { speakText, checkRedFlags, getTTSLang, cancelSpeech } from '@/services/speech';
import { submitInterviewAnswer, generateSummaryApi, transcribeAudioApi } from '@/services/clinicalApi';

// Predefined first questions (must match backend PREDEFINED_QUESTIONS)
const FIRST_QUESTIONS: Record<string, Record<string, string>> = {
  chief_complaint: {
    en: 'What problem are you experiencing today?',
    hi: 'आज आपको किस समस्या के लिए मदद चाहिए?',
  },
};

const QUESTION_ORDER = [
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
];

const PREDEFINED_QUESTIONS: Record<string, Record<string, string>> = {
  chief_complaint: { en: "What problem are you experiencing today?", hi: "आज आपको किस समस्या के लिए मदद चाहिए?" },
  location: { en: "Where exactly are you having the problem or pain?", hi: "आपको समस्या या दर्द ठीक कहाँ हो रहा है?" },
  onset: { en: "When did this problem start?", hi: "यह समस्या कब शुरू हुई?" },
  duration: { en: "How long have you had this problem?", hi: "आपको यह समस्या कितने समय से है?" },
  severity: { en: "How severe is it on a scale of 1 to 10?", hi: "1 से 10 के पैमाने पर यह समस्या या दर्द कितना गंभीर है?" },
  aggravating_relieving: { en: "What makes it better or worse?", hi: "किस चीज़ से यह समस्या बेहतर या बदतर होती है?" },
  associated_symptoms: { en: "Do you have any other symptoms along with this problem?", hi: "इस समस्या के साथ आपको और कोई लक्षण हैं?" },
  past_history: { en: "Have you had this problem before, or do you have any important medical conditions?", hi: "क्या आपको यह समस्या पहले भी हुई है, या आपको कोई महत्वपूर्ण बीमारी है?" },
  medications_allergies: { en: "Are you currently taking any medicines, and do you have any allergies?", hi: "क्या आप अभी कोई दवा ले रहे हैं, और क्या आपको किसी दवा या चीज़ से एलर्जी है?" },
  additional_information: { en: "Is there anything else about your problem that you think the doctor should know?", hi: "क्या आपकी समस्या के बारे में और कुछ है जो डॉक्टर को जानना चाहिए?" },
};

export default function VoiceInputPage() {
  const router = useRouter();
  
  // Read from Zustand store
  const language = usePatientStore((s) => s.language);
  const chiefComplaint = usePatientStore((s) => s.chiefComplaint);
  const currentQuestionId = usePatientStore((s) => s.currentQuestionId);
  const structuredAnswers = usePatientStore((s) => s.structuredAnswers);
  const conversationHistory = usePatientStore((s) => s.conversationHistory);
  const interviewComplete = usePatientStore((s) => s.interviewComplete);
  
  // Zustand actions
  const addTranscriptMessage = usePatientStore((s) => s.addTranscriptMessage);
  const setChiefComplaint = usePatientStore((s) => s.setChiefComplaint);
  const setCurrentQuestionId = usePatientStore((s) => s.setCurrentQuestionId);
  const setStructuredAnswer = usePatientStore((s) => s.setStructuredAnswer);
  const setStructuredAnswers = usePatientStore((s) => s.setStructuredAnswers);
  const addConversationMessage = usePatientStore((s) => s.addConversationMessage);
  const setInterviewComplete = usePatientStore((s) => s.setInterviewComplete);
  const setClinicalSummary = usePatientStore((s) => s.setClinicalSummary);

  // Local UI state
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [transcriptText, setTranscriptText] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Processing...');
  const [redFlagAlert, setRedFlagAlert] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Refs for avoiding stale closures
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isListeningRef = useRef(false);
  const isProcessingRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const recognitionRef = useRef<any>(null);

  // ---- Initialize: speak the first question on mount ----
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const init = async () => {
      let firstQ: string;
      
      if (chiefComplaint) {
        // If a complaint was pre-selected (e.g., from intake page tapping "Fever"),
        // treat it as the chief complaint answer and ask the next question
        firstQ = language === 'hi'
          ? `आपने बताया कि आपकी समस्या "${chiefComplaint}" है। आपको समस्या या दर्द ठीक कहाँ हो रहा है?`
          : `You mentioned "${chiefComplaint}". Where exactly are you having the problem or pain?`;
        
        // Store the chief complaint in structured answers
        setStructuredAnswer('chief_complaint', chiefComplaint);
        addConversationMessage('user', chiefComplaint);
        addTranscriptMessage('user', chiefComplaint);
        setCurrentQuestionId('location');
        addConversationMessage('assistant', firstQ);
        addTranscriptMessage('ai', firstQ);
      } else {
        // Start with chief complaint question
        firstQ = FIRST_QUESTIONS.chief_complaint[language] || FIRST_QUESTIONS.chief_complaint.en;
        addConversationMessage('assistant', firstQ);
        addTranscriptMessage('ai', firstQ);
      }
      
      setCurrentQuestion(firstQ);
      
      // Speak the question
      setIsSpeaking(true);
      await speakText(firstQ, getTTSLang(language));
      setIsSpeaking(false);
      
      // Small delay to let TTS release audio bus before starting mic
      await new Promise(r => setTimeout(r, 300));
      
      // Auto-start listening
      startListening();
    };
    
    init();
    
    return () => {
      // Cleanup on unmount
      cancelSpeech();
      stopListening();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const processPatientAnswer = useCallback(async (answerText: string) => {
    console.log(`[VOICE] beginning answer processing`);
    setIsProcessing(true);
    isProcessingRef.current = true;
    setShowConfirm(false);
    setErrorMsg('');
    setLoadingMsg(language === 'hi' ? 'विश्लेषण किया जा रहा है...' : 'Analyzing symptoms...');

    try {
      console.log(`[STATE] saving patient answer`);
      addTranscriptMessage('user', answerText);
      addConversationMessage('user', answerText);
      
      const storeState = usePatientStore.getState();
      console.log(`[STATE] currentQuestionId before processing: ${storeState.currentQuestionId}`);
      
      if (storeState.currentQuestionId === 'chief_complaint') {
        setChiefComplaint(answerText);
      }

      console.log(`[API] sending answer to clinical endpoint`);
      console.log(`[API] clinical request started`);
      
      // Get current state snapshot for the API call
      const currentState = usePatientStore.getState();
      
      // Submit to backend interview state machine
      const reply = await submitInterviewAnswer(
        language,
        currentState.currentQuestionId,
        answerText,
        currentState.structuredAnswers,
        currentState.conversationHistory,
        currentState.chiefComplaint || answerText,
      );

      console.log(`[API] clinical response received`);
      console.log(`[API] response status: 200`);
      console.log(`[API] response body:`, JSON.stringify(reply));

      // Update structured answers from backend
      if (reply.structuredAnswers) {
        setStructuredAnswers(reply.structuredAnswers);
      }
      if (reply.extractedInfo && currentState.currentQuestionId) {
        setStructuredAnswer(currentState.currentQuestionId, reply.extractedInfo);
      }

      // ---- Handle red flag ----
      if (reply.type === 'red_flag') {
        setRedFlagAlert(true);
        setIsProcessing(false);
        isProcessingRef.current = false;
        if (reply.question) {
          setCurrentQuestion(reply.question);
          addConversationMessage('assistant', reply.question);
          addTranscriptMessage('ai', reply.question);
          await speakText(reply.question, getTTSLang(language));
        }
        return;
      }

      // ---- Handle interview complete ----
      if (reply.type === 'complete' || reply.complete) {
        setLoadingMsg(language === 'hi' ? 'सारांश तैयार हो रहा है...' : 'Generating Clinical Summary...');
        setInterviewComplete(true);
        
        // Generate summary from structured answers
        const finalState = usePatientStore.getState();
        const summary = await generateSummaryApi(
          language,
          finalState.structuredAnswers,
          finalState.conversationHistory,
        );
        setClinicalSummary(summary);
        
        setIsProcessing(false);
        isProcessingRef.current = false;
        router.push('/summary');
        return;
      }

      // ---- Handle next question ----
      if (reply.type === 'question' && reply.question && reply.questionId) {
        const nextQ = reply.question;
        
        console.log(`[STATE] next question ID: ${reply.questionId}`);
        console.log(`[STATE] next question text: ${nextQ}`);
        
        setCurrentQuestionId(reply.questionId);
        setCurrentQuestion(nextQ);
        addConversationMessage('assistant', nextQ);
        addTranscriptMessage('ai', nextQ);
        
        // Reset UI for next answer
        setShowTranscript(false);
        setShowConfirm(false);
        setTranscriptText('');
        
        console.log(`[STATE] isProcessing=false`);
        setIsProcessing(false);
        isProcessingRef.current = false;
        
        console.log(`[UI] rendering next question`);
        console.log(`[TTS] speaking next question`);
        // Speak the question
        setIsSpeaking(true);
        await speakText(nextQ, getTTSLang(language));
        setIsSpeaking(false);
        
        // Small delay after TTS before starting mic
        await new Promise(r => setTimeout(r, 300));
        
        // Auto-start listening for next answer
        startListening();
        return;
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (e: any) {
      console.error('[VoiceInput] Error processing answer:', e);
      
      // Qwen/Backend failure -> CRITICAL FALLBACK -> deterministic flow
      const currentState = usePatientStore.getState();
      const currentQId = currentState.currentQuestionId;
      
      if (currentQId) {
        setStructuredAnswer(currentQId, answerText);
      }
      
      const currentIdx = QUESTION_ORDER.indexOf(currentQId);
      const nextQId = currentIdx >= 0 && currentIdx < QUESTION_ORDER.length - 1 ? QUESTION_ORDER[currentIdx + 1] : null;

      if (nextQId) {
        const nextQ = PREDEFINED_QUESTIONS[nextQId][language] || PREDEFINED_QUESTIONS[nextQId]['en'];
        console.log(`[STATE] next question ID: ${nextQId} (FALLBACK)`);
        console.log(`[STATE] next question text: ${nextQ} (FALLBACK)`);
        
        setCurrentQuestionId(nextQId);
        setCurrentQuestion(nextQ);
        addConversationMessage('assistant', nextQ);
        addTranscriptMessage('ai', nextQ);
        
        setShowTranscript(false);
        setTranscriptText('');
        
        console.log(`[STATE] isProcessing=false`);
        setIsProcessing(false);
        isProcessingRef.current = false;
        
        console.log(`[UI] rendering next question (FALLBACK)`);
        console.log(`[TTS] speaking next question (FALLBACK)`);
        
        setIsSpeaking(true);
        await speakText(nextQ, getTTSLang(language));
        setIsSpeaking(false);
        
        await new Promise(r => setTimeout(r, 300));
        startListening();
        return;
      } else {
        // Fallback complete
        setLoadingMsg(language === 'hi' ? 'सारांश तैयार हो रहा है...' : 'Generating Clinical Summary...');
        setInterviewComplete(true);
        setIsProcessing(false);
        isProcessingRef.current = false;
        router.push('/summary');
        return;
      }
    }
  }, [language, router, addTranscriptMessage, addConversationMessage,
      setChiefComplaint, setCurrentQuestionId, setStructuredAnswer, setStructuredAnswers,
      setInterviewComplete, setClinicalSummary]);

  // ---- Start microphone recording ----
  const startListening = useCallback(async () => {
    if (isListeningRef.current || isProcessingRef.current) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const types = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus'
      ];
      let mimeType = '';
      for (const t of types) {
        if (MediaRecorder.isTypeSupported(t)) {
          mimeType = t;
          break;
        }
      }
      
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        isListeningRef.current = false;
        setIsListening(false);
        
        // Stop all tracks to release mic
        stream.getTracks().forEach(track => track.stop());
        
        if (audioChunksRef.current.length === 0) {
          setTranscriptText('');
          setShowConfirm(false);
          return;
        }

        setIsProcessing(true);
        isProcessingRef.current = true;
        setLoadingMsg(language === 'hi' ? 'ऑडियो ट्रांसक्राइब हो रहा है...' : 'Transcribing audio...');

        let finalTranscriptText = '';

        try {
          const actualMimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: actualMimeType });
          const result = await transcribeAudioApi(audioBlob);
          finalTranscriptText = result.text.trim();
          
          console.log(`[VOICE] transcription received: ${finalTranscriptText}`);
        } catch (e) {
          console.error('[VoiceInput] Transcription failed:', e);
          setTranscriptText(language === 'hi' ? 'ट्रांसक्रिप्शन विफल। कृपया फिर से बोलें।' : 'Transcription failed. Please tap Speak Again.');
          setShowConfirm(false);
          setErrorMsg(language === 'hi' ? 'ट्रांसक्रिप्शन सेवा उपलब्ध नहीं है।' : 'Transcription service unavailable.');
          setIsProcessing(false);
          isProcessingRef.current = false;
          return;
        }

        if (!finalTranscriptText || finalTranscriptText.length < 2) {
          setTranscriptText(language === 'hi' ? 'कुछ सुनाई नहीं दिया। कृपया फिर से बोलें।' : "Couldn't hear you. Please tap Speak Again.");
          setShowConfirm(false);
          setIsProcessing(false);
          isProcessingRef.current = false;
          return;
        }
        
        setTranscriptText(finalTranscriptText);

        if (checkRedFlags(finalTranscriptText)) {
          setRedFlagAlert(true);
          setIsProcessing(false);
          isProcessingRef.current = false;
          return;
        }

        // Automatic Answer Processing Pipeline
        await processPatientAnswer(finalTranscriptText);
      };

      mediaRecorder.start();
      isListeningRef.current = true;
      setIsListening(true);
      setShowTranscript(true);
      setShowConfirm(false);
      setErrorMsg('');
      setTranscriptText(language === 'hi' ? 'सुन रहा है...' : 'Listening...');

      // Restore Web Speech API ONLY for live visual feedback (do not let it control MediaRecorder)
      if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
        if (recognitionRef.current) {
          try { recognitionRef.current.abort(); } catch {}
        }
        
        const SpeechRecognition = (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';

        recognition.onresult = (event: any) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            interim += event.results[i][0].transcript;
          }
          if (interim) setTranscriptText(interim);
        };

        // We ignore onerror, they will NOT stop the MediaRecorder!
        recognition.onerror = (e: any) => {
          console.warn('[VoiceInput] Speech recognition error (ignored for MediaRecorder):', e.error);
        };

        // If it stops (e.g. due to no-speech bug), instantly restart it to keep live UI active!
        recognition.onend = () => {
          if (isListeningRef.current && recognitionRef.current) {
            setTimeout(() => {
              if (isListeningRef.current && recognitionRef.current) {
                try { recognitionRef.current.start(); } catch {}
              }
            }, 100);
          }
        };

        try {
          recognition.start();
        } catch (e) {
          console.error('[VoiceInput] Recognition start error:', e);
        }
      }

      // Auto-stop after 60 seconds as an absolute fallback to prevent infinite recording
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      }, 60000);
    } catch (e) {
      console.error('[VoiceInput] Microphone access error:', e);
      setShowTranscript(true);
      setTranscriptText(language === 'hi' ? 'माइक्रोफ़ोन की अनुमति नहीं मिली।' : 'Microphone access denied.');
      setShowConfirm(false);
      setErrorMsg(language === 'hi' ? 'कृपया माइक्रोफ़ोन की अनुमति दें।' : 'Please allow microphone access.');
    }
  }, [language, processPatientAnswer]);

  // ---- Stop recording ----
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // ---- Handle mic button click ----
  const handleMicClick = useCallback(() => {
    if (isProcessingRef.current) return;
    
    if (isListeningRef.current) {
      stopListening();
    } else {
      startListening();
    }
  }, [startListening, stopListening]);

  // ---- Handle "Speak Again" ----
  const handleSpeakAgain = useCallback(() => {
    if (isProcessingRef.current) return;
    cancelSpeech();
    setShowConfirm(false);
    setTranscriptText('');
    setErrorMsg('');
    startListening();
  }, [startListening]);

  return (
    <>
      {/* Emergency Banner */}
      <div className="bg-[#ba1a1a] text-white w-full px-margin-page py-3 flex items-center justify-center gap-4 fixed top-[80px] left-0 z-40 shadow-md">
        <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          warning
        </span>
        <p className="font-label-xl text-[18px] font-bold text-center">
          If you have severe chest pain or difficulty breathing, tap{' '}
          <span className="bg-white text-[#ba1a1a] px-3 py-1 rounded ml-2 font-black uppercase">
            EMERGENCY ASSISTANCE
          </span>{' '}
          now.
        </p>
      </div>

      {redFlagAlert && (
        <div className="fixed inset-0 bg-red-950/80 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-8 max-w-lg text-center flex flex-col items-center gap-6 border-4 border-error">
            <span className="material-symbols-outlined text-6xl text-error animate-bounce">emergency</span>
            <h2 className="text-3xl font-extrabold text-error">EMERGENCY RED FLAG DETECTED</h2>
            <p className="text-xl text-slate-800">
              {language === 'hi'
                ? 'आपके लक्षणों को तुरंत चिकित्सा ध्यान की आवश्यकता है। कृपया सीधे आपातकालीन डेस्क पर जाएं!'
                : 'Your symptoms require immediate medical attention. Please step directly to the Emergency Desk!'}
            </p>
            <button
              onClick={() => setRedFlagAlert(false)}
              className="bg-error text-white font-bold text-xl px-8 py-4 rounded-xl hover:brightness-110"
            >
              Acknowledge / समझ गए
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-4xl flex flex-col items-center justify-center gap-8 mt-16">
        {/* Current Question Display */}
        <div className="text-center w-full">
          <h1 className="font-headline-lg text-[36px] font-extrabold text-[#00236f] mb-3">
            {currentQuestion}
          </h1>
          {isSpeaking && (
            <p className="font-body-md text-[16px] text-on-surface-variant animate-pulse">
              {language === 'hi' ? '🔊 बोल रहा है...' : '🔊 Speaking...'}
            </p>
          )}
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="w-full max-w-3xl bg-error-container text-on-error-container rounded-lg p-4 text-center font-label-lg text-[16px] font-bold">
            {errorMsg}
          </div>
        )}

        {/* Interactive Voice Orb */}
        <button
          onClick={handleMicClick}
          disabled={isProcessing}
          className={`relative w-64 h-64 md:w-72 md:h-72 flex items-center justify-center rounded-full bg-black border-4 border-[#00236f] shadow-2xl cursor-pointer hover:scale-105 transition-transform ${
            isListening ? 'pulse-border' : ''
          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={isListening ? (language === 'hi' ? 'रिकॉर्डिंग रोकें' : 'Stop recording') : (language === 'hi' ? 'बोलने के लिए दबाएं' : 'Click to speak')}
        >
          <div className="absolute inset-0 w-full h-full rounded-full overflow-hidden">
            <ShaderCanvas type="orb" className="w-full h-full" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 mix-blend-overlay opacity-80">
            <span className="material-symbols-outlined text-[88px] text-[#00f2fe] drop-shadow-lg">mic</span>
          </div>
        </button>

        {/* Live Transcript Card */}
        {showTranscript && (
          <div className="w-full max-w-3xl bg-surface-container-lowest border-2 border-outline-variant rounded-xl p-6 flex flex-col gap-4 shadow-md">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-error animate-pulse' : 'bg-secondary'}`} />
              <span className="font-label-lg text-[18px] font-bold text-on-surface-variant uppercase tracking-wider">
                {isListening
                  ? (language === 'hi' ? 'सुन रहा है...' : 'Listening...')
                  : (language === 'hi' ? 'आपने कहा:' : 'You Said:')}
              </span>
            </div>
            <div className="border-l-4 border-primary pl-4 py-1">
              <p className="font-body-lg text-[22px] font-medium text-on-surface">{transcriptText || '...'}</p>
            </div>
            <div className="mt-2 pt-4 border-t border-outline-variant/30 flex justify-end gap-4">
              <button
                onClick={handleSpeakAgain}
                disabled={isProcessing}
                className="text-primary h-[50px] px-6 rounded-lg font-label-xl text-[18px] font-bold flex items-center gap-2 hover:bg-surface-container-high transition-colors cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined">replay</span>
                {language === 'hi' ? 'फिर से बोलें' : 'Speak Again'}
              </button>

              {/* The confirm button has been removed for a seamless automatic flow. */}
            </div>
          </div>
        )}
      </div>

      {/* Loading overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-surface p-8 rounded-2xl flex flex-col items-center gap-4 shadow-2xl">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="font-label-xl text-[20px] font-bold text-primary">{loadingMsg}</p>
          </div>
        </div>
      )}

      <BottomNavBar />
    </>
  );
}
