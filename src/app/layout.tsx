import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/navigation/Navbar';
import { LabLendProvider } from '@/lib/store';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'LabLend | Trust-First Campus Equipment & Space Sharing',
  description:
    'Institutional resource sharing platform for university labs, makerspaces, cameras, testing devices, and research suites with automated eligibility, fair-share waitlists, and condition reporting.',
};

import { ChatbotWidget } from '@/components/ai/ChatbotWidget';
import { Suspense } from 'react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <LabLendProvider>
          <Suspense fallback={<div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200" />}>
            <Navbar />
          </Suspense>
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
            <Suspense fallback={<div className="py-12 text-center text-xs text-slate-400">Loading campus resources...</div>}>
              {children}
            </Suspense>
          </main>
          <ChatbotWidget />
          <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-xs text-slate-500 text-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p>
                © 2026 LabLend. Campus Equipment & Space Governance Protocol.
              </p>
              <div className="flex items-center gap-4">
                <span>Fair-Use Governed</span>
                <span>•</span>
                <span>Append-Only Audit</span>
                <span>•</span>
                <span>Zero Phantom Holds</span>
              </div>
            </div>
          </footer>
        </LabLendProvider>
      </body>
    </html>
  );
}
