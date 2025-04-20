import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import { RealtimeProvider } from '@/lib/contexts/RealtimeContext';
import { ToastProvider } from './components/ui/Toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Warehouse Picker Dashboard',
  description: 'Real-time monitoring of warehouse picker performance',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <RealtimeProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </RealtimeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
