import { create } from 'zustand';
import { PatientState, Language, ClinicalSummary } from '@/types';

const INITIAL_INTERVIEW_STATE = {
  currentQuestionId: 'chief_complaint',
  structuredAnswers: {} as Record<string, string>,
  conversationHistory: [] as Array<{ role: 'assistant' | 'user'; content: string }>,
  interviewComplete: false,
  clinicalSummary: null as ClinicalSummary | null,
};

export const usePatientStore = create<PatientState>((set) => ({
  language: 'hi',
  abhaId: '91-8273-4561-0982',
  patientName: 'Ramesh Kumar',
  age: 45,
  gender: 'Male',
  department: 'General Medicine',
  chiefComplaint: '',
  painScale: 5,
  symptomDuration: '2-3 Days',
  transcript: [
    { sender: 'ai', text: 'नमस्ते! मैं आपकी क्या सहायता कर सकता हूँ? / Hello! How can I assist you today?' }
  ],
  scannedDocuments: [],
  audioGuidance: true,

  // Interview state
  ...INITIAL_INTERVIEW_STATE,

  // Basic actions
  setLanguage: (lang: Language) => set({ language: lang }),
  setAbhaId: (id: string) => set({ abhaId: id }),
  setDepartment: (dept: string) => set({ department: dept }),
  setChiefComplaint: (complaint: string) => set({ chiefComplaint: complaint }),
  setPainScale: (scale: number) => set({ painScale: scale }),
  setSymptomDuration: (duration: string) => set({ symptomDuration: duration }),
  addTranscriptMessage: (sender: 'ai' | 'user', text: string) =>
    set((state) => ({
      transcript: [...state.transcript, { sender, text }]
    })),
  addScannedDocument: (doc) =>
    set((state) => ({
      scannedDocuments: [...state.scannedDocuments, doc]
    })),
  toggleAudioGuidance: () => set((state) => ({ audioGuidance: !state.audioGuidance })),

  // Interview actions
  setCurrentQuestionId: (id: string) => set({ currentQuestionId: id }),
  setStructuredAnswer: (questionId: string, answer: string) =>
    set((state) => ({
      structuredAnswers: { ...state.structuredAnswers, [questionId]: answer }
    })),
  setStructuredAnswers: (answers: Record<string, string>) =>
    set({ structuredAnswers: answers }),
  addConversationMessage: (role: 'assistant' | 'user', content: string) =>
    set((state) => ({
      conversationHistory: [...state.conversationHistory, { role, content }]
    })),
  setInterviewComplete: (complete: boolean) => set({ interviewComplete: complete }),
  setClinicalSummary: (summary: ClinicalSummary | null) => set({ clinicalSummary: summary }),
  resetInterview: () => set({ ...INITIAL_INTERVIEW_STATE }),

  // Full reset
  reset: () =>
    set({
      language: 'hi',
      abhaId: '91-8273-4561-0982',
      chiefComplaint: '',
      painScale: 5,
      symptomDuration: '2-3 Days',
      transcript: [
        { sender: 'ai', text: 'नमस्ते! मैं आपकी क्या सहायता कर सकता हूँ? / Hello! How can I assist you today?' }
      ],
      scannedDocuments: [],
      ...INITIAL_INTERVIEW_STATE,
    })
}));
