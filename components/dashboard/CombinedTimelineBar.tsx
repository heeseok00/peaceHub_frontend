'use client';

import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { WeeklySchedule, ScheduleBlock, DayOfWeek, User, TimeSlot } from '@/types';
import { TimeLabels } from '@/components/common/TimelineRenderer';
import { getDayOfWeek, hourFromISOTimestamp } from '@/lib/utils/dateHelpers';
import { getTaskEmojiByTitle } from '@/lib/constants/tasks';

/**
 * 통합 타임라인 바 컴포넌트 (개선됨)
 *
 * 모든 멤버의 스케줄을 겹쳐서 표시
 * globals.css와 유틸리티 함수 활용
 * - 겹침 수에 따라 채도 조절
 * - 호버 시 상세 정보 표시
 */

interface CombinedTimelineBarProps {
  date: Date;
  allSchedules: Map<string, WeeklySchedule>;
  memberTaskBlocks: ScheduleBlock[];  // assignments 대신
  users: User[];
}

// 겹침 정보
interface OverlapInfo {
  quiet: string[]; // 조용시간 사용자 실명들 (realName)
  task: string[]; // 업무 사용자 실명들 (realName)
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
    // 조용시간과 동일한 패턴 적용
    if (count === 0) return 'bg-gray-100';
    if (count === 1) return 'bg-green-300';
    if (count === 2) return 'bg-green-400';
    if (count === 3) return 'bg-green-500';
    return 'bg-green-600'; // 4명 이상
  }
  return 'bg-gray-100';
};

export default function CombinedTimelineBar({
  date,
  allSchedules,
  memberTaskBlocks,
  users,
}: CombinedTimelineBarProps) {
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // 날짜에서 요일 추출 (유틸 함수 사용)
  const dayOfWeek = getDayOfWeek(date);

  // memberTaskBlocks에서 TASK 타입만 필터링하여 시간별 맵 생성
  const tasksByUserAndHour = useMemo(() => {
    const result = new Map<string, Map<number, ScheduleBlock[]>>();

    if (!memberTaskBlocks) return result;

    memberTaskBlocks
      .filter(block => block.type === 'task')
      .forEach(block => {
        const userId = block.userId; // userName 대신 userId 사용
        const startHour = hourFromISOTimestamp(block.startTime);
        const endHour = hourFromISOTimestamp(block.endTime);

        if (!result.has(userId)) {
          result.set(userId, new Map());
        }

        const userTaskMap = result.get(userId)!;

        for (let hour = startHour; hour < endHour && hour < 24; hour++) {
          if (!userTaskMap.has(hour)) {
            userTaskMap.set(hour, []);
          }
          userTaskMap.get(hour)!.push(block);
        }
      });

    return result;
  }, [memberTaskBlocks]);

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
        // 먼저 업무 시간 확인 (schedule 없어도 가능)
        const userTaskMap = tasksByUserAndHour.get(user.id); // userId 기반
        if (userTaskMap && userTaskMap.has(hour)) {
          info.task.push(user.realName); // realName 사용
          return; // 업무가 있으면 조용시간 무시
        }

        // 조용시간 확인 (schedule이 있을 때만)
        const schedule = allSchedules.get(user.id);
        if (schedule) {
          const daySchedule = schedule[dayOfWeek];
          const slotType = daySchedule?.[hour];

          if (slotType === 'quiet') {
            info.quiet.push(user.realName); // realName 사용
          }
        }
      });

      overlaps.push(info);
    }

    return overlaps;
  };

  const overlaps = calculateOverlaps();

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
          className={`flex-1 h-8 ${colorClass} border-r border-white cursor-pointer transition-opacity hover:opacity-80`}
          onMouseEnter={(e) => {
            setHoveredHour(hour);
            const rect = e.currentTarget.getBoundingClientRect();
            setTooltipPosition({ x: rect.left + rect.width / 2, y: rect.top });
          }}
          onMouseLeave={() => setHoveredHour(null)}
        />
      );
    }

    return blocks;
  };

  return (
    <div className="card-compact">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-800">
          👥 우리 모두의 타임테이블
        </h3>
        <p className="text-xs text-gray-500">
          {date.getMonth() + 1}월 {date.getDate()}일
        </p>
      </div>

      {/* 시간 라벨 (개선: 블록 왼쪽 정렬) */}
      <div className="mb-1">
        <TimeLabels interval={2} showZero leftPadding="" />
      </div>

      {/* 타임라인 바 */}
      <div className="flex rounded overflow-hidden border border-gray-300">
        {renderTimeBlocks()}
      </div>

      {/* 범례 */}
      <div className="mt-3 flex gap-4 flex-wrap text-xs">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 time-slot-quiet rounded"></div>
          <span className="text-gray-700">조용시간</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 time-slot-task rounded"></div>
          <span className="text-gray-700">업무</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 time-slot-free rounded border border-gray-300"></div>
          <span className="text-gray-700">비는 시간</span>
        </div>
      </div>

      {/* 툴팁 (Portal로 렌더링) */}
      {hoveredHour !== null && typeof window !== 'undefined' && (() => {
        const overlap = overlaps[hoveredHour];
        if (!overlap || (overlap.quiet.length === 0 && overlap.task.length === 0)) {
          return null;
        }

        return createPortal(
          <div
            className="fixed z-[9999] bg-gray-900 text-white text-xs rounded-lg shadow-lg px-3 py-2 pointer-events-none"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y - 70}px`,
              transform: 'translateX(-50%)',
              minWidth: '150px',
            }}
          >
            <p className="font-semibold mb-1">{hoveredHour}:00 - {hoveredHour + 1}:00</p>
            {overlap.task.length > 0 && (
              <div className="text-green-300">
                <p className="font-semibold mb-1">업무:</p>
                {overlap.task.map(userName => {
                  // userName은 realName이므로, userId를 찾아야 함
                  const user = users.find(u => u.realName === userName);
                  if (!user) return null;

                  const userTaskMap = tasksByUserAndHour.get(user.id); // userId로 검색
                  if (userTaskMap && userTaskMap.has(hoveredHour)) {
                    const tasksAtHour = userTaskMap.get(hoveredHour)!;
                    // 각 블록의 실제 시간대 표시
                    const taskInfos = tasksAtHour.map(block => {
                      const title = block.taskInfo?.title || '업무';
                      const emoji = getTaskEmojiByTitle(title);
                      const startHour = hourFromISOTimestamp(block.startTime);
                      const endHour = hourFromISOTimestamp(block.endTime);
                      return `${emoji} ${title} (${startHour}~${endHour}시)`;
                    }).join(', ');

                    return (
                      <p key={userName} className="text-xs text-green-200">
                        {userName}: {taskInfos}
                      </p>
                    );
                  }
                  return null;
                })}
              </div>
            )}
            {overlap.quiet.length > 0 && (
              <div className="text-gray-300">
                <p className="font-semibold mb-1">조용시간:</p>
                {overlap.quiet.map(userName => {
                  // userName은 realName이므로, userId를 찾아야 함
                  const user = users.find(u => u.realName === userName);
                  if (!user) return null;

                  const schedule = allSchedules.get(user.id);
                  if (!schedule) return null;

                  const daySchedule = schedule[dayOfWeek];
                  if (!daySchedule) return null;

                  // hoveredHour를 포함하는 연속된 quiet 구간 찾기
                  let startHour = hoveredHour;
                  let endHour = hoveredHour + 1;

                  // 앞으로 확장
                  while (startHour > 0 && daySchedule[startHour - 1] === 'quiet') {
                    startHour--;
                  }

                  // 뒤로 확장
                  while (endHour < 24 && daySchedule[endHour] === 'quiet') {
                    endHour++;
                  }

                  return (
                    <p key={userName} className="text-xs text-gray-400">
                      {userName}: {startHour}~{endHour}시
                    </p>
                  );
                })}
              </div>
            )}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>,
          document.body
        );
      })()}
    </div>
  );
}
