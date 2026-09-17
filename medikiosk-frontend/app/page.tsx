'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { usePatientStore } from '@/store/usePatientStore';
import { ShaderCanvas } from '@/components/ShaderCanvas';
import { BottomNavBar } from '@/components/BottomNavBar';
import { Language } from '@/types';

interface LanguageOption {
  code: Language;
  name: string;
  flag: string;
}

const languages: LanguageOption[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
];

export default function LanguageSelectionPage() {
  const router = useRouter();
  const setLanguage = usePatientStore((state) => state.setLanguage);

  const handleSelectLanguage = (langCode: Language) => {
    setLanguage(langCode);
    router.push('/login');
  };

  return (
    <>
      {/* Welcome Section */}
      <div className="text-center mb-stack-lg w-full max-w-4xl relative">
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none flex items-center justify-center h-32 -top-4">
          <ShaderCanvas type="wave" className="w-full h-full" />
        </div>
        <h1 className="font-headline-lg text-[56px] leading-[68px] font-extrabold text-primary mb-stack-md relative z-10 drop-shadow-sm">
          Welcome to MediKiosk<br />
          मेडिकियोस्क में आपका स्वागत है
        </h1>
        <p className="font-headline-md text-[32px] text-on-surface-variant flex items-center justify-center gap-2 relative z-10">
          <span className="material-symbols-outlined text-primary text-[40px] animate-pulse">mic</span>
          Tap a language or speak to begin
        </p>
      </div>

      {/* Language Grid */}
      <div className="grid grid-cols-2 gap-stack-md w-full max-w-4xl z-10">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleSelectLanguage(lang.code)}
            className="bg-surface-container-lowest border-2 border-outline-variant hover:border-primary focus:border-[4px] focus:border-primary rounded-xl p-6 h-[160px] flex items-center justify-between transition-all hover:bg-surface-container hover:shadow-md active:scale-[0.98] text-left cursor-pointer"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-surface-container-highest rounded-full flex items-center justify-center text-[32px]">
                {lang.flag}
              </div>
              <span className="font-headline-lg text-[40px] font-bold text-on-surface">
                {lang.name}
              </span>
            </div>
            <span className="material-symbols-outlined text-[48px] text-primary bg-primary-container/10 p-3 rounded-full">
              volume_up
            </span>
          </button>
        ))}
      </div>

      <BottomNavBar />
    </>
  );
}
