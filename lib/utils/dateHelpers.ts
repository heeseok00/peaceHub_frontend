import type { DayOfWeek } from '@/types';

/**
 * 주의 시작일(월요일) 계산
 * @param date 기준 날짜
 * @returns YYYY-MM-DD 형식의 월요일 날짜 문자열 (로컬 시간 기준)
 */
export function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 일요일인 경우 이전 주 월요일로
  d.setDate(diff);
  
  // 로컬 시간 기준으로 YYYY-MM-DD 형식 생성
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const dayStr = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${dayStr}`;
}

/**
 * 날짜에서 요일 추출 (월요일 기준)
 * @param date 기준 날짜
 * @returns DayOfWeek 타입의 요일
 */
export function getDayOfWeek(date: Date): DayOfWeek {
  // JavaScript의 getDay(): 0(일) ~ 6(토)
  // 월요일 기준으로 변환: 월=0, 화=1, ..., 일=6
  const days: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const jsDay = date.getDay(); // 0=일요일, 1=월요일, ..., 6=토요일
  const adjustedDay = jsDay === 0 ? 6 : jsDay - 1; // 일요일(0)을 6으로, 나머지는 -1
  return days[adjustedDay];
}

/**
 * ISO timestamp에서 로컬 시간 기준 요일 추출 (월요일 기준)
 * @param isoTimestamp ISO 8601 형식 문자열 (예: "2025-11-22T20:00:00.000Z")
 * @returns DayOfWeek 타입의 요일 (undefined인 경우 'mon' 반환)
 */
export function getDayOfWeekFromISO(isoTimestamp?: string): DayOfWeek {
  if (!isoTimestamp) return 'mon';
  
  const date = new Date(isoTimestamp);
  // getDayOfWeek 함수 재사용 (로컬 시간 기준)
  return getDayOfWeek(date);
}

/**
 * 날짜를 "YYYY.MM.DD" 형식으로 포맷
 * @param date 포맷할 날짜
 * @returns YYYY.MM.DD 형식의 문자열
 */
export function formatDateDots(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}.${month}.${day}`;
}

/**
 * 날짜를 "M월 D일" 형식으로 포맷
 * @param date 포맷할 날짜
 * @returns M월 D일 형식의 문자열
 */
export function formatDateKorean(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}월 ${day}일`;
}

/**
 * 날짜를 "YYYY년 M월" 형식으로 포맷
 * @param date 포맷할 날짜
 * @returns YYYY년 M월 형식의 문자열
 */
export function formatYearMonth(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return `${year}년 ${month}월`;
}

/**
 * ISO 날짜 문자열 (YYYY-MM-DD)을 Date 객체로 변환
 * @param isoDateStr YYYY-MM-DD 형식의 문자열
 * @returns Date 객체
 */
export function parseISODate(isoDateStr: string): Date {
  return new Date(isoDateStr + 'T00:00:00');
}

/**
 * 두 날짜가 같은 날인지 확인
 * @param date1 첫 번째 날짜
 * @param date2 두 번째 날짜
 * @returns 같은 날이면 true
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * 오늘 날짜인지 확인
 * @param date 확인할 날짜
 * @returns 오늘이면 true
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * 날짜에 일수를 더함
 * @param date 기준 날짜
 * @param days 더할 일수
 * @returns 새로운 Date 객체
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * 다음 일요일 23:59:59 계산 (배정 마감일)
 * @param fromDate 기준 날짜 (기본값: 오늘)
 * @returns 다음 일요일 23:59:59의 Date 객체
 */
export function getNextSunday(fromDate: Date = new Date()): Date {
  const d = new Date(fromDate);
  const day = d.getDay();
  const daysUntilSunday = day === 0 ? 7 : 7 - day;
  d.setDate(d.getDate() + daysUntilSunday);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * 남은 시간을 문자열로 포맷 (예: "2일 5시간 30분")
 * @param deadline 마감 시간
 * @returns 포맷된 남은 시간 문자열
 */
export function formatTimeRemaining(deadline: Date): string {
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();

  if (diff <= 0) return '마감';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}일`);
  if (hours > 0) parts.push(`${hours}시간`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}분`);

  return parts.join(' ');
}

/**
 * 다음 주의 시작일(월요일) 계산
 * @param date 기준 날짜 (기본값: 오늘)
 * @returns YYYY-MM-DD 형식의 다음 주 월요일 날짜 문자열
 */
export function getNextWeekStart(date: Date = new Date()): string {
  const weekStart = getWeekStart(date);
  // addDaysToDateString 사용하여 시간대 문제 방지
  return addDaysToDateString(weekStart, 7);
}

/**
 * YYYY-MM-DD 날짜 문자열과 시간(hour)을 ISO timestamp로 변환
 *
 * 주의: 로컬 시간을 그대로 UTC 형식으로 표현합니다.
 * 예) dateStr="2025-11-24", hour=9 → "2025-11-24T09:00:00.000Z"
 *
 * @param dateStr YYYY-MM-DD 형식 날짜
 * @param hour 시간 (0-23, 24는 다음 날 00시)
 * @returns ISO 8601 timestamp (UTC 형식)
 */
export function toISOTimestamp(dateStr: string, hour: number): string {
  // 24시는 다음 날 00시로 처리
  if (hour === 24) {
    const nextDateStr = addDaysToDateString(dateStr, 1);
    return `${nextDateStr}T00:00:00.000Z`;
  }

  const hourStr = hour.toString().padStart(2, '0');
  return `${dateStr}T${hourStr}:00:00.000Z`;
}

/**
 * ISO timestamp에서 시간(hour) 추출
 *
 * UTC 시간을 그대로 추출합니다 (타임존 변환 없음).
 *
 * @param isoTimestamp ISO 8601 형식 문자열 (undefined인 경우 0 반환)
 * @returns 시간 (0-23)
 */
export function hourFromISOTimestamp(isoTimestamp?: string): number {
  if (!isoTimestamp) return 0;
  
  // "2025-11-24T09:00:00.000Z" → 09
  const timePart = isoTimestamp.split('T')[1];
  const hour = parseInt(timePart.split(':')[0], 10);
  return hour;
}

/**
 * YYYY-MM-DD 날짜 문자열에 일수를 더함 (로컬 시간 기준)
 * @param dateStr YYYY-MM-DD 형식 날짜
 * @param days 더할 일수
 * @returns YYYY-MM-DD 형식의 새 날짜 문자열
 */
export function addDaysToDateString(dateStr: string, days: number): string {
  // 로컬 시간으로 파싱
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);

  // 로컬 날짜를 YYYY-MM-DD 형식으로 변환
  const resultYear = date.getFullYear();
  const resultMonth = String(date.getMonth() + 1).padStart(2, '0');
  const resultDay = String(date.getDate()).padStart(2, '0');
  return `${resultYear}-${resultMonth}-${resultDay}`;
}
