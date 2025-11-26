'use client';

import type { Assignment, User, DayOfWeek } from '@/types';
import { getTaskEmoji } from '@/lib/utils/taskHelpers';
import { getDayOfWeek, getWeekStart } from '@/lib/utils/dateHelpers';

/**
 * 일별 업무 목록 컴포넌트
 *
 * 선택된 날짜의 업무를 카드 형태로 표시
 */

interface DailyTasksProps {
  date: Date;
  assignments: Assignment[];
  users: User[];
  selectedUserId: string | null; // null = 전체
}

export default function DailyTasks({
  date,
  assignments,
  users,
  selectedUserId,
}: DailyTasksProps) {
  const weekStart = getWeekStart(date);
  const dayOfWeek = getDayOfWeek(date);

  // 해당 주차의 배정 필터링
  const weekAssignments = assignments.filter((a) => a.weekStart === weekStart);

  // 해당 날짜에 배정된 업무 필터링
  const dailyAssignments = weekAssignments.filter((a) =>
    a.days.includes(dayOfWeek)
  );

  // 사용자 필터 적용
  const filteredAssignments = selectedUserId
    ? dailyAssignments.filter((a) => a.userId === selectedUserId)
    : dailyAssignments;

  // 사용자 찾기
  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user?.realName || '알 수 없음';
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-800">
          📋 선택된 날짜: {date.getFullYear()}년 {date.getMonth() + 1}월{' '}
          {date.getDate()}일
        </h3>
        {selectedUserId && (
          <p className="text-xs text-gray-500 mt-1">
            {getUserName(selectedUserId)}님의 업무만 표시
          </p>
        )}
      </div>

      {/* 업무 목록 */}
      {filteredAssignments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">이 날짜에는 배정된 업무가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAssignments.map((assignment) => {
            const emoji = getTaskEmoji(assignment.taskId);
            const userName = getUserName(assignment.userId);

            return (
              <div
                key={assignment.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{emoji}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">
                      {assignment.taskId}
                    </h4>
                    <p className="text-sm text-gray-600">담당자: {userName}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
