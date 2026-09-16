'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePatientStore } from '@/store/usePatientStore';
import { BottomNavBar } from '@/components/BottomNavBar';
import { speakText } from '@/services/speech';

export default function DocumentsPage() {
  const router = useRouter();
  const { scannedDocuments, addScannedDocument, reset } = usePatientStore();
  const [activeCategory, setActiveCategory] = useState<'Prescription' | 'Lab Report' | 'Discharge Summary'>('Prescription');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleCapture = () => {
    const newDoc = {
      id: `doc-${Date.now()}`,
      category: activeCategory,
      dataUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCwP4K_wgmWVv6sYg4aQ2HM4HExio-K6uAUhDH1p8BgPHcBXEnUn9VkfcShX2d3sfDSIc3fFZH8zxhyNXT66TxN8IyedcnAjU_dgNt_rN_0DWFKszKIw6ne1OVVFnhk_-p_toqdjXU5tK5f4fD5-SfnVLGuk9bD2qP02qewVK5IiLhvLBMQppIEGmsdYCqE4RuY7qBIqKo6Yg7a5xXaGS5lRqRvd9bFEi4-Y8PqTjcjLXa31BMvZ_9tmw'
    };
    addScannedDocument(newDoc);
    speakText(`${activeCategory} captured successfully.`);
  };

  const handleProcessDocuments = () => {
    setShowSuccessModal(true);
    speakText('Your registration and document scan are complete. OPD Token printed.');
  };

  const handleFinish = () => {
    reset();
    router.push('/');
  };

  return (
    <>
      <div className="w-full max-w-6xl flex flex-col md:flex-row gap-8 mt-2">
        {/* Left Sidebar / Category Tabs */}
        <aside className="w-full md:w-1/3 lg:w-1/4 flex flex-col gap-4">
          <div className="font-headline-lg text-[28px] font-bold text-primary mb-2">
            Document Scanning / दस्तावेज स्कैन
          </div>
          <nav className="flex flex-col gap-3">
            {[
              { id: 'Prescription', label: 'Scan Prescription', icon: 'prescriptions' },
              { id: 'Lab Report', label: 'Lab Test Report', icon: 'biotech' },
              { id: 'Discharge Summary', label: 'Discharge Summary', icon: 'description' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id as any)}
                className={`h-[64px] rounded-xl flex items-center px-6 gap-4 border-2 transition-all cursor-pointer ${
                  activeCategory === tab.id
                    ? 'bg-primary-container text-on-primary-container border-primary font-bold shadow-sm'
                    : 'bg-surface text-on-surface border-outline-variant hover:border-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[28px]">{tab.icon}</span>
                <span className="font-label-xl text-[18px] flex-grow text-left">{tab.label}</span>
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Right Content Area: Camera Viewport & Thumbnails */}
        <section className="w-full md:w-2/3 lg:w-3/4 flex flex-col gap-6">
          {/* Camera Viewport */}
          <div className="relative w-full h-[440px] bg-black rounded-2xl overflow-hidden border-4 border-primary shadow-lg flex items-center justify-center">
            <img
              className="absolute inset-0 w-full h-full object-cover opacity-60"
              alt="Prescription scanning viewport preview"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAItIjBs8dCFcbbcqUeEYZXV5ay42BcY8L6isc_wFNBFbA5IwinR3GpATESSyY9q5lFAVP6VGk1QChK6RtZW7SC7v0VCYf3824gORQdvvrr4XerussAvCfaoYNE5tQBw_YDp4kdHbmsP04QGDZL5L2K1LmL_7Oey6guIknQm0dw7GPSuBgoznpiuikvnrnkdwxgfKvsJUSp02TqkKvZ-SkZNlbNpvIy1lNFhvQX3S19QZGA01-grUbimA"
            />
            {/* Alignment Guides */}
            <div className="absolute inset-4 border-2 border-dashed border-secondary-fixed rounded-lg pointer-events-none"></div>
            <div className="absolute top-6 left-6 w-12 h-12 border-t-4 border-l-4 border-secondary pointer-events-none"></div>
            <div className="absolute top-6 right-6 w-12 h-12 border-t-4 border-r-4 border-secondary pointer-events-none"></div>
            <div className="absolute bottom-6 left-6 w-12 h-12 border-b-4 border-l-4 border-secondary pointer-events-none"></div>
            <div className="absolute bottom-6 right-6 w-12 h-12 border-b-4 border-r-4 border-secondary pointer-events-none"></div>

            {/* Instruction Overlay */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-surface/90 text-on-surface px-6 py-3 rounded-full font-label-xl text-[18px] font-bold border-2 border-outline text-center shadow-md">
              Align {activeCategory} within frame / दस्तावेज को फ्रेम में रखें
            </div>

            {/* Capture Button */}
            <button
              onClick={handleCapture}
              className="absolute -bottom-6 left-1/2 -translate-x-1/2 h-20 w-20 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary-container hover:text-on-primary-container transition-all border-4 border-surface z-10 cursor-pointer active:scale-90"
              title="Capture Document"
            >
              <span className="material-symbols-outlined text-[36px]">camera</span>
            </button>
          </div>

          {/* Scanned Thumbnails Carousel */}
          <div className="w-full bg-surface-container-low p-4 rounded-2xl border-2 border-outline-variant flex gap-4 overflow-x-auto items-center min-h-[140px] mt-4">
            {scannedDocuments.map((doc, idx) => (
              <div
                key={doc.id}
                className="relative min-w-[100px] h-[110px] rounded-lg border-2 border-outline overflow-hidden shrink-0 group"
              >
                <img className="w-full h-full object-cover" alt={`Scanned page ${idx + 1}`} src={doc.dataUrl} />
                <div className="absolute bottom-0 w-full bg-surface/80 text-on-surface text-center font-label-lg text-[14px] font-bold py-1 border-t border-outline">
                  Page {idx + 1}
                </div>
              </div>
            ))}

            <button
              onClick={handleCapture}
              className="min-w-[100px] h-[110px] rounded-lg border-4 border-dashed border-primary flex flex-col items-center justify-center text-primary hover:bg-primary-container transition-colors cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-[32px] mb-1">add_circle</span>
              <span className="font-label-lg text-[14px] font-bold">Add Page</span>
            </button>
          </div>

          {/* Process Action */}
          <div className="flex justify-end w-full">
            <button
              onClick={handleProcessDocuments}
              className="h-[64px] bg-secondary text-on-secondary px-10 rounded-xl font-label-xl text-[20px] font-bold flex items-center gap-3 hover:brightness-110 transition-colors shadow-md cursor-pointer active:scale-95"
            >
              Process Documents & Print / प्रक्रिया पूर्ण करें
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </section>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6">
          <div className="bg-surface rounded-2xl p-8 max-w-md w-full text-center flex flex-col items-center gap-6 border-4 border-primary shadow-2xl">
            <div className="w-20 h-20 bg-secondary-container text-on-secondary-container rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
            </div>
            <div>
              <h2 className="text-[28px] font-bold text-primary mb-2">Token Printed Successfully!</h2>
              <p className="text-[18px] text-on-surface-variant">
                OPD Token #<strong>OPD-204</strong> has been generated. Please proceed to General OPD Counter 3.
              </p>
            </div>
            <button
              onClick={handleFinish}
              className="w-full h-[60px] bg-primary text-on-primary rounded-xl font-headline-md text-[20px] font-bold hover:brightness-110 transition-all cursor-pointer"
            >
              Done / समाप्ति
            </button>
          </div>
        </div>
      )}

      <BottomNavBar onNext={handleProcessDocuments} showNext={true} nextText="Process / पूर्ण करें" />
    </>
  );
}
