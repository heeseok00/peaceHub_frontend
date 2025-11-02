// ============================================
// 타임테이블 관련 타입
// ============================================

// 시간대 상태: 조용, 수면, 바쁨, 비는 시간
export type TimeSlot = 'quiet' | 'sleep' | 'busy' | 'free';

// 요일 타입
export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

// 시간대별 스케줄 (0-23시)
export type HourlySchedule = {
  [hour: number]: TimeSlot;
};

// 주간 스케줄
export type WeeklySchedule = {
  [day in DayOfWeek]: HourlySchedule;
};

// ============================================
// 사용자 관련 타입
// ============================================

export interface User {
  id: string;
  email: string;
  nickname: string;
  profileImage?: string;
  roomId?: string;
  createdAt: string;
}

// ============================================
// 방(Room) 관련 타입
// ============================================

export interface Room {
  id: string;
  name: string;
  code: string; // 방 참여 코드
  ownerId: string;
  memberIds: string[];
  createdAt: string;
}

// ============================================
// 업무(Task) 관련 타입
// ============================================

export interface Task {
  id: string;
  name: string;
  weight: number; // 업무 난이도 가중치
  description?: string;
}

// 고정된 업무 목록
export const TASKS: Task[] = [
  { id: 'bathroom', name: '화장실 청소', weight: 9 },
  { id: 'trash', name: '쓰레기 버리기', weight: 5 },
  { id: 'room', name: '방 정리', weight: 3 },
  { id: 'laundry', name: '빨래하기', weight: 3 },
  { id: 'dishes', name: '설거지', weight: 2 },
];

// ============================================
// 업무 선호도 관련 타입
// ============================================

export interface Preference {
  userId: string;
  roomId: string;
  first: string; // 1지망 task id
  second: string; // 2지망 task id
  submittedAt: string;
}

// ============================================
// 업무 배정 관련 타입
// ============================================

export interface Assignment {
  id: string;
  userId: string;
  roomId: string;
  taskId: string;
  days: DayOfWeek[]; // 배정된 요일들
  weekStart: string; // 주의 시작 날짜 (ISO string)
  createdAt: string;
}

// 주간 배정 결과 (모든 멤버)
export interface WeeklyAssignment {
  weekStart: string;
  roomId: string;
  assignments: Assignment[];
  createdAt: string;
}

// ============================================
// UI 상태 관련 타입
// ============================================

export interface TimeTableCellState {
  day: DayOfWeek;
  hour: number;
  status: TimeSlot;
}

// 캘린더 이벤트 (배정 결과 표시용)
export interface CalendarEvent {
  date: string; // YYYY-MM-DD
  taskName: string;
  taskId: string;
}
