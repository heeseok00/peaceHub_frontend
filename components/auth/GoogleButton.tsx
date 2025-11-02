'use client';

import React from 'react';

/**
 * Google 로그인 버튼 컴포넌트
 *
 * onClick: 버튼 클릭 시 실행할 함수
 * 백엔드 연동 시: Google OAuth URL로 리다이렉트
 */

interface GoogleButtonProps {
  onClick?: () => void;
}

export default function GoogleButton({ onClick }: GoogleButtonProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // 백엔드 연동 시: window.location.href = '/api/auth/google'
      console.log('Google 로그인 클릭');
      // 프로토타입에서는 프로필 설정 페이지로 이동
      window.location.href = '/profile';
    }
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center justify-center gap-3 w-full px-6 py-3 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors duration-200 shadow-sm"
    >
      {/* Google 아이콘 SVG */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 01-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35z"
          fill="#4285F4"
        />
        <path
          d="M10 20c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H1.064v2.59A9.996 9.996 0 0010 20z"
          fill="#34A853"
        />
        <path
          d="M4.405 11.9c-.2-.6-.314-1.24-.314-1.9 0-.66.114-1.3.314-1.9V5.51H1.064A9.996 9.996 0 000 10c0 1.614.386 3.14 1.064 4.49l3.34-2.59z"
          fill="#FBBC05"
        />
        <path
          d="M10 3.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C14.959.99 12.695 0 10 0 6.09 0 2.71 2.24 1.064 5.51l3.34 2.59C5.19 5.736 7.395 3.977 10 3.977z"
          fill="#EA4335"
        />
      </svg>
      <span className="text-base font-medium text-gray-700">
        Google로 계속하기
      </span>
    </button>
  );
}
