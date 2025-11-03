'use client';

import type { Assignment, DayOfWeek } from '@/types';
import { TASKS } from '@/types';

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

// 집안일 이모지 매핑
const TASK_EMOJIS: Record<string, string> = {
  bathroom: '🚽',
  trash: '🗑️',
  room: '🧹',
  laundry: '👔',
  dishes: '🍽️',
};

// 날짜에서 주의 시작일(월요일) 계산
function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

// 날짜에서 요일 추출
function getDayOfWeek(date: Date): DayOfWeek {
  const days: DayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return days[date.getDay()];
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

  // 캘린더 날짜 생성
  const generateCalendarDays = () => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay(); // 0 = 일요일

    const days: (Date | null)[] = [];

    // 이전 달 빈 칸
    for (let i = 0; i < startDay; i++) {
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
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      {/* 헤더: 월 네비게이션 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPrevMonth}
          className="px-3 py-1 rounded hover:bg-gray-100 text-gray-700 font-medium"
        >
          ◀ 이전달
        </button>
        <h3 className="text-lg font-bold text-gray-800">
          {year}년 {month + 1}월
        </h3>
        <button
          onClick={goToNextMonth}
          className="px-3 py-1 rounded hover:bg-gray-100 text-gray-700 font-medium"
        >
          다음달 ▶
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
          <div
            key={day}
            className={`text-center text-sm font-semibold py-2 ${
              index === 0
                ? 'text-red-600'
                : index === 6
                ? 'text-blue-600'
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
            return <div key={`empty-${index}`} className="aspect-square" />;
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
              className={`aspect-square border rounded-lg p-1 flex flex-col items-center justify-start hover:bg-gray-50 transition-colors ${
                isToday
                  ? 'border-primary-500 bg-primary-50'
                  : isSelected
                  ? 'border-primary-400 bg-primary-100'
                  : 'border-gray-200'
              }`}
            >
              {/* 날짜 숫자 */}
              <div
                className={`text-sm font-medium ${
                  isToday
                    ? 'text-primary-700'
                    : date.getDay() === 0
                    ? 'text-red-600'
                    : date.getDay() === 6
                    ? 'text-blue-600'
                    : 'text-gray-700'
                }`}
              >
                {date.getDate()}
              </div>

              {/* 집안일 이모지 */}
              {emojis.length > 0 && (
                <div className="flex gap-0.5 mt-1">
                  {emojis.map((emoji, i) => (
                    <span key={i} className="text-xs">
                      {emoji}
                    </span>
                  ))}
                </div>
              )}

              {/* 집안일 있음 표시 */}
              {tasksForDay.length > 0 && (
                <div className="mt-auto">
                  <span className="text-xs text-primary-600">●</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
