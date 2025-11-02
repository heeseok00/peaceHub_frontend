import React from 'react';

/**
 * 공통 카드 컴포넌트
 *
 * 콘텐츠를 감싸는 박스 형태의 컨테이너
 * padding: 내부 여백 크기
 * shadow: 그림자 효과 여부
 */

interface CardProps {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: boolean;
  className?: string;
}

export default function Card({
  children,
  padding = 'md',
  shadow = true,
  className = '',
}: CardProps) {
  // 기본 스타일
  const baseStyles = 'bg-white rounded-lg border border-gray-200';

  // 패딩 스타일
  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  // 그림자 스타일
  const shadowStyle = shadow ? 'shadow-md' : '';

  return (
    <div className={`${baseStyles} ${paddingStyles[padding]} ${shadowStyle} ${className}`}>
      {children}
    </div>
  );
}
