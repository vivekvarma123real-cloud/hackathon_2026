'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { usePatientStore } from '@/store/usePatientStore';
import { BottomNavBar } from '@/components/BottomNavBar';
import { ShaderCanvas } from '@/components/ShaderCanvas';
import { speakText, checkRedFlags } from '@/services/speech';
import { fetchNextQuestion, generateSummaryApi, ChatMessage, transcribeAudioApi } from '@/services/clinicalApi';

export default function VoiceInputPage() {
  const router = useRouter();
  const { chiefComplaint, addTranscriptMessage, setChiefComplaint, language } = usePatientStore();

  const [questionEng, setQuestionEng] = useState(language === 'hi' ? 'मुख्य समस्या' : 'What is the main problem you are experiencing?');
  const [questionHindi, setQuestionHindi] = useState(language === 'hi' ? 'कृपया अपनी समस्या बताएं' : 'Main problem');
  const [isListening, setIsListening] = useState(false);
  const [transcriptText, setTranscriptText] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Processing...');
  const [redFlagAlert, setRedFlagAlert] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const vadTranscriptRef = useRef<string>('');

  const messagesRef = useRef<ChatMessage[]>([
    { role: 'assistant', content: language === 'hi' ? 'कृपया अपनी समस्या बताएं' : 'What is the main problem you are experiencing?' }
  ]);

  useEffect(() => {
    let mounted = true;
    
    const playAndRecord = async () => {
      if (chiefComplaint) {
        const initQ = language === 'hi' ? `${chiefComplaint} के बारे में आपकी क्या समस्या है?` : `What problem are you experiencing regarding ${chiefComplaint}?`;
        setQuestionEng(language === 'en' ? initQ : 'Additional details');
        setQuestionHindi(language === 'hi' ? initQ : 'अतिरिक्त जानकारी');
        messagesRef.current = [{ role: 'assistant', content: initQ }];
        await speakText(initQ, language === 'hi' ? 'hi-IN' : 'en-US');
      } else {
        const initQ = language === 'hi' ? 'कृपया अपनी समस्या बताएं' : 'What is the main problem you are experiencing?';
        await speakText(initQ, language === 'hi' ? 'hi-IN' : 'en-US');
      }
      
      if (mounted) {
        handleStartListening();
      }
    };
    
    playAndRecord();
    
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chiefComplaint, language]);

  const handleStartListening = async () => {
    if (isListening) {
      // Stop recording if already listening
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsListening(false);
        setIsLoading(true);
        setLoadingMsg('Transcribing audio...');
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const text = await transcribeAudioApi(audioBlob);
          setTranscriptText(text);
          setShowConfirm(true);
          if (checkRedFlags(text)) {
            setRedFlagAlert(true);
          }
        } catch (e) {
          console.warn("Backend Whisper failed, falling back to browser VAD text", e);
          const fallbackText = vadTranscriptRef.current.trim();
          if (fallbackText) {
            setTranscriptText(fallbackText);
            setShowConfirm(true);
            if (checkRedFlags(fallbackText)) {
              setRedFlagAlert(true);
            }
          } else {
            setTranscriptText("Sorry, I couldn't hear you. Please tap Speak Again.");
            setShowConfirm(true);
          }
        } finally {
          setIsLoading(false);
        }
      };

      mediaRecorder.start();
      setIsListening(true);
      setShowTranscript(true);
      setShowConfirm(false);
      vadTranscriptRef.current = '';
      setTranscriptText('Listening... / सुन रहा है...');

      // Use Web Speech API for Voice Activity Detection (auto-stop)
      if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';

        recognition.onresult = (event: any) => {
           let interim = '';
           for (let i = event.resultIndex; i < event.results.length; ++i) {
             interim += event.results[i][0].transcript;
           }
           vadTranscriptRef.current = interim;
           setTranscriptText(interim);
        };

        recognition.onend = () => {
          // Speech ended! Stop the media recorder automatically
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
          }
        };

        try {
          recognition.start();
        } catch (e) {
          console.error("VAD recognition error", e);
        }
      }
    } catch (e) {
      console.error(e);
      setShowTranscript(true);
      setTranscriptText(chiefComplaint || 'Fever and severe cough since yesterday');
      setShowConfirm(true);
    }
  };

  const handleConfirmAnswer = async () => {
    const text = transcriptText || chiefComplaint || 'Patient response';
    addTranscriptMessage('user', text);
    setChiefComplaint(text);
    messagesRef.current.push({ role: 'user', content: text });

    setIsLoading(true);
    setLoadingMsg('Analyzing symptoms / विश्लेषण किया जा रहा है...');

    try {
      const reply = await fetchNextQuestion(messagesRef.current, language);

      if (reply.type === 'done' || messagesRef.current.length >= 8) {
        setLoadingMsg('Generating Clinical Summary...');
        const summary = await generateSummaryApi(messagesRef.current);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('finalSummary', summary);
        }
        setIsLoading(false);
        router.push('/questions');
      } else {
        setQuestionEng(language === 'en' ? reply.question : 'Additional Information Required');
        setQuestionHindi(language === 'hi' ? reply.question : 'कृपया अतिरिक्त जानकारी दें');
        
        messagesRef.current.push({ role: 'assistant', content: reply.question });
        addTranscriptMessage('ai', reply.question);
        
        setShowTranscript(false);
        setShowConfirm(false);
        setTranscriptText('');
        setIsLoading(false);
        
        await speakText(reply.question, language === 'hi' ? 'hi-IN' : 'en-US');
        handleStartListening();
      }
    } catch (e) {
      setIsLoading(false);
      router.push('/questions');
    }
  };

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
              Your symptoms require immediate medical attention. Please step directly to the Emergency Desk!
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
        {/* Instruction */}
        <div className="text-center w-full">
          <h1 className="font-headline-lg text-[36px] font-extrabold text-[#00236f] mb-3">{questionHindi}</h1>
          <h2 className="font-headline-md text-[26px] font-bold text-[#444651]">{questionEng}</h2>
        </div>

        {/* Interactive Voice Orb (Using exact circle.html WebGL shader) */}
        <button
          onClick={handleStartListening}
          className={`relative w-64 h-64 md:w-72 md:h-72 flex items-center justify-center rounded-full bg-black border-4 border-[#00236f] shadow-2xl cursor-pointer hover:scale-105 transition-transform ${
            isListening ? 'pulse-border' : ''
          }`}
          title="Click to speak"
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
                {isListening ? 'Listening / सुन रहा है...' : 'You Said / आपने कहा:'}
              </span>
            </div>
            <div className="border-l-4 border-primary pl-4 py-1">
              <p className="font-body-lg text-[22px] font-medium text-on-surface">{transcriptText || '...'}</p>
            </div>
            <div className="mt-2 pt-4 border-t border-outline-variant/30 flex justify-end gap-4">
              <button
                onClick={handleStartListening}
                className="text-primary h-[50px] px-6 rounded-lg font-label-xl text-[18px] font-bold flex items-center gap-2 hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">replay</span>
                Speak Again / फिर से बोलें
              </button>

              {showConfirm && (
                <button
                  onClick={handleConfirmAnswer}
                  className="bg-secondary text-on-secondary h-[50px] px-8 rounded-lg font-label-xl text-[18px] font-bold flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-md"
                >
                  <span className="material-symbols-outlined">check_circle</span>
                  Confirm / पुष्टि करें
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-surface p-8 rounded-2xl flex flex-col items-center gap-4 shadow-2xl">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="font-label-xl text-[20px] font-bold text-primary">{loadingMsg}</p>
          </div>
        </div>
      )}

      <BottomNavBar onNext={handleConfirmAnswer} showNext={true} nextText="Next / आगे बढ़ें" />
    </>
  );
}
