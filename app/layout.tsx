import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'peaceHub - 룸메이트 업무 분배 시스템',
  description: '기숙사/하숙집 룸메이트를 위한 공정한 업무 자동 배정 서비스',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
