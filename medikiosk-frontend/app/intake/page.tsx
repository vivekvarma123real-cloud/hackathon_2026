'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { usePatientStore } from '@/store/usePatientStore';
import { BottomNavBar } from '@/components/BottomNavBar';

export default function IntakePage() {
  const router = useRouter();
  const { setDepartment, setChiefComplaint } = usePatientStore();

  const handleSelectDepartment = (deptName: string) => {
    setDepartment(deptName);
    router.push('/voice-input');
  };

  const handleStartInterview = (complaint: string) => {
    setChiefComplaint(complaint);
    router.push('/voice-input');
  };

  return (
    <>
      <div className="w-full max-w-5xl flex flex-col gap-6">
        {/* Header */}
        <header className="max-w-4xl">
          <h2 className="font-display-lg text-[36px] font-extrabold text-on-surface">
            What brings you to the hospital today?
          </h2>
          <p className="font-body-lg text-[20px] text-on-surface-variant mt-2">
            Select a department or a common symptom below. / कृपया अपना विभाग या लक्षण चुनें।
          </p>
        </header>

        {/* Primary Pathway Cards */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          {/* Modern Allopathic Card */}
          <button
            onClick={() => handleSelectDepartment('General Medicine')}
            className="group flex flex-col items-start justify-between p-6 bg-primary-container border-2 border-transparent hover:border-primary rounded-xl text-left min-h-[160px] hover:brightness-105 transition-all cursor-pointer active:scale-[0.98]"
          >
            <div className="w-full flex justify-between items-start">
              <div className="w-[48px] h-[48px] bg-primary rounded-full flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-[24px] text-on-primary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  local_hospital
                </span>
              </div>
              <span className="material-symbols-outlined text-[24px] text-on-primary-container opacity-60 group-hover:opacity-100 transition-opacity">
                arrow_forward
              </span>
            </div>
            <div className="mt-4">
              <h3 className="font-headline-lg text-[26px] font-bold text-on-primary-container">
                Modern Allopathic Medicine
              </h3>
              <p className="font-body-lg text-[18px] text-primary-fixed-dim mt-1">
                General OPD, Specialists, and Surgery.
              </p>
            </div>
          </button>

          {/* AYUSH Card */}
          <button
            onClick={() => handleSelectDepartment('AYUSH / Ayurvedic OPD')}
            className="group flex flex-col items-start justify-between p-6 bg-secondary-container border-2 border-transparent hover:border-secondary rounded-xl text-left min-h-[160px] hover:brightness-95 transition-all cursor-pointer active:scale-[0.98]"
          >
            <div className="w-full flex justify-between items-start">
              <div className="w-[48px] h-[48px] bg-secondary rounded-full flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-[24px] text-on-secondary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  eco
                </span>
              </div>
              <div className="bg-secondary text-on-secondary px-4 py-1 rounded-full font-label-lg text-[14px] font-bold uppercase tracking-wider">
                Holistic
              </div>
            </div>
            <div className="mt-4">
              <h3 className="font-headline-lg text-[26px] font-bold text-on-secondary-container">
                AYUSH / Ayurvedic OPD
              </h3>
              <p className="font-body-lg text-[18px] text-on-secondary-fixed-variant mt-1">
                Traditional Indian medicine and holistic therapies.
              </p>
            </div>
          </button>
        </section>

        {/* Common Complaints Grid */}
        <section className="w-full mt-4">
          <h3 className="font-headline-md text-[24px] font-bold text-on-surface mb-4">
            Common Complaints / सामान्य शिकायतें
          </h3>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => handleStartInterview('Fever / बुखार')}
              className="h-[56px] px-8 bg-surface-container-high border-2 border-outline-variant rounded-full font-label-xl text-[20px] font-bold text-on-surface flex items-center gap-3 hover:bg-surface-variant hover:border-primary active:scale-[0.98] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[24px]">thermostat</span>
              Fever / बुखार
            </button>
            <button
              onClick={() => handleStartInterview('Chest Pain / सीने में दर्द')}
              className="h-[56px] px-8 bg-surface-container-high border-2 border-outline-variant rounded-full font-label-xl text-[20px] font-bold text-on-surface flex items-center gap-3 hover:bg-surface-variant hover:border-primary active:scale-[0.98] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[24px]">pulmonology</span>
              Chest Pain / सीने में दर्द
            </button>
            <button
              onClick={() => handleStartInterview('Cough / खांसी')}
              className="h-[56px] px-8 bg-surface-container-high border-2 border-outline-variant rounded-full font-label-xl text-[20px] font-bold text-on-surface flex items-center gap-3 hover:bg-surface-variant hover:border-primary active:scale-[0.98] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[24px]">sick</span>
              Cough / खांसी
            </button>
            <button
              onClick={() => handleStartInterview('Cold / जुकाम')}
              className="h-[56px] px-8 bg-surface-container-high border-2 border-outline-variant rounded-full font-label-xl text-[20px] font-bold text-on-surface flex items-center gap-3 hover:bg-surface-variant hover:border-primary active:scale-[0.98] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[24px]">ac_unit</span>
              Cold / जुकाम
            </button>
            <button
              onClick={() => handleStartInterview('')}
              className="h-[56px] px-8 bg-surface-container-lowest border-2 border-outline border-dashed rounded-full font-label-xl text-[20px] font-bold text-on-surface flex items-center gap-3 hover:bg-surface-container hover:border-solid active:scale-[0.98] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[24px]">add</span>
              Other / Speak
            </button>
          </div>
        </section>

        {/* Microphone Call to Action */}
        <section className="w-full mt-4">
          <button
            onClick={() => handleStartInterview('')}
            className="w-full bg-primary text-on-primary rounded-xl flex items-center justify-center p-6 border-4 border-transparent hover:brightness-110 active:scale-[0.99] transition-all group shadow-lg cursor-pointer"
          >
            <div className="flex items-center gap-6">
              <div className="w-[56px] h-[56px] bg-on-primary rounded-full flex items-center justify-center group-hover:animate-pulse">
                <span
                  className="material-symbols-outlined text-[32px] text-primary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  mic
                </span>
              </div>
              <div className="text-left">
                <span className="block font-headline-lg text-[26px] font-bold">
                  Tap or Speak your problem / बोलकर बताएं
                </span>
                <span className="block font-body-lg text-[18px] text-primary-fixed opacity-90">
                  Our AI assistant will guide you to the right department.
                </span>
              </div>
            </div>
          </button>
        </section>
      </div>

      <BottomNavBar />
    </>
  );
}
