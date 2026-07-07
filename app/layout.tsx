import type { Metadata, Viewport } from 'next';
import './globals.css';
import { BottomNav } from '@/components/BottomNav';

export const metadata: Metadata = {
  title: '绘本伴读 | Book Memory',
  description: '让每一本绘本，都成为成长的一段回忆',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '绘本伴读'
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#faf8f5'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-[#faf8f5] text-[#3a332e] antialiased select-none pb-20 font-sans">
        <main className="max-w-md mx-auto min-h-screen bg-[#faf8f5] shadow-sm relative overflow-x-hidden flex flex-col">
          {children}
          <BottomNav />
        </main>
      </body>
    </html>
  );
}