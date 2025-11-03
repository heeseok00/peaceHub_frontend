'use client';

import type { User } from '@/types';

/**
 * 사용자 필터 버튼 컴포넌트
 *
 * 룸메이트별로 업무를 필터링할 수 있는 버튼 그룹
 */

interface FilterButtonsProps {
  users: User[];
  selectedUserId: string | null; // null = 전체
  onFilterChange: (userId: string | null) => void;
}

export default function FilterButtons({
  users,
  selectedUserId,
  onFilterChange,
}: FilterButtonsProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <p className="text-sm font-medium text-gray-700 mb-3">👤 필터</p>
      <div className="flex gap-2 flex-wrap">
        {/* 전체 버튼 */}
        <button
          onClick={() => onFilterChange(null)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedUserId === null
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          전체
        </button>

        {/* 개인별 버튼 */}
        {users.map((user) => (
          <button
            key={user.id}
            onClick={() => onFilterChange(user.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedUserId === user.id
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {user.realName}
          </button>
        ))}
      </div>
    </div>
  );
}
