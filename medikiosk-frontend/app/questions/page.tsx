'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePatientStore } from '@/store/usePatientStore';
import { BottomNavBar } from '@/components/BottomNavBar';
import { speakText, getTTSLang } from '@/services/speech';

export default function QuestionsPage() {
  const router = useRouter();
  const { symptomDuration, painScale, setSymptomDuration, setPainScale, language, interviewComplete } = usePatientStore();

  // If interview is complete, auto-redirect to summary
  useEffect(() => {
    if (interviewComplete) {
      router.push('/summary');
    }
  }, [interviewComplete, router]);

  const handleNext = () => {
    router.push('/summary');
  };

  return (
    <>
      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-8 mt-2">
        {/* Left Panel: Body Map */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <div className="bg-surface-container-lowest border-2 border-outline-variant rounded-xl p-6 flex flex-col h-full shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-headline-lg text-[24px] font-bold text-on-surface">Area of Concern</h2>
              <button
                onClick={() => speakText(
                  language === 'hi' ? 'चिंता का क्षेत्र। छाती और ऊपरी धड़ को हाइलाइट किया गया है।' : 'Area of Concern. Chest and upper torso highlighted.',
                  getTTSLang(language)
                )}
                className="h-[50px] px-4 rounded-lg bg-primary text-on-primary flex items-center justify-center gap-2 border-2 border-transparent hover:bg-primary-container transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined">volume_up</span>
                <span className="font-label-lg text-[16px] font-bold">सुनिए</span>
              </button>
            </div>

            {/* High-fidelity 2D Body Map */}
            <div className="relative flex-grow rounded-lg border-2 border-surface-variant overflow-hidden bg-surface-container-low min-h-[400px] flex items-center justify-center">
              <img
                className="object-contain w-full h-full max-h-[500px] p-4"
                alt="2D medical illustration of a human body with chest highlighted"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAzd90R1YU-bJYY_XyUvLji42TUfl8-BrHNj-3yce5CooVwzIEG4oCcQc4HjMeQ2aO3dkAc92LJg99NefwGWRrs8yomWUtvA7BIfxK9REHUPeHGKe9FOPMbRwtHNA3CVrBWLE8nYDrpgpQEjymABvnAd0_d8hA8GIY4gzcd33e6RSd_T2vWfnRaC4Z91DCg3H4zK4nv4SkQC3lAXTEMxkQR2uzIOPcllK69XY_rgJc83FO8CrFWjaIMHA"
              />
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
                <div className="text-center font-label-xl text-[18px] font-semibold text-outline">Head</div>
                <div className="text-center font-headline-md text-[20px] text-primary font-extrabold bg-primary-container/30 px-6 py-2 rounded-full inline-block self-center border-2 border-primary">
                  Chest / छाती
                </div>
                <div className="text-center font-label-xl text-[18px] font-semibold text-outline">Abdomen</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Structured Question Cards */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          {/* Question 1 Card: Duration */}
          <div className="bg-surface-container-lowest border-2 border-outline-variant rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4 gap-4">
              <h2 className="font-headline-lg text-[28px] font-bold text-on-surface">
                How long has it been hurting? / दर्द कितने समय से है?
              </h2>
              <button
                onClick={() => speakText(
                  language === 'hi' ? 'दर्द कितने समय से है? अवधि चुनें।' : 'How long has it been hurting? Select duration.',
                  getTTSLang(language)
                )}
                className="h-[50px] px-4 rounded-lg bg-primary text-on-primary flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <span className="material-symbols-outlined">volume_up</span>
                <span className="font-label-lg text-[16px] font-bold">सुनिए</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['< 1 Day', '2-3 Days', '1+ Week'].map((dur) => (
                <button
                  key={dur}
                  onClick={() => setSymptomDuration(dur)}
                  className={`h-[70px] rounded-lg border-2 font-label-xl text-[20px] font-bold transition-all flex items-center justify-center relative cursor-pointer ${
                    symptomDuration === dur
                      ? 'border-4 border-primary bg-primary-container text-on-primary-container shadow-inner'
                      : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {dur}
                  {symptomDuration === dur && (
                    <span className="material-symbols-outlined absolute top-2 right-2 text-primary text-[24px]">
                      check_circle
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Question 2 Card: Pain Scale */}
          <div className="bg-surface-container-lowest border-2 border-outline-variant rounded-xl p-6 shadow-sm flex-grow">
            <div className="flex justify-between items-start mb-4 gap-4">
              <h2 className="font-headline-lg text-[28px] font-bold text-on-surface">
                How bad is the pain? / दर्द कितना तेज़ है?
              </h2>
              <button
                onClick={() => speakText(
                  language === 'hi' ? 'दर्द कितना तेज़ है? एक से दस तक रेट करें।' : 'How bad is the pain? Rate from 1 to 10.',
                  getTTSLang(language)
                )}
                className="h-[50px] px-4 rounded-lg bg-primary text-on-primary flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <span className="material-symbols-outlined">volume_up</span>
                <span className="font-label-lg text-[16px] font-bold">सुनिए</span>
              </button>
            </div>

            <div className="flex flex-col gap-4 w-full">
              <div className="flex justify-between px-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  sentiment_very_satisfied
                </span>
                <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  sentiment_neutral
                </span>
                <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  sentiment_very_dissatisfied
                </span>
              </div>

              <div className="grid grid-cols-5 lg:grid-cols-10 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
                  <button
                    key={val}
                    onClick={() => setPainScale(val)}
                    className={`h-[60px] rounded-lg border-2 font-label-xl text-[20px] font-bold transition-all flex items-center justify-center cursor-pointer ${
                      painScale === val
                        ? 'border-4 border-primary bg-primary-container text-on-primary-container shadow-inner'
                        : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>

              <div className="flex justify-between px-2 mt-1 font-label-lg text-[16px] font-bold text-on-surface-variant">
                <span>1 - Mild / कम</span>
                <span>5 - Moderate / मध्यम</span>
                <span>10 - Severe / बहुत तेज़</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNavBar onNext={handleNext} showNext={true} nextText="Summary / सारांश" />
    </>
  );
}
