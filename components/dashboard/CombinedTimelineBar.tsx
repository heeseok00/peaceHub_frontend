'use client';

import { useState } from 'react';
import type { WeeklySchedule, Assignment, DayOfWeek, User, TimeSlot } from '@/types';

/**
 * 통합 타임라인 바 컴포넌트
 *
 * 모든 멤버의 스케줄을 겹쳐서 표시
 * - 겹침 수에 따라 채도 조절
 * - 호버 시 상세 정보 표시
 */

interface CombinedTimelineBarProps {
  date: Date;
  allSchedules: Map<string, WeeklySchedule>;
  assignments: Assignment[];
  users: User[];
}

// 겹침 정보
interface OverlapInfo {
  quiet: string[]; // 조용시간 사용자 IDs
  task: string[]; // 업무 사용자 IDs
}

// 채도별 색상 매핑
const getColorByOverlap = (type: 'quiet' | 'task', count: number): string => {
  if (type === 'quiet') {
    if (count === 0) return 'bg-gray-100';
    if (count === 1) return 'bg-gray-300';
    if (count === 2) return 'bg-gray-400';
    if (count === 3) return 'bg-gray-500';
    return 'bg-gray-600'; // 4명 이상
  }
  if (type === 'task') {
    // 업무는 항상 밝은 초록색으로 구분
    return 'bg-green-500';
  }
  return 'bg-gray-100';
};

export default function CombinedTimelineBar({
  date,
  allSchedules,
  assignments,
  users,
}: CombinedTimelineBarProps) {
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // 날짜에서 요일 추출
  const dayOfWeek: DayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][
    date.getDay()
  ] as DayOfWeek;

  // 해당 날짜의 업무 배정 가져오기
  const getAssignmentsForDate = (): Map<string, string[]> => {
    const result = new Map<string, string[]>();

    // 주의 시작일 계산
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    const weekStart = d.toISOString().split('T')[0];

    assignments
      .filter(a => a.weekStart === weekStart && a.days.includes(dayOfWeek))
      .forEach(a => {
        if (!result.has(a.userId)) {
          result.set(a.userId, []);
        }
        result.get(a.userId)!.push(a.taskId);
      });

    return result;
  };

  const assignmentsByUser = getAssignmentsForDate();

  // 시간별 겹침 계산
  const calculateOverlaps = (): OverlapInfo[] => {
    const overlaps: OverlapInfo[] = [];

    for (let hour = 0; hour < 24; hour++) {
      const info: OverlapInfo = {
        quiet: [],
        task: [],
      };

      // 각 사용자의 해당 시간 상태 확인
      users.forEach(user => {
        const schedule = allSchedules.get(user.id);
        if (!schedule) return;

        const daySchedule = schedule[dayOfWeek];
        const slotType = daySchedule?.[hour];

        // 업무 시간이 있으면 우선
        const hasTask = assignmentsByUser.get(user.id);
        if (hasTask && hasTask.length > 0) {
          // 업무 시간은 특정 시간대로 가정 (18-20시)
          // 실제로는 업무별 시간을 별도로 정의해야 함
          if (hour >= 18 && hour <= 20) {
            info.task.push(user.id);
            return;
          }
        }

        // 조용시간만 표시 (외출은 무시)
        if (slotType === 'quiet') {
          info.quiet.push(user.id);
        }
      });

      overlaps.push(info);
    }

    return overlaps;
  };

  const overlaps = calculateOverlaps();

  // 시간 라벨 렌더링
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

  // 사용자 이름 가져오기
  const getUserNames = (userIds: string[]): string => {
    return userIds
      .map(id => users.find(u => u.id === id)?.realName || '알 수 없음')
      .join(', ');
  };

  // 타임라인 블록 렌더링
  const renderTimeBlocks = () => {
    const blocks = [];

    for (let hour = 0; hour < 24; hour++) {
      const overlap = overlaps[hour];

      // 우선순위: 업무 > 조용시간
      let colorClass = 'bg-gray-100';
      let dominantType: 'task' | 'quiet' | 'free' = 'free';

      if (overlap.task.length > 0) {
        colorClass = getColorByOverlap('task', overlap.task.length);
        dominantType = 'task';
      } else if (overlap.quiet.length > 0) {
        colorClass = getColorByOverlap('quiet', overlap.quiet.length);
        dominantType = 'quiet';
      }

      blocks.push(
        <div
          key={hour}
          className={`flex-1 h-8 ${colorClass} border-r border-white cursor-pointer transition-opacity hover:opacity-80 relative`}
          onMouseEnter={(e) => {
            setHoveredHour(hour);
            const rect = e.currentTarget.getBoundingClientRect();
            setTooltipPosition({ x: rect.left + rect.width / 2, y: rect.top });
          }}
          onMouseLeave={() => setHoveredHour(null)}
          title={`${hour}시 - ${dominantType === 'task' ? '업무' : dominantType === 'quiet' ? '조용시간' : '비는 시간'}`}
        >
          {/* 툴팁 */}
          {hoveredHour === hour && (overlap.quiet.length > 0 || overlap.task.length > 0) && (
            <div
              className="fixed z-50 bg-gray-900 text-white text-xs rounded-lg shadow-lg px-3 py-2 pointer-events-none"
              style={{
                left: `${tooltipPosition.x}px`,
                top: `${tooltipPosition.y - 70}px`,
                transform: 'translateX(-50%)',
                minWidth: '150px',
              }}
            >
              <p className="font-semibold mb-1">{hour}:00 - {hour + 1}:00</p>
              {overlap.task.length > 0 && (
                <p className="text-green-300">
                  업무: {getUserNames(overlap.task)}
                </p>
              )}
              {overlap.quiet.length > 0 && (
                <p className="text-gray-300">
                  조용시간: {getUserNames(overlap.quiet)}
                </p>
              )}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                <div className="border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          )}
        </div>
      );
    }

    return blocks;
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-800">
          👥 우리 모두의 타임테이블
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
          <div className="w-4 h-4 bg-gray-600 rounded"></div>
          <span className="text-gray-700">조용시간</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-gray-700">업무</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-gray-100 rounded border border-gray-300"></div>
          <span className="text-gray-700">비는 시간</span>
        </div>
      </div>
    </div>
  );
}
