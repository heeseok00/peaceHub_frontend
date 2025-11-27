'use client';

import type { WeeklySchedule, Assignment, DayOfWeek } from '@/types';
import { TimeLabels, TimelineBlocks, TimelineLegend, type TimelineBlock } from '@/components/common/TimelineRenderer';
import { getDayOfWeek, getWeekStart } from '@/lib/utils/dateHelpers';

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
  assignments: Assignment[];
  userId: string;
}

export default function TimelineBar({
  date,
  schedule,
  assignments,
  userId,
}: TimelineBarProps) {
  // 날짜에서 요일 추출 (유틸 함수 사용)
  const dayOfWeek = getDayOfWeek(date);

  // 해당 날짜의 사용자 업무 확인 및 시간대 추출
  const weekStart = getWeekStart(date);
  const userAssignments = assignments.filter((a) => 
    a.userId === userId && 
    a.weekStart === weekStart && 
    a.days.includes(dayOfWeek)
  );

  // 해당 날짜의 업무 시간대 계산
  const taskHours = new Set<number>();
  userAssignments.forEach((assignment) => {
    if (assignment.timeRange) {
      for (let hour = assignment.timeRange.start; hour < assignment.timeRange.end && hour < 24; hour++) {
        taskHours.add(hour);
      }
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
      if (taskHours.has(hour)) {
        type = 'task';
      }

      // 툴팁에 업무 정보 추가
      let tooltip = `${hour}시 - `;
      if (type === 'task') {
        const taskNames = userAssignments
          .filter(a => a.timeRange && hour >= a.timeRange.start && hour < a.timeRange.end)
          .map(a => a.taskId)
          .join(', ');
        tooltip += `배정된 업무: ${taskNames}`;
      } else if (type === 'quiet') {
        tooltip += '조용시간';
      } else if (type === 'out') {
        tooltip += '외출';
      } else {
        tooltip += '업무 가능 시간';
      }

      // 각 시간을 개별 블록으로 추가
      blocks.push({
        startHour: hour,
        endHour: hour + 1,
        type: type,
        tooltip: tooltip,
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
        <TimelineBlocks blocks={timelineBlocks} cellHeight="h-8" readOnly />
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
    </div>
  );
}
