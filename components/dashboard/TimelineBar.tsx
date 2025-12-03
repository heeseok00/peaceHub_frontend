'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { WeeklySchedule, ScheduleBlock, DayOfWeek } from '@/types';
import { TimeLabels, TimelineBlocks, TimelineLegend, type TimelineBlock } from '@/components/common/TimelineRenderer';
import { getDayOfWeek, hourFromISOTimestamp } from '@/lib/utils/dateHelpers';
import { getTaskEmojiByTitle } from '@/lib/constants/tasks';

/**
 * 오늘의 타임테이블 바 컴포넌트 (개선됨)
 *
 * TimelineRenderer를 사용하여 재사용성 향상
 * 24시간 타임라인을 가로 바 형태로 시각화
 * - 수면/바쁨/조용 시간 표시
 * - 집안일 시간 강조
 */

interface TimelineBarProps {
  date: Date;
  schedule: WeeklySchedule;
  myTaskBlocks: ScheduleBlock[];  // assignments 대신 본인의 TASK 블록 사용
  userId: string;
}

export default function TimelineBar({
  date,
  schedule,
  myTaskBlocks,
  userId,
}: TimelineBarProps) {
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // 날짜에서 요일 추출 (유틸 함수 사용)
  const dayOfWeek = getDayOfWeek(date);

  // myTaskBlocks에서 TASK 타입만 필터링하여 시간별 맵 생성
  const tasksByHour = new Map<number, ScheduleBlock[]>();

  myTaskBlocks
    .filter(block => block.type === 'task')
    .forEach(block => {
      const startHour = hourFromISOTimestamp(block.startTime);
      let endHour = hourFromISOTimestamp(block.endTime);

      // 다음날 00시 예외처리
      if (endHour === 0) {
        endHour = 24;
      }

      for (let hour = startHour; hour < endHour && hour < 24; hour++) {
        if (!tasksByHour.has(hour)) {
          tasksByHour.set(hour, []);
        }
        tasksByHour.get(hour)!.push(block);
      }
    });

  // 타임라인 블록 생성 (시간별 칸 구분)
  const createTimelineBlocks = (): TimelineBlock[] => {
    const blocks: TimelineBlock[] = [];
    const daySchedule = schedule[dayOfWeek];

    // 각 시간을 별도의 블록으로 생성 (병합하지 않음)
    for (let hour = 0; hour < 24; hour++) {
      const slotType = daySchedule?.[hour];

      // 타입 결정: 업무 시간 > 스케줄 타입 > 비는 시간
      let type: 'quiet' | 'out' | 'task' | null = slotType;

      // 실제 배정된 업무 시간대 확인
      if (tasksByHour.has(hour) && tasksByHour.get(hour)!.length > 0) {
        type = 'task';
      }

      // 각 시간을 개별 블록으로 추가
      blocks.push({
        startHour: hour,
        endHour: hour + 1,
        type: type,
      });
    }

    return blocks;
  };

  const timelineBlocks = createTimelineBlocks();

  return (
    <div className="card-compact">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-800">
          👤 나의 타임테이블
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
        {timelineBlocks.map((block, index) => {
          const type = block.type || 'free';
          let colorClass = 'time-slot-free';
          if (type === 'quiet') colorClass = 'time-slot-quiet';
          else if (type === 'out') colorClass = 'time-slot-out';
          else if (type === 'task') colorClass = 'time-slot-task';

          return (
            <div
              key={index}
              className={`flex-1 h-8 ${colorClass} border-r border-white cursor-pointer transition-opacity hover:opacity-80`}
              onMouseEnter={(e) => {
                setHoveredHour(block.startHour);
                const rect = e.currentTarget.getBoundingClientRect();
                setTooltipPosition({ x: rect.left + rect.width / 2, y: rect.top });
              }}
              onMouseLeave={() => setHoveredHour(null)}
            />
          );
        })}
      </div>

      {/* 범례 */}
      <div className="mt-3">
        <TimelineLegend
          items={[
            { color: 'time-slot-quiet', label: '조용시간' },
            { color: 'time-slot-out', label: '외출' },
            { color: 'time-slot-task', label: '배정된 업무' },
            { color: 'time-slot-free', label: '업무 가능 시간', border: true },
          ]}
        />
      </div>

      {/* 툴팁 (Portal로 렌더링) */}
      {hoveredHour !== null && typeof window !== 'undefined' && (() => {
        const block = timelineBlocks[hoveredHour];
        if (!block) return null;

        const type = block.type;
        if (!type || type === null) return null; // 비는 시간은 툴팁 없음

        const daySchedule = schedule[dayOfWeek];

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

            {type === 'task' && (() => {
              const tasksAtHour = tasksByHour.get(hoveredHour);
              if (!tasksAtHour || tasksAtHour.length === 0) return null;

              return (
                <div className="text-green-300">
                  <p className="font-semibold mb-1">배정된 업무:</p>
                  {tasksAtHour.map((taskBlock, idx) => {
                    const title = taskBlock.taskInfo?.title || '업무';
                    const emoji = getTaskEmojiByTitle(title);
                    const startHour = hourFromISOTimestamp(taskBlock.startTime);
                    let endHour = hourFromISOTimestamp(taskBlock.endTime);

                    // 다음날 00시 UI 표시 보정
                    if (endHour === 0) {
                      endHour = 24;
                    }

                    return (
                      <p key={idx} className="text-xs text-green-200">
                        {emoji} {title} ({startHour}~{endHour}시)
                      </p>
                    );
                  })}
                </div>
              );
            })()}

            {type === 'quiet' && (() => {
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
                <div className="text-gray-300">
                  <p className="text-xs">조용시간: {startHour}~{endHour}시</p>
                </div>
              );
            })()}

            {type === 'out' && (() => {
              if (!daySchedule) return null;

              // hoveredHour를 포함하는 연속된 out 구간 찾기
              let startHour = hoveredHour;
              let endHour = hoveredHour + 1;

              // 앞으로 확장
              while (startHour > 0 && daySchedule[startHour - 1] === 'out') {
                startHour--;
              }

              // 뒤로 확장
              while (endHour < 24 && daySchedule[endHour] === 'out') {
                endHour++;
              }

              return (
                <div className="text-red-300">
                  <p className="text-xs">외출: {startHour}~{endHour}시</p>
                </div>
              );
            })()}

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
