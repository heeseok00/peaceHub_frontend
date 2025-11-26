/**
 * 집안일 관련 상수
 *
 * UI용 이모지 매핑과 헬퍼 함수들
 * 업무 목록은 백엔드 API (GET /api/tasks)에서 가져옵니다
 */

import type { TimeRange } from '@/types';

// ==================== Task 이모지 ====================

/**
 * 집안일 이모지 매핑
 *
 * 업무 ID와 이모지를 매핑하는 상수
 * DailyTasks, MonthlyCalendar 등에서 공통으로 사용
 */
export const TASK_EMOJIS: Record<string, string> = {
  bathroom: '🚽',
  trash: '🗑️',
  vacuum: '🧹',
  laundry: '👔',
  dishes: '🍽️',
};

// ==================== Task 권장 시간대 ====================

/**
 * 업무별 권장 시간대
 *
 * 각 집안일의 특성에 맞는 기본 수행 시간을 정의
 * - bathroom: 18-20시 (저녁)
 * - trash: 9-10시 (오전)
 * - vacuum: 15-17시 (오후)
 * - laundry: 19-21시 (저녁)
 * - dishes: 20-22시 (저녁)
 */
export const TASK_TIME_RANGES: Record<string, TimeRange> = {
  bathroom: { start: 18, end: 20 }, // 화장실 청소 - 저녁 6-8시
  trash: { start: 9, end: 10 }, // 쓰레기 버리기 - 오전 9-10시
  vacuum: { start: 15, end: 17 }, // 청소기 돌리기 - 오후 3-5시
  laundry: { start: 19, end: 21 }, // 빨래하기 - 저녁 7-9시
  dishes: { start: 20, end: 22 }, // 설거지 - 저녁 8-10시
};

// ==================== Helper Functions ====================

/**
 * 시간대 이름 반환
 * @param hour 시간 (0-23)
 * @returns 시간대 라벨 ('오전' | '오후' | '저녁' | '밤')
 */
export function getTimeOfDayLabel(hour: number): string {
  if (hour >= 6 && hour < 12) return '오전';
  if (hour >= 12 && hour < 18) return '오후';
  if (hour >= 18 && hour < 22) return '저녁';
  return '밤';
}

/**
 * 시간 범위를 한글로 포맷팅
 * @param start 시작 시간
 * @param end 종료 시간
 * @returns 포맷된 문자열 (예: "저녁 6-8시")
 */
export function formatTimeRange(start: number, end: number): string {
  const label = getTimeOfDayLabel(start);
  const startHour = start > 12 ? start - 12 : start === 0 ? 12 : start;
  const endHour = end > 12 ? end - 12 : end === 0 ? 12 : end;

  return `${label} ${startHour}-${endHour}시`;
}

/**
 * Task ID로 권장 시간대 가져오기
 * @param taskId Task ID
 * @returns TimeRange 또는 undefined
 */
export function getTaskTimeRange(taskId: string): TimeRange | undefined {
  return TASK_TIME_RANGES[taskId];
}

/**
 * Task ID로 이모지 가져오기
 * @param taskId Task ID
 * @returns 이모지 문자열 또는 기본값 '📋'
 */
export function getTaskEmoji(taskId: string): string {
  return TASK_EMOJIS[taskId] || '📋';
}

/**
 * Task ID로 전체 정보 가져오기 (이름, 이모지, 권장시간)
 * @param taskId Task ID
 * @param taskName Task 이름 (API에서 받은 데이터)
 * @returns Task 정보 객체
 */
export function getFullTaskInfo(taskId: string, taskName?: string) {
  return {
    id: taskId,
    name: taskName || taskId,
    emoji: getTaskEmoji(taskId),
    timeRange: getTaskTimeRange(taskId),
  };
}
