import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth/auth-context';
import { Navbar } from '@/components/navbar';
import { DemoBanner } from '@/components/demo-banner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NGO Internship Portal | Week 1 Foundation',
  description: 'Internship management portal connecting passionate students with meaningful NGO projects.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-full flex flex-col bg-slate-50/40 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100`}>
        <AuthProvider>
          <DemoBanner />
          <Navbar />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
