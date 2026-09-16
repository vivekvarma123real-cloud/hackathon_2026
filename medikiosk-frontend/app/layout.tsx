import type { Metadata } from 'next';
import './globals.css';
import { TopAppBar } from '@/components/TopAppBar';
import { AssistantSidebar } from '@/components/AssistantSidebar';

export const metadata: Metadata = {
  title: 'MediKiosk - National Hospital OPD',
  description: 'Self-Service Medical Kiosk & Voice Intake System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-on-background min-h-screen flex flex-col pt-[80px] pb-[100px]">
        <TopAppBar />
        <AssistantSidebar />
        <div className="flex-grow flex flex-col items-center justify-center px-margin-page py-stack-lg pr-[300px]">
          {children}
        </div>
      </body>
    </html>
  );
}
