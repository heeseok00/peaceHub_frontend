'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User, Room } from '@/types';
import { logout } from '@/lib/api/endpoints';
import { clearAllUserLocalData } from '@/lib/utils/userStorage';

/**
 * 사이드바 컴포넌트
 *
 * 메뉴, 사용자 정보, 방코드 복사 기능
 */

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  room: Room | null;
}

interface MenuItem {
  label: string;
  icon: string;
  path: string;
  badge?: string;
  disabled?: boolean;
}

export default function Sidebar({ isOpen, onClose, user, room }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // 메뉴 항목
  const menuItems: MenuItem[] = [
    {
      label: '대시보드',
      icon: '📊',
      path: '/dashboard',
    },
    {
      label: '업무 배정',
      icon: '📋',
      path: '/assign',
      badge: 'D-3일', // TODO: 실제 계산 필요
    },
    {
      label: '시간표 설정',
      icon: '📅',
      path: '/schedule',
    },
    {
      label: '배정 결과',
      icon: '📈',
      path: '/result',
    },
  ];

  /**
   * 방코드 복사
   */
  const handleCopyRoomCode = async () => {
    if (!room?.code) return;

    try {
      await navigator.clipboard.writeText(room.code);
      alert('방코드가 복사되었습니다!');
    } catch (error) {
      console.error('복사 실패:', error);
      alert('복사에 실패했습니다.');
    }
  };

  /**
   * 메뉴 클릭
   */
  const handleMenuClick = (path: string, disabled?: boolean) => {
    if (disabled) {
      alert('준비 중입니다');
      return;
    }

    router.push(path);
    onClose(); // 모바일에서 메뉴 클릭 시 닫힘
  };

  /**
   * 로그아웃
   */
  const handleLogout = async () => {
    if (isLoggingOut) return;

    const confirmed = confirm('정말 로그아웃 하시겠습니까?');
    if (!confirmed) return;

    try {
      setIsLoggingOut(true);
      
      // 로컬 스토리지 클리어
      clearAllUserLocalData();
      
      // 백엔드 로그아웃 & 리다이렉트
      await logout();
    } catch (error) {
      console.error('로그아웃 실패:', error);
      alert('로그아웃에 실패했습니다.');
      setIsLoggingOut(false);
    }
  };

  /**
   * ESC 키로 닫기
   */
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* 오버레이 (바깥 클릭 시 닫힘) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
          aria-label="사이드바 닫기"
        />
      )}

      {/* 사이드바 */}
      <div
        className={`fixed top-0 left-0 h-full bg-white shadow-lg z-50 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: '280px' }}
      >
        <div className="flex flex-col h-full">
          {/* 로고/제목 */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-primary-600 flex items-center gap-2">
              🏠 peaceHub
            </h1>
          </div>

          {/* 사용자 정보 */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="mb-3">
              <p className="text-sm text-gray-600 mb-2">👤 {user?.realName || '사용자'}님</p>
              {user?.room?.inviteCode && (
                <div className="bg-primary-50 border border-primary-200 rounded-lg px-3 py-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">초대 코드</span>
                      <span className="text-lg font-bold text-primary-700 font-mono tracking-wider">
                        {user.room.inviteCode}
                      </span>
                    </div>
                    <button
                      onClick={async () => {
                        if (user?.room?.inviteCode) {
                          try {
                            await navigator.clipboard.writeText(user.room.inviteCode);
                            alert('초대 코드가 복사되었습니다!');
                          } catch (error) {
                            console.error('복사 실패:', error);
                            alert('복사에 실패했습니다.');
                          }
                        }
                      }}
                      className="px-3 py-1.5 text-xs bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
                    >
                      복사
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 방코드 */}
            {room && (
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">방코드</span>
                  <button
                    onClick={handleCopyRoomCode}
                    className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    복사
                  </button>
                </div>
                <p className="text-lg font-bold text-gray-800">{room.code}</p>
              </div>
            )}
          </div>

          {/* 메뉴 목록 */}
          <nav className="flex-1 overflow-y-auto py-4">
            {menuItems.map((item) => {
              const isActive = pathname === item.path;

              return (
                <button
                  key={item.path}
                  onClick={() => handleMenuClick(item.path, item.disabled)}
                  className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                      : item.disabled
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  disabled={item.disabled}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="flex-1 font-medium">{item.label}</span>
                  {item.badge && !item.disabled && (
                    <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* 하단 - 로그아웃 */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoggingOut}
            >
              <span className="text-xl">🚪</span>
              <span className="font-medium">
                {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
