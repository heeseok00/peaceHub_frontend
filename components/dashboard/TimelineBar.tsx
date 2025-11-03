'use client';

import type { WeeklySchedule, Assignment, DayOfWeek } from '@/types';

/**
 * 오늘의 타임테이블 바 컴포넌트
 *
 * 24시간 타임라인을 가로 바 형태로 시각화
 * - 수면/바쁨/조용 시간 표시
 * - 집안일 시간 강조
 */

interface TimelineBarProps {
  date: Date;
  schedule: WeeklySchedule;
  assignments: Assignment[];
  userId: string;
}

// 시간대별 색상
const TIMELINE_COLORS = {
  sleep: 'bg-purple-400',
  busy: 'bg-red-400',
  quiet: 'bg-blue-400',
  task: 'bg-green-500',
  free: 'bg-gray-100',
};

export default function TimelineBar({
  date,
  schedule,
  assignments,
  userId,
}: TimelineBarProps) {
  // 날짜에서 요일 추출
  const dayOfWeek: DayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][
    date.getDay()
  ] as DayOfWeek;

  // 해당 날짜의 사용자 업무 확인
  const userAssignments = assignments.filter((a) => a.userId === userId);
  const hasTaskToday = userAssignments.some((a) => a.days.includes(dayOfWeek));

  // 24시간 블록 렌더링
  const renderTimeBlocks = () => {
    const blocks = [];
    const daySchedule = schedule[dayOfWeek];

    for (let hour = 0; hour < 24; hour++) {
      const slotType = daySchedule?.[hour];

      // 색상 결정: 업무 시간 > 스케줄 타입 > 비는 시간
      let colorClass = TIMELINE_COLORS.free;

      if (slotType === 'sleep') {
        colorClass = TIMELINE_COLORS.sleep;
      } else if (slotType === 'busy') {
        colorClass = TIMELINE_COLORS.busy;
      } else if (slotType === 'quiet') {
        colorClass = TIMELINE_COLORS.quiet;
      }

      // 업무 시간은 초록색으로 강조 (예: 저녁 시간대)
      // 실제로는 집안일 시간을 따로 정의해야 하지만, 여기서는 간단히 처리
      if (hasTaskToday && hour >= 18 && hour <= 20) {
        colorClass = TIMELINE_COLORS.task;
      }

      blocks.push(
        <div
          key={hour}
          className={`flex-1 h-8 ${colorClass} border-r border-white`}
          title={`${hour}시 - ${slotType || '비는 시간'}`}
        />
      );
    }

    return blocks;
  };

  // 시간 라벨 렌더링 (2시간 간격)
  const renderTimeLabels = () => {
    const labels = [];
    for (let hour = 0; hour < 24; hour += 2) {
      labels.push(
        <div key={hour} className="flex-[2] text-center text-xs text-gray-600">
          {hour}
        </div>
      );
    }
    return labels;
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-800">
          🕐 오늘의 타임테이블
        </h3>
        <p className="text-xs text-gray-500">
          {date.getMonth() + 1}월 {date.getDate()}일
        </p>
      </div>

      {/* 시간 라벨 */}
      <div className="flex mb-1">{renderTimeLabels()}</div>

      {/* 타임라인 바 */}
      <div className="flex rounded overflow-hidden border border-gray-300">
        {renderTimeBlocks()}
      </div>

      {/* 범례 */}
      <div className="mt-3 flex gap-4 flex-wrap text-xs">
        <div className="flex items-center gap-1">
          <div className={`w-4 h-4 ${TIMELINE_COLORS.sleep} rounded`}></div>
          <span className="text-gray-700">수면</span>
        </div>
        <div className="flex items-center gap-1">
          <div className={`w-4 h-4 ${TIMELINE_COLORS.busy} rounded`}></div>
          <span className="text-gray-700">바쁨</span>
        </div>
        <div className="flex items-center gap-1">
          <div className={`w-4 h-4 ${TIMELINE_COLORS.quiet} rounded`}></div>
          <span className="text-gray-700">조용</span>
        </div>
        <div className="flex items-center gap-1">
          <div className={`w-4 h-4 ${TIMELINE_COLORS.task} rounded`}></div>
          <span className="text-gray-700">업무</span>
        </div>
        <div className="flex items-center gap-1">
          <div className={`w-4 h-4 ${TIMELINE_COLORS.free} rounded border border-gray-300`}></div>
          <span className="text-gray-700">비는 시간</span>
        </div>
      </div>
    </div>
  );
}
