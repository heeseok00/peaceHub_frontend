'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import type { User, Room } from '@/types';
import { getCurrentUser, getMyRoom } from '@/lib/api/endpoints';

/**
 * Main Layout
 *
 * 헤더 + 사이드바 + 메인 콘텐츠
 */

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [room, setRoom] = useState<Room | null>(null);

  /**
   * 초기 데이터 로드
   */
  useEffect(() => {
    const loadData = async () => {
      try {
        const [userData, roomData] = await Promise.all([
          getCurrentUser(),
          getMyRoom(),
        ]);

        setUser(userData);
        setRoom(roomData);
      } catch (error) {
        // 에러 무시 (사용자 정보 로드 실패)
      }
    };

    loadData();
  }, []);

  return (
    <div className="min-h-screen">
      {/* 헤더 */}
      <Header onMenuClick={() => setIsSidebarOpen(true)} />

      {/* 사이드바 */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        user={user}
        room={room}
      />

      {/* 메인 콘텐츠 */}
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
}
