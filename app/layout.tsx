import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { QueryProvider } from '@/lib/query-client';
import { AuthHydration } from '@/components/auth-hydration';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Customer Support',
  description: 'AI-assisted customer support inbox',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body>
        <QueryProvider>
          <AuthHydration />
          {children}
          <Toaster richColors position="top-right" />
        </QueryProvider>
      </body>
    </html>
  );
}
