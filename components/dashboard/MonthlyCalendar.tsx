'use client';

import type { Assignment, DayOfWeek } from '@/types';
import { TASK_EMOJIS } from '@/lib/constants/tasks';
import { getDayOfWeek, getWeekStart } from '@/lib/utils/dateHelpers';

/**
 * 월간 캘린더 컴포넌트
 *
 * 노션 스타일의 월 단위 캘린더
 * - 날짜 클릭으로 상세 보기
 * - 집안일 이모지 표시
 * - 월 네비게이션
 */

interface MonthlyCalendarProps {
  currentMonth: Date;
  selectedDate: Date;
  assignments: Assignment[];
  selectedUserId: string | null;
  onDateClick: (date: Date) => void;
  onMonthChange: (date: Date) => void;
}

export default function MonthlyCalendar({
  currentMonth,
  selectedDate,
  assignments,
  selectedUserId,
  onDateClick,
  onMonthChange,
}: MonthlyCalendarProps) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // 이전/다음 달로 이동
  const goToPrevMonth = () => {
    const prevMonth = new Date(year, month - 1, 1);
    onMonthChange(prevMonth);
  };

  const goToNextMonth = () => {
    const nextMonth = new Date(year, month + 1, 1);
    onMonthChange(nextMonth);
  };

  // 해당 날짜의 업무 가져오기
  const getTasksForDate = (date: Date): Assignment[] => {
    const weekStart = getWeekStart(date);
    const dayOfWeek = getDayOfWeek(date);

    let tasksForDay = assignments.filter(
      (a) => a.weekStart === weekStart && a.days.includes(dayOfWeek)
    );

    // 사용자 필터 적용
    if (selectedUserId) {
      tasksForDay = tasksForDay.filter((a) => a.userId === selectedUserId);
    }

    return tasksForDay;
  };

  // 캘린더 날짜 생성 (월요일 시작)
  const generateCalendarDays = () => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay(); // 0 = 일요일, 1 = 월요일, ...

    const days: (Date | null)[] = [];

    // 월요일 시작으로 조정: 일요일(0)은 6으로, 월요일(1)은 0으로
    const adjustedStartDay = startDay === 0 ? 6 : startDay - 1;

    // 이전 달 빈 칸
    for (let i = 0; i < adjustedStartDay; i++) {
      days.push(null);
    }

    // 현재 달 날짜
    for (let date = 1; date <= lastDay.getDate(); date++) {
      days.push(new Date(year, month, date));
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
      {/* 헤더: 월 네비게이션 */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={goToPrevMonth}
          className="px-2 py-1 text-sm rounded hover:bg-gray-100 text-gray-700 font-medium"
        >
          ◀
        </button>
        <h3 className="text-base font-bold text-gray-800">
          {year}년 {month + 1}월
        </h3>
        <button
          onClick={goToNextMonth}
          className="px-2 py-1 text-sm rounded hover:bg-gray-100 text-gray-700 font-medium"
        >
          ▶
        </button>
      </div>

      {/* 요일 헤더 (월요일 시작) */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['월', '화', '수', '목', '금', '토', '일'].map((day, index) => (
          <div
            key={day}
            className={`text-center text-xs font-semibold py-1 ${
              index === 5
                ? 'text-blue-600'
                : index === 6
                ? 'text-red-600'
                : 'text-gray-700'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="h-12 w-full" />;
          }

          const tasksForDay = getTasksForDate(date);
          const isToday = date.getTime() === today.getTime();
          const isSelected =
            date.getTime() ===
            new Date(
              selectedDate.getFullYear(),
              selectedDate.getMonth(),
              selectedDate.getDate()
            ).getTime();

          // 집안일 이모지 (최대 3개)
          const emojis = tasksForDay
            .slice(0, 3)
            .map((a) => TASK_EMOJIS[a.taskId] || '📋');

          return (
            <button
              key={date.toISOString()}
              onClick={() => onDateClick(date)}
              className={`h-12 w-full border rounded p-1 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors relative ${
                isSelected
                  ? 'border-2 border-primary-600 bg-primary-100 ring-2 ring-primary-300'
                  : isToday
                  ? 'border-2 border-primary-500 bg-primary-50'
                  : 'border-gray-200'
              }`}
            >
              {/* 날짜 숫자 */}
              <div
                className={`text-xs font-medium ${
                  isToday
                    ? 'text-primary-700 font-bold'
                    : date.getDay() === 0
                    ? 'text-red-600'
                    : date.getDay() === 6
                    ? 'text-blue-600'
                    : 'text-gray-700'
                }`}
              >
                {date.getDate()}
              </div>

              {/* 집안일 있음 표시 (간단한 점) */}
              {tasksForDay.length > 0 && (
                <div className="mt-0.5">
                  <span className="text-[8px] text-primary-600">●</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
