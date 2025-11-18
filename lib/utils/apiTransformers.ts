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
 * - TimeBlockType: 'QUIET' | 'BUSY' | 'TASK'
 * - Time: 0-1439 (minutes from midnight)
 */

import type { DayOfWeek, TimeSlot, WeeklySchedule } from '@/types';
import type { BackendDayOfWeek, BackendTimeBlockType, BackendTimeBlock } from '@/types/api';

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
 * @returns Backend TimeBlockType ('QUIET' | 'BUSY' | 'TASK')
 */
export function toBackendTimeSlot(slot: TimeSlot): BackendTimeBlockType {
  if (slot === 'quiet') return 'QUIET';
  if (slot === 'out') return 'BUSY';
  return 'TASK'; // null → TASK
}

/**
 * Backend TimeBlockType → Frontend TimeSlot
 * @param type Backend TimeBlockType ('QUIET' | 'BUSY' | 'TASK')
 * @returns Frontend TimeSlot ('quiet' | 'out' | null)
 */
export function fromBackendTimeSlot(type: BackendTimeBlockType): TimeSlot {
  if (type === 'QUIET') return 'quiet';
  if (type === 'BUSY') return 'out';
  return null; // TASK → null
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
 * Backend: [{ dayOfWeek: 'MONDAY', type: 'QUIET', startTime: 0, endTime: 120 }, ...]
 *
 * @param schedule Frontend WeeklySchedule
 * @returns Backend TimeBlock 배열 (요일, 시간 순 정렬)
 */
export function toBackendSchedule(schedule: WeeklySchedule): BackendTimeBlock[] {
  const blocks: BackendTimeBlock[] = [];
  const days: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  days.forEach((day) => {
    const daySchedule = schedule[day];
    if (!daySchedule) return;

    let currentType: BackendTimeBlockType | null = null;
    let startTime: number | null = null;

    for (let hour = 0; hour < 24; hour++) {
      const slot = daySchedule[hour];
      const blockType = toBackendTimeSlot(slot);

      if (currentType === null) {
        // 첫 블록 시작
        currentType = blockType;
        startTime = hourToMinutes(hour);
      } else if (blockType !== currentType) {
        // 타입이 바뀌면 이전 블록 저장
        blocks.push({
          dayOfWeek: toBackendDay(day),
          type: currentType,
          startTime: startTime!,
          endTime: hourToMinutes(hour),
        });

        // 새 블록 시작
        currentType = blockType;
        startTime = hourToMinutes(hour);
      }
    }

    // 마지막 블록 저장 (24시까지)
    if (currentType !== null && startTime !== null) {
      blocks.push({
        dayOfWeek: toBackendDay(day),
        type: currentType,
        startTime: startTime,
        endTime: hourToMinutes(24), // 1440분 (다음 날 00:00)
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

  // 모든 요일, 모든 시간을 null(TASK)로 초기화
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
    const startHour = minutesToHour(block.startTime);
    const endHour = minutesToHour(block.endTime);

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
 * - 시간 범위 유효성 (0-1440)
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
    dayBlocks.sort((a, b) => a.startTime - b.startTime);

    let expectedTime = 0;

    for (const block of dayBlocks) {
      // 시간 범위 검증
      if (block.startTime < 0 || block.startTime >= 1440) {
        return { valid: false, error: `Invalid startTime: ${block.startTime}` };
      }
      if (block.endTime <= 0 || block.endTime > 1440) {
        return { valid: false, error: `Invalid endTime: ${block.endTime}` };
      }

      // endTime > startTime 검증
      if (block.endTime <= block.startTime) {
        return { valid: false, error: 'endTime must be greater than startTime' };
      }

      // 공백 검증
      if (block.startTime !== expectedTime) {
        return {
          valid: false,
          error: `Time gap detected on ${day} at ${expectedTime} minutes`,
        };
      }

      expectedTime = block.endTime;
    }

    // 24시간 전체 커버 검증
    if (expectedTime !== 1440) {
      return {
        valid: false,
        error: `${day} does not cover full 24 hours (ends at ${expectedTime} minutes)`,
      };
    }
  }

  return { valid: true };
}
