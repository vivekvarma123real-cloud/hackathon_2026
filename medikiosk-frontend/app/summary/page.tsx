'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePatientStore } from '@/store/usePatientStore';
import { BottomNavBar } from '@/components/BottomNavBar';
import { speakText } from '@/services/speech';

export default function SummaryPage() {
  const router = useRouter();
  const { abhaId, patientName, age, gender, department, chiefComplaint, painScale, symptomDuration, language } =
    usePatientStore();

  const [summaryText, setSummaryText] = useState('Loading summary...');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('finalSummary');
      if (stored) {
        setSummaryText(stored);
      } else {
        setSummaryText(
          JSON.stringify(
            {
              chiefComplaint: chiefComplaint || 'Fever and Generalized Body Ache',
              duration: symptomDuration || '2-3 Days',
              painScale: painScale || 5,
              recommendedDepartment: department || 'General Medicine',
              patientAbha: abhaId,
            },
            null,
            2
          )
        );
      }
    }
  }, [chiefComplaint, symptomDuration, painScale, department, abhaId]);

  const handlePrintToken = () => {
    router.push('/documents');
  };

  return (
    <>
      <div className="w-full max-w-6xl flex flex-col gap-6 mt-2">
        {/* Header */}
        <div>
          <h2 className="font-headline-lg text-[32px] font-bold text-on-surface mb-1">
            Review & Confirm / समीक्षा और पुष्टि करें
          </h2>
          <p className="font-body-lg text-[20px] text-on-surface-variant">
            Please check your details before printing the token.
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
              Edit Profile
            </button>
          </div>
        </div>

        {/* Clinical History & Details Grid */}
        <div className="bg-surface-container-lowest border-2 border-outline-variant rounded-xl p-6 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-center border-b-2 border-surface-container-highest pb-3">
            <h4 className="font-headline-md text-[24px] font-bold text-primary">Clinical History Summary</h4>
            <button
              onClick={() => speakText(
                language === 'hi' 
                  ? `${patientName} का सारांश। विभाग: ${department}। शिकायत: ${chiefComplaint}` 
                  : `Summary for ${patientName}. Department: ${department}. Complaint: ${chiefComplaint}`,
                language === 'hi' ? 'hi-IN' : 'en-US'
              )}
              className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center hover:bg-primary-container transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined">volume_up</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-outline-variant rounded-lg p-4 bg-surface flex flex-col">
              <span className="font-label-xl text-primary border-b border-surface-container-highest pb-1 mb-2 uppercase text-[14px] font-bold tracking-wider">
                Chief Complaint / मुख्य शिकायत
              </span>
              <p className="font-body-md text-[18px] text-on-surface font-semibold">{chiefComplaint || 'Fever and Cough'}</p>
            </div>

            <div className="border border-outline-variant rounded-lg p-4 bg-surface flex flex-col">
              <span className="font-label-xl text-primary border-b border-surface-container-highest pb-1 mb-2 uppercase text-[14px] font-bold tracking-wider">
                Symptom Duration / लक्षण कितने समय से हैं
              </span>
              <p className="font-body-md text-[18px] text-on-surface font-semibold">{symptomDuration || '2-3 Days'}</p>
            </div>

            <div className="border border-outline-variant rounded-lg p-4 bg-surface flex flex-col">
              <span className="font-label-xl text-primary border-b border-surface-container-highest pb-1 mb-2 uppercase text-[14px] font-bold tracking-wider">
                Pain Scale Rating / दर्द की तीव्रता
              </span>
              <p className="font-body-md text-[18px] text-on-surface font-semibold">{painScale || 5} / 10</p>
            </div>

            <div className="border border-outline-variant rounded-lg p-4 bg-surface flex flex-col">
              <span className="font-label-xl text-primary border-b border-surface-container-highest pb-1 mb-2 uppercase text-[14px] font-bold tracking-wider">
                Recommended Department / अनुशंसित विभाग
              </span>
              <p className="font-body-md text-[18px] text-on-surface font-semibold">{department || 'General Medicine'}</p>
            </div>
          </div>
        </div>

        {/* Technical FHIR Preview Collapsible */}
        <div className="bg-surface-container-low border-2 border-outline-variant rounded-xl p-4 shadow-sm font-mono text-sm">
          <details className="group">
            <summary className="font-label-lg text-[16px] font-bold text-on-surface-variant uppercase tracking-wider cursor-pointer select-none flex items-center gap-2">
              <span className="material-symbols-outlined transition-transform group-open:rotate-90">
                chevron_right
              </span>
              <span className="material-symbols-outlined">code</span>
              FHIR JSON Preview (Technical)
            </summary>
            <div className="bg-white p-4 rounded border border-outline-variant mt-3 overflow-x-auto text-on-surface">
              <pre className="whitespace-pre-wrap break-words">{summaryText}</pre>
            </div>
          </details>
        </div>

        {/* Primary Action Button */}
        <div className="mt-4 flex justify-center w-full">
          <button
            onClick={handlePrintToken}
            className="w-full md:w-auto h-[64px] px-12 rounded-xl bg-secondary text-on-secondary font-label-xl text-[22px] font-bold flex items-center justify-center gap-4 hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer"
          >
            <span className="material-symbols-outlined text-[32px]">print</span>
            Confirm & Print OPD Token / टोकन प्रिंट करें
          </button>
        </div>
      </div>

      <BottomNavBar onNext={handlePrintToken} showNext={true} nextText="Print Token / टोकन प्रिंट" />
    </>
  );
}
