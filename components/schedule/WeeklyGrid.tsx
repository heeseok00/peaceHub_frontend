'use client';

import { useState } from 'react';
import type { WeeklySchedule, DayOfWeek, TimeSlot } from '@/types';
import { DAY_NAMES } from '@/types';

/**
 * 주간 타임테이블 그리드 컴포넌트
 *
 * TimelineBar 스타일의 가로 배열 디자인
 * - 토글 로직: 같은 색 클릭 시 지우기, 다른 색 클릭 시 덮어쓰기
 * - 2가지 상태: 조용시간, 외출
 */

interface WeeklyGridProps {
  schedule: WeeklySchedule;
  onChange: (schedule: WeeklySchedule) => void;
}

// 시간대 색상 매핑 (TimelineBar와 통일)
const SLOT_COLORS: Record<string, string> = {
  quiet: 'bg-gray-600',
  out: 'bg-red-400',
  null: 'bg-gray-100',
};

// 시간대 라벨
const SLOT_LABELS: Record<string, string> = {
  quiet: '조용시간',
  out: '외출',
};

export default function WeeklyGrid({ schedule, onChange }: WeeklyGridProps) {
  // 현재 선택된 Paint 모드
  const [paintMode, setPaintMode] = useState<TimeSlot>('quiet');

  // 드래그 상태
  const [isDragging, setIsDragging] = useState(false);

  // 복사 소스 요일
  const [copySource, setCopySource] = useState<DayOfWeek | null>(null);

  const days: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  /**
   * 셀 클릭 핸들러 (토글 로직)
   */
  const handleCellClick = (day: DayOfWeek, hour: number) => {
    const currentValue = schedule[day]?.[hour];
    const newSchedule = { ...schedule };

    // 토글 로직: 같은 값이면 null로 변경, 다르면 paintMode로 변경
    if (currentValue === paintMode) {
      newSchedule[day] = { ...newSchedule[day], [hour]: null };
    } else {
      newSchedule[day] = { ...newSchedule[day], [hour]: paintMode };
    }

    onChange(newSchedule);
  };

  /**
   * 드래그 시작
   */
  const handleMouseDown = (day: DayOfWeek, hour: number) => {
    setIsDragging(true);
    handleCellClick(day, hour);
  };

  /**
   * 드래그 중
   */
  const handleMouseEnter = (day: DayOfWeek, hour: number) => {
    if (isDragging) {
      handleCellClick(day, hour);
    }
  };

  /**
   * 드래그 종료
   */
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  /**
   * 요일 전체 지우기
   */
  const handleClearDay = (day: DayOfWeek) => {
    const newSchedule = { ...schedule };
    const hours: { [hour: number]: null } = {};
    for (let i = 0; i < 24; i++) {
      hours[i] = null;
    }
    newSchedule[day] = hours;
    onChange(newSchedule);
  };

  /**
   * 요일 전체 복사
   */
  const handleCopyDay = (sourceDay: DayOfWeek, targetDay: DayOfWeek) => {
    const newSchedule = { ...schedule };
    newSchedule[targetDay] = { ...schedule[sourceDay] };
    onChange(newSchedule);
    setCopySource(null); // 복사 후 초기화
  };

  /**
   * 평일 전체 적용 (월요일 기준)
   */
  const handleApplyWeekdays = () => {
    if (!schedule.mon) return;
    const newSchedule = { ...schedule };
    ['tue', 'wed', 'thu', 'fri'].forEach((day) => {
      newSchedule[day as DayOfWeek] = { ...schedule.mon };
    });
    onChange(newSchedule);
  };

  /**
   * 주말 적용 (토요일 → 일요일)
   */
  const handleApplyWeekend = () => {
    if (!schedule.sat) return;
    const newSchedule = { ...schedule };
    newSchedule.sun = { ...schedule.sat };
    onChange(newSchedule);
  };

  /**
   * 시간 라벨 렌더링 (2시간 간격)
   */
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

  /**
   * 요일별 타임라인 렌더링
   */
  const renderDayTimeline = (day: DayOfWeek) => {
    const blocks = [];
    const daySchedule = schedule[day];

    for (let hour = 0; hour < 24; hour++) {
      const slotType = daySchedule?.[hour];
      const colorClass = SLOT_COLORS[slotType || 'null'];

      blocks.push(
        <div
          key={hour}
          onMouseDown={() => handleMouseDown(day, hour)}
          onMouseEnter={() => handleMouseEnter(day, hour)}
          className={`flex-1 h-10 ${colorClass} border-r border-white cursor-pointer transition-opacity hover:opacity-80`}
          title={`${DAY_NAMES[day]} ${hour}시 - ${slotType ? SLOT_LABELS[slotType] : '비는 시간'}`}
        />
      );
    }

    return blocks;
  };

  return (
    <div className="space-y-6" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      {/* Paint 모드 선택 툴바 */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <p className="text-sm font-medium text-gray-700 mb-3">
          상태 선택 (클릭/드래그로 시간대 선택, 같은 색 클릭 시 지우기)
        </p>
        <div className="flex gap-3">
          {(['quiet', 'out'] as TimeSlot[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setPaintMode(mode)}
              className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                paintMode === mode
                  ? 'ring-2 ring-primary-500 ring-offset-2'
                  : ''
              }`}
            >
              <div className={`w-6 h-6 ${SLOT_COLORS[mode]} rounded`}></div>
              <span className="text-gray-800">{SLOT_LABELS[mode]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 타임테이블 그리드 (TimelineBar 스타일) */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="space-y-4">
          {/* 시간 라벨 */}
          <div className="flex pl-12">
            {renderTimeLabels()}
          </div>

          {/* 요일별 타임라인 */}
          {days.map((day) => (
            <div key={day} className="flex items-center gap-2">
              {/* 요일 라벨 */}
              <div className="w-10 text-sm font-bold text-gray-700 text-center">
                {DAY_NAMES[day]}
              </div>

              {/* 타임라인 바 */}
              <div className="flex-1 flex rounded overflow-hidden border border-gray-300">
                {renderDayTimeline(day)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 빠른 설정 */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <p className="text-sm font-medium text-gray-700 mb-3">빠른 설정</p>

        {/* 일괄 적용 버튼 */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleApplyWeekdays}
            className="flex-1 px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-sm font-medium"
          >
            월요일 → 평일 전체 적용
          </button>
          <button
            onClick={handleApplyWeekend}
            className="flex-1 px-4 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg text-sm font-medium"
          >
            토요일 → 일요일 적용
          </button>
        </div>

        {/* 요일별 액션 */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => (
            <div key={day} className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-600 text-center">
                {DAY_NAMES[day]}
              </span>
              <button
                onClick={() =>
                  copySource === day ? setCopySource(null) : setCopySource(day)
                }
                className={`text-xs px-2 py-1 rounded ${
                  copySource === day
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {copySource === day ? '취소' : '복사'}
              </button>
              {copySource && copySource !== day && (
                <button
                  onClick={() => handleCopyDay(copySource, day)}
                  className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200"
                >
                  붙여넣기
                </button>
              )}
              <button
                onClick={() => handleClearDay(day)}
                className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
              >
                지우기
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
