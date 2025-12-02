/**
 * Timeline Renderer Component
 *
 * 타임라인 렌더링 로직을 공통화한 재사용 가능한 컴포넌트
 * WeeklyGrid, TimelineBar, CombinedTimelineBar 등에서 사용
 */

import React from 'react';
import type { TimeSlot } from '@/types';

// ==================== Types ====================

export interface TimelineBlock {
  /** 시작 시간 (0-23) */
  startHour: number;
  /** 종료 시간 (1-24, startHour보다 큼) */
  endHour: number;
  /** 블록 타입 */
  type: TimeSlot | 'task';
  /** Tooltip 텍스트 (선택사항) */
  tooltip?: string;
  /** 추가 className (선택사항) */
  className?: string;
}

export interface TimelineRenderProps {
  /** 타임라인 블록 배열 */
  blocks: TimelineBlock[];
  /** 클릭 핸들러 (선택사항) */
  onCellClick?: (hour: number) => void;
  /** 마우스 다운 핸들러 (선택사항, 드래그용) */
  onCellMouseDown?: (hour: number) => void;
  /** 마우스 엔터 핸들러 (선택사항, 드래그용) */
  onCellMouseEnter?: (hour: number) => void;
  /** 셀 높이 */
  cellHeight?: string;
  /** 읽기 전용 모드 (클릭 비활성화) */
  readOnly?: boolean;
}

export interface TimeLabelsProps {
  /** 시간 간격 (기본: 2시간) */
  interval?: number;
  /** 0시 표시 여부 (기본: true) */
  showZero?: boolean;
  /** 24시 표시 여부 (기본: true) */
  show24?: boolean;
  /** 왼쪽 여백 (요일 라벨 공간, 기본: 'pl-12') */
  leftPadding?: string;
}

// ==================== Helper Functions ====================

/**
 * TimeSlot 타입에 따른 CSS 클래스 반환
 */
function getTimeSlotClass(type: TimeSlot | 'task'): string {
  switch (type) {
    case 'quiet':
      return 'time-slot-quiet';
    case 'out':
      return 'time-slot-out';
    case 'task':
      return 'time-slot-task';
    default:
      return 'time-slot-free';
  }
}

// ==================== Components ====================

/**
 * 시간 라벨 렌더러 (개선: 블록 왼쪽 정렬)
 *
 * @example
 * ```tsx
 * <TimeLabels interval={2} showZero show24={false} />
 * ```
 */
export function TimeLabels({
  interval = 2,
  showZero = true,
  show24 = false, // 기본값 false로 변경 (어색하므로)
  leftPadding = 'pl-12',
}: TimeLabelsProps) {
  const labels = [];

  // 0시부터 22시까지 (또는 설정에 따라)
  const maxHour = show24 ? 24 : 24 - interval;

  for (let hour = 0; hour <= maxHour; hour += interval) {
    // 0시 스킵 옵션
    if (!showZero && hour === 0) continue;

    labels.push(
      <div
        key={hour}
        className="text-xs text-gray-600 font-medium text-left"
        style={{ flex: hour === maxHour && show24 ? 0 : interval }}
      >
        {hour}
      </div>
    );
  }

  return (
    <div className={`flex ${leftPadding}`}>
      {labels}
    </div>
  );
}

/**
 * 타임라인 블록 렌더러
 *
 * 24개의 셀을 렌더링하되, blocks 배열에 따라 색상을 적용
 * 연속된 같은 타입의 블록은 하나의 div로 병합하여 렌더링
 *
 * @example
 * ```tsx
 * <TimelineBlocks
 *   blocks={[
 *     { startHour: 0, endHour: 9, type: 'quiet' },
 *     { startHour: 9, endHour: 18, type: null },
 *     { startHour: 18, endHour: 24, type: 'task' },
 *   ]}
 * />
 * ```
 */
export function TimelineBlocks({
  blocks,
  onCellClick,
  onCellMouseDown,
  onCellMouseEnter,
  cellHeight = 'h-10',
  readOnly = false,
}: TimelineRenderProps) {
  // blocks를 시간 순으로 정렬
  const sortedBlocks = [...blocks].sort((a, b) => a.startHour - b.startHour);

  // 블록 렌더링
  const renderedBlocks = sortedBlocks.map((block, index) => {
    const width = block.endHour - block.startHour;
    const colorClass = block.className || getTimeSlotClass(block.type);

    return (
      <div
        key={`${block.startHour}-${index}`}
        className={`${colorClass} ${cellHeight} border-r border-white ${
          !readOnly ? 'cursor-pointer transition-opacity hover:opacity-80' : ''
        }`}
        style={{ flex: width }}
        onClick={() => !readOnly && onCellClick?.(block.startHour)}
        onMouseDown={() => !readOnly && onCellMouseDown?.(block.startHour)}
        onMouseEnter={() => !readOnly && onCellMouseEnter?.(block.startHour)}
      />
    );
  });

  return <>{renderedBlocks}</>;
}

/**
 * 완전한 타임라인 행 렌더러 (라벨 + 블록)
 *
 * @example
 * ```tsx
 * <TimelineRow
 *   label="월"
 *   blocks={blocks}
 *   onCellClick={(hour) => console.log(hour)}
 * />
 * ```
 */
export function TimelineRow({
  label,
  blocks,
  onCellClick,
  onCellMouseDown,
  onCellMouseEnter,
  cellHeight = 'h-10',
  readOnly = false,
}: TimelineRenderProps & { label: string }) {
  return (
    <div className="timeline-row">
      {/* 요일/라벨 */}
      <div className="timeline-label">{label}</div>

      {/* 타임라인 바 */}
      <div className="timeline-bar">
        <TimelineBlocks
          blocks={blocks}
          onCellClick={onCellClick}
          onCellMouseDown={onCellMouseDown}
          onCellMouseEnter={onCellMouseEnter}
          cellHeight={cellHeight}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
}

/**
 * 범례(Legend) 렌더러
 *
 * @example
 * ```tsx
 * <TimelineLegend
 *   items={[
 *     { color: 'time-slot-quiet', label: '조용시간' },
 *     { color: 'time-slot-out', label: '외출' },
 *   ]}
 * />
 * ```
 */
export function TimelineLegend({
  items,
}: {
  items: Array<{ color: string; label: string; border?: boolean }>;
}) {
  return (
    <div className="flex gap-4 flex-wrap text-xs">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1">
          <div
            className={`w-4 h-4 ${item.color} rounded ${
              item.border ? 'border border-gray-300' : ''
            }`}
          ></div>
          <span className="text-gray-700">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * 시간별 셀 배열로 변환하는 헬퍼 함수
 *
 * 0-23시 각 시간을 개별 셀로 만들어 반환
 * (WeeklyGrid 스타일의 드래그 편집에 사용)
 *
 * @param schedule 시간별 TimeSlot 객체 { 0: 'quiet', 1: 'quiet', ... }
 * @returns TimelineBlock 배열 (각 시간이 개별 블록)
 */
export function scheduleToHourlyBlocks(schedule: {
  [hour: number]: TimeSlot;
}): TimelineBlock[] {
  const blocks: TimelineBlock[] = [];

  for (let hour = 0; hour < 24; hour++) {
    blocks.push({
      startHour: hour,
      endHour: hour + 1,
      type: schedule[hour] || null,
    });
  }

  return blocks;
}

/**
 * 연속된 같은 타입의 블록을 병합하는 헬퍼 함수
 *
 * [0-1: quiet, 1-2: quiet, 2-3: quiet] → [0-3: quiet]
 *
 * @param schedule 시간별 TimeSlot 객체
 * @returns 병합된 TimelineBlock 배열
 */
export function scheduleToMergedBlocks(schedule: {
  [hour: number]: TimeSlot | 'task';
}): TimelineBlock[] {
  const blocks: TimelineBlock[] = [];
  let currentType: TimeSlot | 'task' | null = null;
  let startHour = 0;

  for (let hour = 0; hour < 24; hour++) {
    const type = schedule[hour] ?? null;

    if (currentType === null) {
      // 첫 블록 시작
      currentType = type;
      startHour = hour;
    } else if (type !== currentType) {
      // 타입이 바뀌면 이전 블록 저장
      blocks.push({
        startHour,
        endHour: hour,
        type: currentType,
      });

      // 새 블록 시작
      currentType = type;
      startHour = hour;
    }
  }

  // 마지막 블록 저장
  if (currentType !== null) {
    blocks.push({
      startHour,
      endHour: 24,
      type: currentType,
    });
  }

  return blocks;
}
