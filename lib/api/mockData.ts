import type { User, Room, WeeklySchedule, Preference, Assignment, DayOfWeek } from '@/types';
import { TASKS } from '@/types';

// ============================================
// 더미 사용자 데이터
// ============================================

export const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'john@example.com',
    nickname: '존',
    profileImage: 'https://via.placeholder.com/100',
    roomId: 'room-1',
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'user-2',
    email: 'jane@example.com',
    nickname: '제인',
    profileImage: 'https://via.placeholder.com/100',
    roomId: 'room-1',
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'user-3',
    email: 'bob@example.com',
    nickname: '밥',
    profileImage: 'https://via.placeholder.com/100',
    roomId: 'room-1',
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'user-4',
    email: 'alice@example.com',
    nickname: '앨리스',
    profileImage: 'https://via.placeholder.com/100',
    roomId: 'room-1',
    createdAt: '2025-01-01T00:00:00Z',
  },
];

// 현재 로그인 사용자 (user-1)
export const currentUser = mockUsers[0];

// ============================================
// 더미 방 데이터
// ============================================

export const mockRoom: Room = {
  id: 'room-1',
  name: '301호',
  code: 'ABC123',
  ownerId: 'user-1',
  memberIds: ['user-1', 'user-2', 'user-3', 'user-4'],
  createdAt: '2025-01-01T00:00:00Z',
};

// ============================================
// 더미 주간 스케줄 (user-1)
// ============================================

// 기본 스케줄: 모든 시간대를 'free'로 초기화
const createEmptySchedule = (): WeeklySchedule => {
  const days: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const schedule: Partial<WeeklySchedule> = {};

  days.forEach(day => {
    const hours: { [hour: number]: 'free' } = {};
    for (let i = 0; i < 24; i++) {
      hours[i] = 'free';
    }
    schedule[day] = hours;
  });

  return schedule as WeeklySchedule;
};

export const mockWeeklySchedule: WeeklySchedule = (() => {
  const schedule = createEmptySchedule();

  // 평일 수면 시간 (0-7시)
  ['mon', 'tue', 'wed', 'thu', 'fri'].forEach(day => {
    for (let hour = 0; hour <= 7; hour++) {
      schedule[day as DayOfWeek][hour] = 'sleep';
    }
  });

  // 평일 조용한 시간 (8-9시, 공부 시간)
  ['mon', 'tue', 'wed', 'thu', 'fri'].forEach(day => {
    schedule[day as DayOfWeek][8] = 'quiet';
    schedule[day as DayOfWeek][9] = 'quiet';
  });

  // 평일 바쁜 시간 (10-18시, 수업/일)
  ['mon', 'tue', 'wed', 'thu', 'fri'].forEach(day => {
    for (let hour = 10; hour <= 18; hour++) {
      schedule[day as DayOfWeek][hour] = 'busy';
    }
  });

  // 주말 수면 시간 (0-9시)
  ['sat', 'sun'].forEach(day => {
    for (let hour = 0; hour <= 9; hour++) {
      schedule[day as DayOfWeek][hour] = 'sleep';
    }
  });

  return schedule;
})();

// ============================================
// 더미 선호도 데이터
// ============================================

export const mockPreferences: Preference[] = [
  {
    userId: 'user-1',
    roomId: 'room-1',
    first: 'dishes', // 1지망: 설거지
    second: 'room', // 2지망: 방 정리
    submittedAt: '2025-01-05T12:00:00Z',
  },
  {
    userId: 'user-2',
    roomId: 'room-1',
    first: 'trash',
    second: 'laundry',
    submittedAt: '2025-01-05T13:00:00Z',
  },
  {
    userId: 'user-3',
    roomId: 'room-1',
    first: 'bathroom',
    second: 'dishes',
    submittedAt: '2025-01-05T14:00:00Z',
  },
  {
    userId: 'user-4',
    roomId: 'room-1',
    first: 'laundry',
    second: 'trash',
    submittedAt: '2025-01-05T15:00:00Z',
  },
];

// ============================================
// 더미 배정 결과
// ============================================

export const mockAssignments: Assignment[] = [
  {
    id: 'assign-1',
    userId: 'user-1',
    roomId: 'room-1',
    taskId: 'dishes',
    days: ['mon', 'wed', 'fri'],
    weekStart: '2025-01-06', // 월요일 시작
    createdAt: '2025-01-06T03:00:00Z',
  },
  {
    id: 'assign-2',
    userId: 'user-2',
    roomId: 'room-1',
    taskId: 'trash',
    days: ['tue', 'thu'],
    weekStart: '2025-01-06',
    createdAt: '2025-01-06T03:00:00Z',
  },
  {
    id: 'assign-3',
    userId: 'user-3',
    roomId: 'room-1',
    taskId: 'bathroom',
    days: ['sat'],
    weekStart: '2025-01-06',
    createdAt: '2025-01-06T03:00:00Z',
  },
  {
    id: 'assign-4',
    userId: 'user-4',
    roomId: 'room-1',
    taskId: 'laundry',
    days: ['sun'],
    weekStart: '2025-01-06',
    createdAt: '2025-01-06T03:00:00Z',
  },
];

// Export TASKS for convenience
export { TASKS };
