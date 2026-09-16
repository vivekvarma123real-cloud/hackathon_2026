'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { BottomNavBar } from '@/components/BottomNavBar';

export default function ConsentPage() {
  const router = useRouter();

  const handleAgree = () => {
    router.push('/intake');
  };

  const handleDecline = () => {
    router.push('/');
  };

  const handlePlayAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        'मरीज़ सहमति और डेटा गोपनीयता। हम आपके स्वास्थ्य डेटा को सुरक्षित रखने के लिए प्रतिबद्ध हैं।'
      );
      utterance.lang = 'hi-IN';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <>
      <div className="flex flex-col max-w-5xl mx-auto w-full gap-8">
        {/* Audio Guidance Banner */}
        <button
          onClick={handlePlayAudio}
          className="w-full bg-primary-container text-on-primary-container rounded-xl p-6 flex items-center justify-between border-2 border-primary-container hover:bg-primary hover:text-on-primary transition-colors duration-200 active:ring-4 active:ring-primary-fixed shadow-sm cursor-pointer"
        >
          <div className="flex items-center gap-6">
            <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              volume_up
            </span>
            <div className="text-left">
              <h2 className="font-headline-md text-[28px] font-bold">Listen to consent in your language</h2>
              <p className="font-label-xl text-[20px] opacity-90 mt-1">अपनी भाषा में सहमति सुनें</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-on-primary-container text-primary-container px-6 py-3 rounded-full font-label-lg text-[18px] font-bold">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              play_circle
            </span>
            Play Audio
          </div>
        </button>

        {/* Header */}
        <div className="text-center mt-2">
          <h1 className="font-display-lg text-[48px] leading-[56px] font-extrabold text-primary mb-3">
            Patient Consent & Data Privacy
          </h1>
          <p className="font-body-lg text-[22px] text-on-surface-variant max-w-3xl mx-auto">
            We are committed to protecting your health data. This system complies with DPDP and ABDM regulations to ensure your information is safe.
          </p>
        </div>

        {/* Bento Grid: Trust Badges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          {/* Badge 1: Data Privacy */}
          <div className="bg-surface-container-low border-2 border-outline-variant rounded-xl p-8 flex flex-col items-center text-center gap-4 transition-all hover:border-primary hover:shadow-md">
            <div className="w-20 h-20 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed mb-2">
              <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                lock
              </span>
            </div>
            <h3 className="font-headline-md text-[28px] font-bold text-on-surface">Data Privacy</h3>
            <p className="font-body-md text-[18px] text-on-surface-variant">Your records are encrypted and stored securely.</p>
          </div>

          {/* Badge 2: Safe Sharing */}
          <div className="bg-surface-container-low border-2 border-outline-variant rounded-xl p-8 flex flex-col items-center text-center gap-4 transition-all hover:border-primary hover:shadow-md">
            <div className="w-20 h-20 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed mb-2">
              <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                stethoscope
              </span>
            </div>
            <h3 className="font-headline-md text-[28px] font-bold text-on-surface">Safe Sharing</h3>
            <p className="font-body-md text-[18px] text-on-surface-variant">Only approved doctors can view your health history.</p>
          </div>

          {/* Badge 3: Auto Delete */}
          <div className="bg-surface-container-low border-2 border-outline-variant rounded-xl p-8 flex flex-col items-center text-center gap-4 transition-all hover:border-primary hover:shadow-md">
            <div className="w-20 h-20 rounded-full bg-error-container flex items-center justify-center text-on-error-container mb-2">
              <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                auto_delete
              </span>
            </div>
            <h3 className="font-headline-md text-[28px] font-bold text-on-surface">Auto Delete</h3>
            <p className="font-body-md text-[18px] text-on-surface-variant">Your current session data is cleared automatically upon exit.</p>
          </div>
        </div>

        {/* Primary Action Area */}
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-6 pb-6">
          <button
            onClick={handleDecline}
            className="h-[80px] min-w-[280px] bg-surface border-4 border-error text-error rounded-xl font-headline-md text-[24px] font-bold flex flex-col items-center justify-center active:scale-95 transition-all cursor-pointer hover:bg-error-container/20"
          >
            <span>Decline</span>
            <span className="font-label-lg text-[16px] opacity-80">अस्वीकार</span>
          </button>
          <button
            onClick={handleAgree}
            className="h-[80px] min-w-[320px] bg-secondary text-on-secondary rounded-xl font-headline-md text-[24px] font-bold flex flex-col items-center justify-center active:scale-95 transition-all active:ring-4 active:ring-secondary-fixed shadow-lg cursor-pointer hover:brightness-110"
          >
            <span>I Agree</span>
            <span className="font-label-lg text-[16px] opacity-90">स्वीकार है</span>
          </button>
        </div>
      </div>

      <BottomNavBar onNext={handleAgree} showNext={true} nextText="I Agree / स्वीकार है" />
    </>
  );
}
