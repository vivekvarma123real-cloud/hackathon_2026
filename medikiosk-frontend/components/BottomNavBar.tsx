'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { usePatientStore } from '@/store/usePatientStore';

interface BottomNavBarProps {
  onNext?: () => void;
  nextText?: string;
  showNext?: boolean;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  onNext,
  nextText = 'आगे बढ़ें / Next',
  showNext = false,
}) => {
  const router = useRouter();
  const resetStore = usePatientStore((state) => state.reset);

  const handleBack = () => {
    router.back();
  };

  const handleCancel = () => {
    resetStore();
    router.push('/');
  };

  const handleHelp = () => {
    alert('सहायता / Assistance requested. Hospital staff notified.');
  };

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-between items-stretch h-[100px] px-margin-page bg-primary border-t-4 border-secondary">
      <button
        onClick={handleBack}
        className="text-on-primary h-touch-target-min flex flex-col items-center justify-center min-w-[120px] hover:bg-primary-container hover:text-on-primary-container transition-all active:ring-4 active:ring-secondary-fixed duration-75 h-full px-6"
      >
        <span className="material-symbols-outlined text-[32px] mb-1">arrow_back</span>
        <span className="font-label-xl text-[20px] font-bold">वापस / Back</span>
      </button>

      <div className="flex items-center gap-4">
        <button
          onClick={handleHelp}
          className="text-on-primary h-touch-target-min flex flex-col items-center justify-center min-w-[120px] hover:bg-primary-container hover:text-on-primary-container transition-all active:ring-4 active:ring-secondary-fixed duration-75 h-full px-6"
        >
          <span className="material-symbols-outlined text-[32px] mb-1">call</span>
          <span className="font-label-xl text-[20px] font-bold">सहायता / Help</span>
        </button>

        {showNext && onNext && (
          <button
            onClick={onNext}
            className="bg-secondary text-on-secondary h-touch-target-min flex items-center justify-center px-8 rounded-xl font-headline-md text-[24px] font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all"
          >
            {nextText}
            <span className="material-symbols-outlined text-[32px] ml-2">arrow_forward</span>
          </button>
        )}
      </div>

      <button
        onClick={handleCancel}
        className="text-on-primary h-touch-target-min flex flex-col items-center justify-center min-w-[120px] hover:bg-primary-container hover:text-on-primary-container transition-all active:ring-4 active:ring-secondary-fixed duration-75 h-full px-6"
      >
        <span className="material-symbols-outlined text-[32px] mb-1">close</span>
        <span className="font-label-xl text-[20px] font-bold">रद्द करें / Cancel</span>
      </button>
    </nav>
  );
};
