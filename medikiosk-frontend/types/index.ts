export type Language = 'en' | 'hi' | 'bn' | 'ta' | 'te' | 'mr';

export interface PatientState {
  language: Language;
  abhaId: string;
  patientName: string;
  age: number;
  gender: string;
  department: string;
  chiefComplaint: string;
  painScale: number;
  symptomDuration: string;
  transcript: Array<{ sender: 'ai' | 'user'; text: string }>;
  scannedDocuments: Array<{ id: string; category: string; dataUrl: string }>;
  audioGuidance: boolean;
  
  // Actions
  setLanguage: (lang: Language) => void;
  setAbhaId: (id: string) => void;
  setDepartment: (dept: string) => void;
  setChiefComplaint: (complaint: string) => void;
  setPainScale: (scale: number) => void;
  setSymptomDuration: (duration: string) => void;
  addTranscriptMessage: (sender: 'ai' | 'user', text: string) => void;
  addScannedDocument: (doc: { id: string; category: string; dataUrl: string }) => void;
  toggleAudioGuidance: () => void;
  reset: () => void;
}
