export type Language = 'en' | 'hi';

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

  // Interview state machine
  currentQuestionId: string;
  structuredAnswers: Record<string, string>;
  conversationHistory: Array<{ role: 'assistant' | 'user'; content: string }>;
  interviewComplete: boolean;
  clinicalSummary: ClinicalSummary | null;

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

  // Interview actions
  setCurrentQuestionId: (id: string) => void;
  setStructuredAnswer: (questionId: string, answer: string) => void;
  setStructuredAnswers: (answers: Record<string, string>) => void;
  addConversationMessage: (role: 'assistant' | 'user', content: string) => void;
  setInterviewComplete: (complete: boolean) => void;
  setClinicalSummary: (summary: ClinicalSummary | null) => void;
  resetInterview: () => void;
}

export interface ClinicalSummary {
  chiefComplaint: string;
  location: string;
  onset: string;
  duration: string;
  severity: string;
  aggravatingRelievingFactors: string;
  associatedSymptoms: string;
  pastMedicalHistory: string;
  medications: string;
  allergies: string;
  additionalInformation: string;
}

export interface InterviewResponse {
  type: 'question' | 'complete' | 'red_flag';
  questionId: string | null;
  question: string | null;
  inputType: string | null;
  language: string;
  complete: boolean;
  extractedInfo?: string | null;
  structuredAnswers?: Record<string, string>;
}
