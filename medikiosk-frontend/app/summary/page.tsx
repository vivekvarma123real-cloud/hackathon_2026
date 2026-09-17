'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePatientStore } from '@/store/usePatientStore';
import { BottomNavBar } from '@/components/BottomNavBar';
import { speakText, getTTSLang } from '@/services/speech';

// Labels for each clinical category in both languages
const SUMMARY_LABELS: Record<string, { en: string; hi: string }> = {
  chiefComplaint: { en: 'Chief Complaint', hi: 'मुख्य शिकायत' },
  location: { en: 'Location', hi: 'स्थान' },
  onset: { en: 'Onset', hi: 'शुरुआत' },
  duration: { en: 'Duration', hi: 'अवधि' },
  severity: { en: 'Severity', hi: 'गंभीरता' },
  aggravatingRelievingFactors: { en: 'Aggravating / Relieving Factors', hi: 'बढ़ाने / कम करने वाले कारक' },
  associatedSymptoms: { en: 'Associated Symptoms', hi: 'संबंधित लक्षण' },
  pastMedicalHistory: { en: 'Past Medical History', hi: 'पिछला चिकित्सा इतिहास' },
  medications: { en: 'Current Medications', hi: 'वर्तमान दवाइयाँ' },
  allergies: { en: 'Allergies', hi: 'एलर्जी' },
  additionalInformation: { en: 'Additional Information', hi: 'अतिरिक्त जानकारी' },
};

const SUMMARY_FIELD_ORDER = [
  'chiefComplaint', 'location', 'onset', 'duration', 'severity',
  'aggravatingRelievingFactors', 'associatedSymptoms', 'pastMedicalHistory',
  'medications', 'allergies', 'additionalInformation',
];

export default function SummaryPage() {
  const router = useRouter();
  const {
    abhaId, patientName, age, gender, department,
    chiefComplaint, language, clinicalSummary, structuredAnswers,
  } = usePatientStore();

  const notReported = language === 'hi' ? 'जानकारी नहीं दी गई' : 'Not reported';

  // Build display data from clinical summary or structured answers
  const getSummaryValue = (key: string): string => {
    if (clinicalSummary) {
      const val = (clinicalSummary as any)[key];
      if (val && val.trim()) return val;
    }
    // Fallback to raw structured answers
    const rawKey = key === 'chiefComplaint' ? 'chief_complaint'
      : key === 'aggravatingRelievingFactors' ? 'aggravating_relieving'
      : key === 'associatedSymptoms' ? 'associated_symptoms'
      : key === 'pastMedicalHistory' ? 'past_history'
      : key === 'medications' ? 'medications_allergies'
      : key === 'allergies' ? 'medications_allergies'
      : key === 'additionalInformation' ? 'additional_information'
      : key;
    const rawVal = structuredAnswers[rawKey];
    return rawVal && rawVal.trim() ? rawVal : notReported;
  };

  const handlePrintToken = () => {
    router.push('/documents');
  };

  const handleSpeakSummary = () => {
    const summaryText = SUMMARY_FIELD_ORDER.map(key => {
      const label = SUMMARY_LABELS[key]?.[language] || key;
      const value = getSummaryValue(key);
      return `${label}: ${value}`;
    }).join('. ');
    
    speakText(
      language === 'hi'
        ? `${patientName} का सारांश। ${summaryText}`
        : `Summary for ${patientName}. ${summaryText}`,
      getTTSLang(language)
    );
  };

  return (
    <>
      <div className="w-full max-w-6xl flex flex-col gap-6 mt-2">
        {/* Header */}
        <div>
          <h2 className="font-headline-lg text-[32px] font-bold text-on-surface mb-1">
            {language === 'hi' ? 'समीक्षा और पुष्टि करें' : 'Review & Confirm'}
          </h2>
          <p className="font-body-lg text-[20px] text-on-surface-variant">
            {language === 'hi'
              ? 'कृपया टोकन प्रिंट करने से पहले अपने विवरण जांच लें।'
              : 'Please check your details before printing the token.'}
          </p>
        </div>

        {/* Patient Identity Card */}
        <div className="bg-surface-container-lowest border-2 border-outline-variant rounded-xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm">
          <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-primary-container shrink-0">
            <img
              alt="Patient Photo"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCZIfiQfQEr2TwZnZ-d_nDDEWjXdfYTXkU7k2cA8q5wL2deeLuvuICfKt_UsAU_vJbhvE7Fzt-u99ZBHQ1ANdV6XnE-HRd6tuB_MGWzijQbxzsxicC1hgED5NVdm-uvoy6sVwkQ7MnzR11di0gwg4exGbX4xt44bcMtPqvgCqAl_a6bApI1WD5DBuedmQnQ6rUPDJE7OUKXFJypjYaXi1uvM9vW-mpQxBhvKWbJV-8pbufkSrNe6Bt01Q"
            />
          </div>
          <div className="flex-grow text-center md:text-left">
            <h3 className="font-headline-md text-[28px] font-bold text-on-surface">{patientName || 'Ramesh Kumar'}</h3>
            <div className="font-label-xl text-[20px] font-bold text-primary mt-1">
              ABHA ID: {abhaId || '91-8273-4561-0982'}
            </div>
            <p className="font-body-md text-[18px] text-on-surface-variant mt-1">
              {gender || 'Male'}, {age || 45} Years | {department || 'General Medicine'}
            </p>
          </div>
          <div className="shrink-0 flex gap-4">
            <button
              onClick={() => router.push('/login')}
              className="h-[50px] px-6 rounded-lg bg-surface-container-high text-primary font-label-lg text-[16px] font-bold border-2 border-transparent hover:border-primary transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined">edit</span>
              {language === 'hi' ? 'प्रोफ़ाइल संपादित करें' : 'Edit Profile'}
            </button>
          </div>
        </div>

        {/* Clinical History Summary Grid */}
        <div className="bg-surface-container-lowest border-2 border-outline-variant rounded-xl p-6 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-center border-b-2 border-surface-container-highest pb-3">
            <h4 className="font-headline-md text-[24px] font-bold text-primary">
              {language === 'hi' ? 'नैदानिक इतिहास सारांश' : 'Clinical History Summary'}
            </h4>
            <button
              onClick={handleSpeakSummary}
              className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center hover:bg-primary-container transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined">volume_up</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SUMMARY_FIELD_ORDER.map((key) => {
              const value = getSummaryValue(key);
              const label = SUMMARY_LABELS[key]?.[language] || key;
              const isNotReported = value === notReported;

              return (
                <div key={key} className="border border-outline-variant rounded-lg p-4 bg-surface flex flex-col">
                  <span className="font-label-xl text-primary border-b border-surface-container-highest pb-1 mb-2 uppercase text-[14px] font-bold tracking-wider">
                    {label}
                  </span>
                  <p className={`font-body-md text-[18px] font-semibold ${isNotReported ? 'text-on-surface-variant italic' : 'text-on-surface'}`}>
                    {value}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="mt-4 flex justify-center w-full">
          <button
            onClick={handlePrintToken}
            className="w-full md:w-auto h-[64px] px-12 rounded-xl bg-secondary text-on-secondary font-label-xl text-[22px] font-bold flex items-center justify-center gap-4 hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer"
          >
            <span className="material-symbols-outlined text-[32px]">print</span>
            {language === 'hi' ? 'पुष्टि करें और टोकन प्रिंट करें' : 'Confirm & Print OPD Token'}
          </button>
        </div>
      </div>

      <BottomNavBar onNext={handlePrintToken} showNext={true} nextText={language === 'hi' ? 'टोकन प्रिंट' : 'Print Token'} />
    </>
  );
}
