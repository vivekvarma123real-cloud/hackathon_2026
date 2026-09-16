'use client';

import React from 'react';
import Link from 'next/link';

export const TopAppBar: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-surface-container-lowest border-b-2 border-outline-variant flex justify-between items-center px-margin-page h-[80px]">
      <Link href="/" className="font-headline-md text-[32px] font-bold text-primary">
        National Hospital OPD
      </Link>
      <div className="flex items-center gap-gutter text-primary">
        <button
          className="h-touch-target-min w-touch-target-min flex items-center justify-center hover:bg-surface-container-high transition-colors rounded-full active:scale-95 duration-100 touch-none"
          title="Emergency / Home"
        >
          <span className="material-symbols-outlined text-[32px]">emergency_home</span>
        </button>
        <button
          className="h-touch-target-min w-touch-target-min flex items-center justify-center hover:bg-surface-container-high transition-colors rounded-full active:scale-95 duration-100 touch-none"
          title="Wallet"
        >
          <span className="material-symbols-outlined text-[32px]">account_balance_wallet</span>
        </button>
      </div>
    </header>
  );
};
