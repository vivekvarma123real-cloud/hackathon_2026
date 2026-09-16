'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePatientStore } from '@/store/usePatientStore';
import { BottomNavBar } from '@/components/BottomNavBar';

export default function LoginPage() {
  const router = useRouter();
  const { abhaId, setAbhaId } = usePatientStore();
  const [inputValue, setInputValue] = useState(abhaId || '');

  const handleKeyPress = (digit: string) => {
    if (inputValue.length < 14) {
      setInputValue((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    setInputValue((prev) => prev.slice(0, -1));
  };

  const handleConfirm = () => {
    if (inputValue.trim()) {
      setAbhaId(inputValue);
    }
    router.push('/consent');
  };

  return (
    <>
      <div className="w-full max-w-6xl flex flex-col gap-6">
        {/* Instruction Pill */}
        <div className="flex justify-center w-full mb-2">
          <div className="bg-secondary-container text-on-secondary-container px-8 py-4 rounded-full font-label-xl text-[22px] font-bold flex items-center gap-4 shadow-sm border-2 border-secondary/20">
            <span className="material-symbols-outlined text-[28px]">info</span>
            Scan your card or enter your number / अपना कार्ड स्कैन करें या नंबर दर्ज करें
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
          {/* Section 1: Scan ABHA Card */}
          <div className="bg-surface-container-lowest rounded-xl border-2 border-outline-variant p-6 flex flex-col gap-6 h-full relative overflow-hidden shadow-sm hover:border-primary transition-all">
            <div className="flex items-center gap-4 border-b-2 border-outline-variant pb-4">
              <span className="material-symbols-outlined text-[40px] text-primary">qr_code_scanner</span>
              <h2 className="font-headline-md text-[28px] font-bold text-primary">
                Scan ABHA Card / QR Code
              </h2>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center relative rounded-lg border-4 border-dashed border-outline-variant bg-surface-container-low p-6">
              <p className="font-body-lg text-[20px] text-on-surface-variant text-center mb-6 max-w-sm">
                Hold your ABHA Card or QR code steady in front of the scanner below.
              </p>
              {/* Visual Scanning Frame Mockup */}
              <div
                onClick={handleConfirm}
                className="w-64 h-64 border-4 border-primary rounded-xl relative flex items-center justify-center bg-white shadow-inner cursor-pointer group"
                title="Click to simulate QR code scan"
              >
                <div
                  className="absolute w-full h-1 bg-secondary animate-pulse opacity-80"
                  style={{ top: '50%', boxShadow: '0 0 10px #006a61' }}
                ></div>
                <span className="material-symbols-outlined text-outline-variant text-[120px] opacity-20 group-hover:scale-105 transition-transform">
                  badge
                </span>
                <div className="absolute top-[-4px] left-[-4px] w-8 h-8 border-t-8 border-l-8 border-primary rounded-tl-xl"></div>
                <div className="absolute top-[-4px] right-[-4px] w-8 h-8 border-t-8 border-r-8 border-primary rounded-tr-xl"></div>
                <div className="absolute bottom-[-4px] left-[-4px] w-8 h-8 border-b-8 border-l-8 border-primary rounded-bl-xl"></div>
                <div className="absolute bottom-[-4px] right-[-4px] w-8 h-8 border-b-8 border-r-8 border-primary rounded-br-xl"></div>
              </div>
            </div>
          </div>

          {/* Right Column: Numpad & New Registration */}
          <div className="flex flex-col gap-6">
            <div className="bg-surface-container-lowest rounded-xl border-2 border-outline-variant p-6 flex flex-col gap-4 shadow-sm">
              <div className="flex items-center gap-4 border-b-2 border-outline-variant pb-4">
                <span className="material-symbols-outlined text-[40px] text-primary">dialpad</span>
                <h2 className="font-headline-md text-[28px] font-bold text-primary">
                  Enter ABHA / Mobile Number
                </h2>
              </div>

              {/* Input Field */}
              <div className="relative w-full">
                <input
                  className="w-full h-[64px] border-2 border-outline-variant rounded-lg px-6 font-headline-md text-[28px] font-bold text-on-surface focus:border-4 focus:border-primary focus:outline-none transition-all bg-surface"
                  placeholder="14-digit ABHA or 10-digit Mobile"
                  readOnly
                  type="text"
                  value={inputValue}
                />
                <button
                  onClick={handleBackspace}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-error p-2 rounded-full hover:bg-error-container active:bg-error active:text-on-error transition-colors flex items-center justify-center cursor-pointer"
                  title="Backspace"
                >
                  <span className="material-symbols-outlined text-[32px]">backspace</span>
                </button>
              </div>

              {/* On-Screen Numpad */}
              <div className="grid grid-cols-3 gap-3">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    onClick={() => handleKeyPress(digit)}
                    className="bg-surface-container hover:bg-surface-container-high active:bg-primary-container active:text-on-primary-container active:scale-95 transition-all rounded-lg h-[70px] font-headline-lg text-[32px] font-bold text-primary flex items-center justify-center border-2 border-transparent shadow-sm touch-none cursor-pointer"
                  >
                    {digit}
                  </button>
                ))}
                <div />
                <button
                  onClick={() => handleKeyPress('0')}
                  className="bg-surface-container hover:bg-surface-container-high active:bg-primary-container active:text-on-primary-container active:scale-95 transition-all rounded-lg h-[70px] font-headline-lg text-[32px] font-bold text-primary flex items-center justify-center border-2 border-transparent shadow-sm touch-none cursor-pointer"
                >
                  0
                </button>
                <button
                  onClick={handleConfirm}
                  className="bg-secondary hover:bg-secondary-container active:bg-secondary active:text-on-secondary active:scale-95 transition-all rounded-lg h-[70px] text-on-secondary flex items-center justify-center border-2 border-transparent shadow-sm touch-none cursor-pointer"
                  title="Confirm"
                >
                  <span className="material-symbols-outlined text-[40px]">check_circle</span>
                </button>
              </div>
            </div>

            {/* New Registration Button */}
            <button
              onClick={handleConfirm}
              className="w-full bg-primary-container text-on-primary-container h-[80px] rounded-xl flex items-center justify-center gap-4 font-headline-md text-[24px] font-bold border-2 border-outline-variant shadow-sm active:scale-95 hover:brightness-110 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[36px]">person_add</span>
              New Registration / नया पंजीकरण
            </button>
          </div>
        </div>
      </div>

      <BottomNavBar onNext={handleConfirm} showNext={true} />
    </>
  );
}
