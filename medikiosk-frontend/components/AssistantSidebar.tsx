'use client';

import React from 'react';
import { usePatientStore } from '@/store/usePatientStore';

export const AssistantSidebar: React.FC = () => {
  const { audioGuidance, toggleAudioGuidance } = usePatientStore();

  const handleListen = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance('कृपया अपनी भाषा चुनें। Please select your language.');
      utterance.lang = 'hi-IN';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <nav className="fixed right-margin-page top-[100px] flex flex-col gap-stack-md z-40 bg-surface-container rounded-xl p-4 border-2 border-primary w-[240px]">
      <div className="mb-4">
        <h2 className="font-headline-md text-[24px] text-primary font-bold">सहायक / Assistant</h2>
        <p className="font-label-lg text-[16px] text-on-surface-variant">
          {audioGuidance ? 'Audio Guidance On' : 'Audio Guidance Off'}
        </p>
      </div>

      <button
        onClick={handleListen}
        className="flex items-center gap-4 bg-secondary-container text-on-secondary-container rounded-lg p-4 w-full h-touch-target-min hover:bg-surface-container-highest transition-all active:scale-98 duration-150 border-2 border-transparent focus:border-primary"
      >
        <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          volume_up
        </span>
        <span className="font-label-xl text-[20px] font-bold">सुनिए / Listen</span>
      </button>

      <button
        onClick={toggleAudioGuidance}
        className={`flex items-center gap-4 p-4 w-full h-touch-target-min transition-all rounded-lg active:scale-98 duration-150 border-2 border-transparent focus:border-primary ${
          audioGuidance ? 'bg-primary/10 text-primary font-bold' : 'text-on-surface-variant hover:bg-surface-container-highest'
        }`}
      >
        <span className="material-symbols-outlined text-[28px]">graphic_eq</span>
        <span className="font-label-xl text-[20px] font-bold">आवाज़ / Voice</span>
      </button>
    </nav>
  );
};
