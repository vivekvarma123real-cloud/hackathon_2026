import { create } from 'zustand';
import { PatientState, Language } from '@/types';

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
      scannedDocuments: []
    })
}));
