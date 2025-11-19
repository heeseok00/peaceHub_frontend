/**
 * API Data Transformers
 *
 * Frontend ↔ Backend 데이터 형식 변환 유틸리티
 *
 * Frontend 형식:
 * - DayOfWeek: 'mon', 'tue', 'wed', ...
 * - TimeSlot: 'quiet' | 'out' | null
 * - Time: 0-23 (hour)
 *
 * Backend 형식:
 * - DayOfWeek: 'MONDAY', 'TUESDAY', 'WEDNESDAY', ...
 * - TimeBlockType: 'QUIET' | 'BUSY' | 'TASK' | 'FREE'
 * - Time: ISO 8601 timestamp (날짜 포함)
 */

import type { DayOfWeek, TimeSlot, WeeklySchedule } from '@/types';
import type { BackendDayOfWeek, BackendTimeBlockType, BackendTimeBlock } from '@/types/api';
import { toISOTimestamp, hourFromISOTimestamp, addDaysToDateString } from '@/lib/utils/dateHelpers';

// ==================== Day of Week Conversion ====================

const DAY_MAP: Record<DayOfWeek, BackendDayOfWeek> = {
  mon: 'MONDAY',
  tue: 'TUESDAY',
  wed: 'WEDNESDAY',
  thu: 'THURSDAY',
  fri: 'FRIDAY',
  sat: 'SATURDAY',
  sun: 'SUNDAY',
};

const REVERSE_DAY_MAP: Record<BackendDayOfWeek, DayOfWeek> = {
  MONDAY: 'mon',
  TUESDAY: 'tue',
  WEDNESDAY: 'wed',
  THURSDAY: 'thu',
  FRIDAY: 'fri',
  SATURDAY: 'sat',
  SUNDAY: 'sun',
};

/**
 * Frontend 요일 → Backend 요일
 * @param day Frontend 요일 ('mon', 'tue', ...)
 * @returns Backend 요일 ('MONDAY', 'TUESDAY', ...)
 */
export function toBackendDay(day: DayOfWeek): BackendDayOfWeek {
  return DAY_MAP[day];
}

/**
 * Backend 요일 → Frontend 요일
 * @param day Backend 요일 ('MONDAY', 'TUESDAY', ...)
 * @returns Frontend 요일 ('mon', 'tue', ...)
 */
export function fromBackendDay(day: BackendDayOfWeek): DayOfWeek {
  return REVERSE_DAY_MAP[day];
}

// ==================== Time Slot Conversion ====================

/**
 * Frontend TimeSlot → Backend TimeBlockType
 * @param slot Frontend TimeSlot ('quiet' | 'out' | null)
 * @returns Backend TimeBlockType ('QUIET' | 'BUSY' | 'FREE')
 */
export function toBackendTimeSlot(slot: TimeSlot): BackendTimeBlockType {
  if (slot === 'quiet') return 'QUIET';
  if (slot === 'out') return 'BUSY';
  return 'FREE'; // null → FREE (빈 시간)
}

/**
 * Backend TimeBlockType → Frontend TimeSlot
 * @param type Backend TimeBlockType ('QUIET' | 'BUSY' | 'TASK' | 'FREE')
 * @returns Frontend TimeSlot ('quiet' | 'out' | null)
 */
export function fromBackendTimeSlot(type: BackendTimeBlockType): TimeSlot {
  if (type === 'QUIET') return 'quiet';
  if (type === 'BUSY') return 'out';
  // TASK, FREE → null (빈 시간 또는 업무 시간)
  return null;
}

// ==================== Time Format Conversion ====================

/**
 * 시간(hour) → 분 단위 (minutes from midnight)
 * @param hour 시간 (0-23)
 * @returns 분 단위 (0-1439)
 */
export function hourToMinutes(hour: number): number {
  return hour * 60;
}

/**
 * 분 단위 → 시간(hour)
 * @param minutes 분 단위 (0-1439)
 * @returns 시간 (0-23)
 */
export function minutesToHour(minutes: number): number {
  return Math.floor(minutes / 60);
}

/**
 * 시간(hour) → "HH:MM" 형식 문자열
 * @param hour 시간 (0-23)
 * @returns "HH:MM" 형식 (예: "09:00", "16:30")
 */
export function hourToTimeString(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`;
}

/**
 * 분 단위 → "HH:MM" 형식 문자열
 * @param minutes 분 단위 (0-1439)
 * @returns "HH:MM" 형식
 */
export function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// ==================== Schedule Conversion ====================

/**
 * Frontend WeeklySchedule → Backend TimeBlock 배열
 *
 * Frontend: { mon: { 0: 'quiet', 1: 'quiet', ... }, ... }
 * Backend: [{ dayOfWeek: 'MONDAY', type: 'QUIET', startTime: "2025-11-24T00:00:00.000Z", ... }, ...]
 *
 * @param schedule Frontend WeeklySchedule
 * @param weekStart 해당 주의 월요일 날짜 (YYYY-MM-DD 형식)
 * @returns Backend TimeBlock 배열 (요일, 시간 순 정렬)
 */
export function toBackendSchedule(schedule: WeeklySchedule, weekStart: string): BackendTimeBlock[] {
  const blocks: BackendTimeBlock[] = [];
  const days: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  days.forEach((day, dayIndex) => {
    const daySchedule = schedule[day];
    if (!daySchedule) return;

    // 해당 요일의 날짜 계산 (weekStart + dayIndex)
    const dateStr = addDaysToDateString(weekStart, dayIndex);

    let currentType: BackendTimeBlockType | null = null;
    let startHour: number | null = null;

    for (let hour = 0; hour < 24; hour++) {
      const slot = daySchedule[hour];
      const blockType = toBackendTimeSlot(slot);

      if (currentType === null) {
        // 첫 블록 시작
        currentType = blockType;
        startHour = hour;
      } else if (blockType !== currentType) {
        // 타입이 바뀌면 이전 블록 저장
        blocks.push({
          dayOfWeek: toBackendDay(day),
          type: currentType,
          startTime: toISOTimestamp(dateStr, startHour!),
          endTime: toISOTimestamp(dateStr, hour),
        });

        // 새 블록 시작
        currentType = blockType;
        startHour = hour;
      }
    }

    // 마지막 블록 저장 (24시까지)
    if (currentType !== null && startHour !== null) {
      // 24시는 다음 날 00시로 표현
      const nextDateStr = addDaysToDateString(weekStart, dayIndex + 1);
      blocks.push({
        dayOfWeek: toBackendDay(day),
        type: currentType,
        startTime: toISOTimestamp(dateStr, startHour),
        endTime: toISOTimestamp(nextDateStr, 0),
      });
    }
  });

  return blocks;
}

/**
 * Backend TimeBlock 배열 → Frontend WeeklySchedule
 *
 * @param blocks Backend TimeBlock 배열
 * @returns Frontend WeeklySchedule
 */
export function fromBackendSchedule(blocks: BackendTimeBlock[]): WeeklySchedule {
  const days: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  // 모든 요일, 모든 시간을 null(FREE)로 초기화
  const schedule: WeeklySchedule = {
    mon: {},
    tue: {},
    wed: {},
    thu: {},
    fri: {},
    sat: {},
    sun: {},
  };

  // 각 요일의 24시간을 null로 초기화
  days.forEach((day) => {
    for (let hour = 0; hour < 24; hour++) {
      schedule[day][hour] = null;
    }
  });

  // 백엔드 데이터로 덮어쓰기
  blocks.forEach((block) => {
    const day = fromBackendDay(block.dayOfWeek);
    const slot = fromBackendTimeSlot(block.type);
    const startHour = hourFromISOTimestamp(block.startTime);
    const endHour = hourFromISOTimestamp(block.endTime);

    // startHour부터 endHour 이전까지 TimeSlot 설정
    for (let hour = startHour; hour < endHour && hour < 24; hour++) {
      schedule[day][hour] = slot;
    }
  });

  return schedule;
}

// ==================== Validation ====================

/**
 * Backend TimeBlock 배열 검증
 *
 * 검증 항목:
 * - 시간 공백 없음 (24시간 모두 커버)
 * - 시간 중복 없음
 * - ISO timestamp 유효성
 * - endTime > startTime
 *
 * @param blocks Backend TimeBlock 배열
 * @returns 유효하면 true, 아니면 에러 메시지
 */
export function validateBackendSchedule(
  blocks: BackendTimeBlock[]
): { valid: boolean; error?: string } {
  const days: BackendDayOfWeek[] = [
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
    'SUNDAY',
  ];

  for (const day of days) {
    const dayBlocks = blocks.filter((b) => b.dayOfWeek === day);

    // 요일별로 시간 순 정렬
    dayBlocks.sort((a, b) => {
      const aStart = hourFromISOTimestamp(a.startTime);
      const bStart = hourFromISOTimestamp(b.startTime);
      return aStart - bStart;
    });

    let expectedHour = 0;

    for (const block of dayBlocks) {
      const startHour = hourFromISOTimestamp(block.startTime);
      const endHour = hourFromISOTimestamp(block.endTime);

      // 시간 범위 검증
      if (startHour < 0 || startHour >= 24) {
        return { valid: false, error: `Invalid start hour: ${startHour}` };
      }
      if (endHour <= 0 || endHour > 24) {
        return { valid: false, error: `Invalid end hour: ${endHour}` };
      }

      // endTime > startTime 검증
      if (endHour <= startHour) {
        return { valid: false, error: 'endTime must be greater than startTime' };
      }

      // 공백 검증
      if (startHour !== expectedHour) {
        return {
          valid: false,
          error: `Time gap detected on ${day} at ${expectedHour}:00`,
        };
      }

      expectedHour = endHour;
    }

    // 24시간 전체 커버 검증 (마지막 블록의 endHour는 다음 날 00시일 수 있음)
    if (expectedHour !== 24 && expectedHour !== 0) {
      return {
        valid: false,
        error: `${day} does not cover full 24 hours (ends at ${expectedHour}:00)`,
      };
    }
  }

  return { valid: true };
}
