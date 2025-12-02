// ============================================
// 타임테이블 관련 타입
// ============================================

// 시간대 상태: 조용시간, 외출 (null = 비는 시간)
export type TimeSlot = 'quiet' | 'out' | null;

// 요일 타입
export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

// 요일 한글 이름 매핑
export const DAY_NAMES: Record<DayOfWeek, string> = {
  mon: '월',
  tue: '화',
  wed: '수',
  thu: '목',
  fri: '금',
  sat: '토',
  sun: '일',
};

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
  realName: string; // 실명
  country: string; // 국가 코드 (예: KR, US, JP)
  language: string; // 언어 코드 (예: ko, en, ja)
  nickname?: string; // 닉네임 (선택)
  profileImage?: string;
  roomId?: string;
  workLoad?: number; // 지난 주 업무 강도 (기본값 0)
  room?: {
    // 방 정보 (roomId가 있을 경우)
    inviteCode: string; // 초대 코드
    name: string; // 방 이름
  };
  createdAt: string;
}

// 지원 국가 목록
export const COUNTRIES = [
  { code: 'KR', name: '대한민국 (South Korea)' },
  { code: 'US', name: '미국 (United States)' },
  { code: 'JP', name: '일본 (Japan)' },
  { code: 'CN', name: '중국 (China)' },
  { code: 'GB', name: '영국 (United Kingdom)' },
  { code: 'FR', name: '프랑스 (France)' },
  { code: 'DE', name: '독일 (Germany)' },
  { code: 'CA', name: '캐나다 (Canada)' },
  { code: 'AU', name: '호주 (Australia)' },
  { code: 'IN', name: '인도 (India)' },
  { code: 'VN', name: '베트남 (Vietnam)' },
  { code: 'TH', name: '태국 (Thailand)' },
] as const;

// 지원 언어 목록
export const LANGUAGES = [
  { code: 'ko', name: '한국어 (Korean)' },
  { code: 'en', name: '영어 (English)' },
  { code: 'ja', name: '일본어 (Japanese)' },
  { code: 'zh', name: '중국어 (Chinese)' },
  { code: 'es', name: '스페인어 (Spanish)' },
  { code: 'fr', name: '프랑스어 (French)' },
  { code: 'de', name: '독일어 (German)' },
  { code: 'vi', name: '베트남어 (Vietnamese)' },
  { code: 'th', name: '태국어 (Thai)' },
  { code: 'hi', name: '힌디어 (Hindi)' },
] as const;

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

// 업무 목록은 백엔드 API에서 가져옵니다 (GET /api/tasks)

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

// 시간 범위 (0-23시)
export interface TimeRange {
  start: number; // 시작 시간 (0-23)
  end: number; // 종료 시간 (0-23)
}

export interface Assignment {
  id: string;
  userId: string;
  roomId: string;
  taskId: string;
  days: DayOfWeek[]; // 배정된 요일들
  timeRange?: TimeRange; // 업무 수행 시간대
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

// ============================================
// 스케줄 블록 관련 타입 (백엔드 대응)
// ============================================

/**
 * 스케줄 블록 상태
 * - ACTIVE: 현재 주 (적용 중)
 * - TEMPORARY: 다음 주 (임시 저장)
 */
export type ScheduleStatus = 'ACTIVE' | 'TEMPORARY';

/**
 * 스케줄 블록 타입
 * - quiet: 조용시간
 * - out: 외출/바쁜 시간
 * - task: 배정된 업무 시간
 * - null: 빈 시간
 */
export type ScheduleBlockType = 'quiet' | 'out' | 'task' | null;

/**
 * 스케줄 블록 (백엔드 ScheduleBlock에 대응)
 *
 * 주간 스케줄의 개별 블록 정보
 */
export interface ScheduleBlock {
  id: string;
  type: ScheduleBlockType; // 블록 타입
  startTime: string; // ISO 8601 timestamp
  endTime: string; // ISO 8601 timestamp
  status: ScheduleStatus; // ACTIVE | TEMPORARY
  userId: string;
  userName?: string; // 사용자 이름 (user.name)
  // TASK 타입일 경우의 업무 정보
  taskInfo?: {
    roomTaskId: string;
    title: string; // 업무 이름
    difficulty: number; // 업무 난이도
  };
}

/**
 * 스케줄 히스토리 (지난 날짜의 스케줄)
 *
 * 백엔드 ScheduleHistory에 대응
 */
export interface ScheduleHistory {
  id: string;
  type: ScheduleBlockType; // 블록 타입
  startTime: string; // ISO 8601 timestamp
  endTime: string; // ISO 8601 timestamp
  userId: string;
  // TASK 타입일 경우의 업무 정보
  taskInfo?: {
    roomTaskId: string;
    title: string; // 업무 이름
    difficulty: number; // 업무 난이도
  };
}

// ============================================
// 방별 업무 관련 타입
// ============================================

/**
 * 방별 업무
 * 템플릿에서 복사된 실제 방 업무
 */
export interface RoomTask {
  id: string;
  title: string;
  difficulty: number; // knapsack 가치
  estimatedTime: number; // knapsack 용량 (분 단위)
  roomId: string;
}

/**
 * 업무 선호도
 * 사용자가 선택한 1지망, 2지망 정보
 */
export interface TaskPreference {
  id: string;
  priority: number; // 1: 1지망, 2: 2지망
  userId: string;
  taskId: string; // RoomTask ID
  task?: RoomTask; // 업무 정보 (조회 시 포함될 수 있음)
}
