import React from 'react';

/**
 * 공통 입력 필드 컴포넌트
 *
 * label: 입력 필드 레이블
 * error: 에러 메시지
 * fullWidth: 가로 전체 너비 사용 여부
 */

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export default function Input({
  label,
  error,
  fullWidth = false,
  className = '',
  id,
  ...props
}: InputProps) {
  // 고유 ID 생성 (label과 input 연결용)
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  // 기본 스타일
  const baseStyles = 'px-4 py-2 border rounded-lg transition-colors duration-200';
  const normalStyles = 'border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none';
  const errorStyles = 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200 focus:outline-none';

  // 전체 너비 스타일
  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`${baseStyles} ${error ? errorStyles : normalStyles} ${widthStyle} ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
