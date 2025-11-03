import type { User, Room, WeeklySchedule, Preference, Assignment, DayOfWeek } from '@/types';
import { TASKS } from '@/types';

// ============================================
// 더미 사용자 데이터
// ============================================

export const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'yang@example.com',
    realName: '양희석',
    country: 'KR',
    language: 'ko',
    profileImage: 'https://via.placeholder.com/100',
    roomId: 'room-1',
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'user-2',
    email: 'lee@example.com',
    realName: '이세용',
    country: 'KR',
    language: 'ko',
    profileImage: 'https://via.placeholder.com/100',
    roomId: 'room-1',
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'user-3',
    email: 'jung@example.com',
    realName: '정준영',
    country: 'KR',
    language: 'ko',
    profileImage: 'https://via.placeholder.com/100',
    roomId: 'room-1',
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'user-4',
    email: 'jo@example.com',
    realName: '조재현',
    country: 'KR',
    language: 'ko',
    profileImage: 'https://via.placeholder.com/100',
    roomId: 'room-1',
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'user-5',
    email: 'heo@example.com',
    realName: '허주환',
    country: 'KR',
    language: 'ko',
    profileImage: 'https://via.placeholder.com/100',
    roomId: 'room-1',
    createdAt: '2025-01-01T00:00:00Z',
  },
];

// 현재 로그인 사용자 (허주환)
export const currentUser = mockUsers[4];

// ============================================
// 더미 방 데이터
// ============================================

export const mockRoom: Room = {
  id: 'room-1',
  name: '301호',
  code: 'ABC123',
  ownerId: 'user-1',
  memberIds: ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'],
  createdAt: '2025-01-01T00:00:00Z',
};

// ============================================
// 더미 주간 스케줄 (user-1)
// ============================================

// 기본 스케줄: 모든 시간대를 null(비는 시간)로 초기화
const createEmptySchedule = (): WeeklySchedule => {
  const days: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const schedule: Partial<WeeklySchedule> = {};

  days.forEach(day => {
    const hours: { [hour: number]: null } = {};
    for (let i = 0; i < 24; i++) {
      hours[i] = null;
    }
    schedule[day] = hours;
  });

  return schedule as WeeklySchedule;
};

// User-5 (현재 사용자) 스케줄
export const mockWeeklySchedule: WeeklySchedule = (() => {
  const schedule = createEmptySchedule();

  // 평일 조용시간 (0-7시)
  ['mon', 'tue', 'wed', 'thu', 'fri'].forEach(day => {
    for (let hour = 0; hour <= 7; hour++) {
      schedule[day as DayOfWeek][hour] = 'quiet';
    }
  });

  // 평일 조용시간 (8-9시, 공부 시간)
  ['mon', 'tue', 'wed', 'thu', 'fri'].forEach(day => {
    schedule[day as DayOfWeek][8] = 'quiet';
    schedule[day as DayOfWeek][9] = 'quiet';
  });

  // 평일 외출 시간 (10-18시, 수업/일)
  ['mon', 'tue', 'wed', 'thu', 'fri'].forEach(day => {
    for (let hour = 10; hour <= 18; hour++) {
      schedule[day as DayOfWeek][hour] = 'out';
    }
  });

  // 주말 조용시간 (0-9시)
  ['sat', 'sun'].forEach(day => {
    for (let hour = 0; hour <= 9; hour++) {
      schedule[day as DayOfWeek][hour] = 'quiet';
    }
  });

  return schedule;
})();

// 모든 사용자의 스케줄 (겹침 테스트용)
export const mockAllSchedules: Map<string, WeeklySchedule> = new Map([
  // User-1: 양희석
  ['user-1', (() => {
    const schedule = createEmptySchedule();
    // 평일 조용시간 (0-8시)
    ['mon', 'tue', 'wed', 'thu', 'fri'].forEach(day => {
      for (let hour = 0; hour <= 8; hour++) {
        schedule[day as DayOfWeek][hour] = 'quiet';
      }
    });
    // 평일 외출 (9-17시)
    ['mon', 'tue', 'wed', 'thu', 'fri'].forEach(day => {
      for (let hour = 9; hour <= 17; hour++) {
        schedule[day as DayOfWeek][hour] = 'out';
      }
    });
    // 평일 조용시간 (18-23시)
    ['mon', 'tue', 'wed', 'thu', 'fri'].forEach(day => {
      for (let hour = 18; hour <= 23; hour++) {
        schedule[day as DayOfWeek][hour] = 'quiet';
      }
    });
    // 주말 조용시간 (0-10시)
    ['sat', 'sun'].forEach(day => {
      for (let hour = 0; hour <= 10; hour++) {
        schedule[day as DayOfWeek][hour] = 'quiet';
      }
    });
    return schedule;
  })()],

  // User-2: 이세용
  ['user-2', (() => {
    const schedule = createEmptySchedule();
    // 평일 조용시간 (0-7시, 20-23시)
    ['mon', 'tue', 'wed', 'thu', 'fri'].forEach(day => {
      for (let hour = 0; hour <= 7; hour++) {
        schedule[day as DayOfWeek][hour] = 'quiet';
      }
      for (let hour = 20; hour <= 23; hour++) {
        schedule[day as DayOfWeek][hour] = 'quiet';
      }
    });
    // 평일 외출 (8-19시)
    ['mon', 'tue', 'wed', 'thu', 'fri'].forEach(day => {
      for (let hour = 8; hour <= 19; hour++) {
        schedule[day as DayOfWeek][hour] = 'out';
      }
    });
    // 주말 조용시간 (0-11시, 22-23시)
    ['sat', 'sun'].forEach(day => {
      for (let hour = 0; hour <= 11; hour++) {
        schedule[day as DayOfWeek][hour] = 'quiet';
      }
      schedule[day as DayOfWeek][22] = 'quiet';
      schedule[day as DayOfWeek][23] = 'quiet';
    });
    return schedule;
  })()],

  // User-3: 정준영
  ['user-3', (() => {
    const schedule = createEmptySchedule();
    // 평일 조용시간 (0-6시, 19-23시)
    ['mon', 'tue', 'wed', 'thu', 'fri'].forEach(day => {
      for (let hour = 0; hour <= 6; hour++) {
        schedule[day as DayOfWeek][hour] = 'quiet';
      }
      for (let hour = 19; hour <= 23; hour++) {
        schedule[day as DayOfWeek][hour] = 'quiet';
      }
    });
    // 평일 외출 (10-18시)
    ['mon', 'tue', 'wed', 'thu', 'fri'].forEach(day => {
      for (let hour = 10; hour <= 18; hour++) {
        schedule[day as DayOfWeek][hour] = 'out';
      }
    });
    // 평일 조용시간 (7-9시)
    ['mon', 'tue', 'wed', 'thu', 'fri'].forEach(day => {
      schedule[day as DayOfWeek][7] = 'quiet';
      schedule[day as DayOfWeek][8] = 'quiet';
      schedule[day as DayOfWeek][9] = 'quiet';
    });
    // 주말 조용시간 (0-9시, 21-23시)
    ['sat', 'sun'].forEach(day => {
      for (let hour = 0; hour <= 9; hour++) {
        schedule[day as DayOfWeek][hour] = 'quiet';
      }
      for (let hour = 21; hour <= 23; hour++) {
        schedule[day as DayOfWeek][hour] = 'quiet';
      }
    });
    return schedule;
  })()],

  // User-4: 조재현
  ['user-4', (() => {
    const schedule = createEmptySchedule();
    // 평일 조용시간 (0-8시)
    ['mon', 'tue', 'wed', 'thu', 'fri'].forEach(day => {
      for (let hour = 0; hour <= 8; hour++) {
        schedule[day as DayOfWeek][hour] = 'quiet';
      }
    });
    // 평일 외출 (9-16시)
    ['mon', 'tue', 'wed', 'thu', 'fri'].forEach(day => {
      for (let hour = 9; hour <= 16; hour++) {
        schedule[day as DayOfWeek][hour] = 'out';
      }
    });
    // 평일 조용시간 (17-23시)
    ['mon', 'tue', 'wed', 'thu', 'fri'].forEach(day => {
      for (let hour = 17; hour <= 23; hour++) {
        schedule[day as DayOfWeek][hour] = 'quiet';
      }
    });
    // 주말 조용시간 (종일)
    ['sat', 'sun'].forEach(day => {
      for (let hour = 0; hour <= 23; hour++) {
        schedule[day as DayOfWeek][hour] = 'quiet';
      }
    });
    return schedule;
  })()],

  // User-5: 허주환 (현재 사용자)
  ['user-5', mockWeeklySchedule],
]);

// ============================================
// 더미 선호도 데이터
// ============================================

export const mockPreferences: Preference[] = [
  {
    userId: 'user-1',
    roomId: 'room-1',
    first: 'bathroom',
    second: 'trash',
    submittedAt: '2025-01-05T12:00:00Z',
  },
  {
    userId: 'user-2',
    roomId: 'room-1',
    first: 'laundry',
    second: 'room',
    submittedAt: '2025-01-05T13:00:00Z',
  },
  {
    userId: 'user-3',
    roomId: 'room-1',
    first: 'dishes',
    second: 'trash',
    submittedAt: '2025-01-05T14:00:00Z',
  },
  {
    userId: 'user-4',
    roomId: 'room-1',
    first: 'trash',
    second: 'room',
    submittedAt: '2025-01-05T15:00:00Z',
  },
  {
    userId: 'user-5',
    roomId: 'room-1',
    first: 'dishes',
    second: 'laundry',
    submittedAt: '2025-01-05T16:00:00Z',
  },
];

// ============================================
// 더미 배정 결과
// ============================================

export const mockAssignments: Assignment[] = [
  // 1주차: 2024-12-30 ~ 2025-01-05
  {
    id: 'assign-1-1',
    userId: 'user-1',
    roomId: 'room-1',
    taskId: 'bathroom',
    days: ['mon', 'sat'],
    weekStart: '2024-12-30',
    createdAt: '2024-12-30T03:00:00Z',
  },
  {
    id: 'assign-1-2',
    userId: 'user-2',
    roomId: 'room-1',
    taskId: 'laundry',
    days: ['mon', 'sun'],
    weekStart: '2024-12-30',
    createdAt: '2024-12-30T03:00:00Z',
  },
  {
    id: 'assign-1-3',
    userId: 'user-3',
    roomId: 'room-1',
    taskId: 'dishes',
    days: ['mon', 'wed', 'fri'],
    weekStart: '2024-12-30',
    createdAt: '2024-12-30T03:00:00Z',
  },
  {
    id: 'assign-1-4',
    userId: 'user-4',
    roomId: 'room-1',
    taskId: 'trash',
    days: ['tue', 'thu', 'fri'],
    weekStart: '2024-12-30',
    createdAt: '2024-12-30T03:00:00Z',
  },
  {
    id: 'assign-1-5',
    userId: 'user-5',
    roomId: 'room-1',
    taskId: 'room',
    days: ['mon', 'wed', 'fri'],
    weekStart: '2024-12-30',
    createdAt: '2024-12-30T03:00:00Z',
  },

  // 2주차: 2025-01-06 ~ 2025-01-12
  {
    id: 'assign-2-1',
    userId: 'user-1',
    roomId: 'room-1',
    taskId: 'trash',
    days: ['mon', 'wed', 'thu'],
    weekStart: '2025-01-06',
    createdAt: '2025-01-06T03:00:00Z',
  },
  {
    id: 'assign-2-2',
    userId: 'user-2',
    roomId: 'room-1',
    taskId: 'room',
    days: ['tue', 'wed', 'thu'],
    weekStart: '2025-01-06',
    createdAt: '2025-01-06T03:00:00Z',
  },
  {
    id: 'assign-2-3',
    userId: 'user-3',
    roomId: 'room-1',
    taskId: 'laundry',
    days: ['wed', 'thu', 'sat'],
    weekStart: '2025-01-06',
    createdAt: '2025-01-06T03:00:00Z',
  },
  {
    id: 'assign-2-4',
    userId: 'user-4',
    roomId: 'room-1',
    taskId: 'bathroom',
    days: ['tue', 'thu', 'sat'],
    weekStart: '2025-01-06',
    createdAt: '2025-01-06T03:00:00Z',
  },
  {
    id: 'assign-2-5',
    userId: 'user-5',
    roomId: 'room-1',
    taskId: 'dishes',
    days: ['tue', 'wed', 'thu', 'fri', 'sun'],
    weekStart: '2025-01-06',
    createdAt: '2025-01-06T03:00:00Z',
  },

  // 3주차: 2025-01-13 ~ 2025-01-19
  {
    id: 'assign-3-1',
    userId: 'user-1',
    roomId: 'room-1',
    taskId: 'dishes',
    days: ['mon', 'tue', 'thu'],
    weekStart: '2025-01-13',
    createdAt: '2025-01-13T03:00:00Z',
  },
  {
    id: 'assign-3-2',
    userId: 'user-2',
    roomId: 'room-1',
    taskId: 'bathroom',
    days: ['mon', 'tue', 'sun'],
    weekStart: '2025-01-13',
    createdAt: '2025-01-13T03:00:00Z',
  },
  {
    id: 'assign-3-3',
    userId: 'user-3',
    roomId: 'room-1',
    taskId: 'trash',
    days: ['tue', 'wed', 'fri'],
    weekStart: '2025-01-13',
    createdAt: '2025-01-13T03:00:00Z',
  },
  {
    id: 'assign-3-4',
    userId: 'user-4',
    roomId: 'room-1',
    taskId: 'room',
    days: ['tue', 'wed', 'sat'],
    weekStart: '2025-01-13',
    createdAt: '2025-01-13T03:00:00Z',
  },
  {
    id: 'assign-3-5',
    userId: 'user-5',
    roomId: 'room-1',
    taskId: 'laundry',
    days: ['mon', 'tue', 'thu', 'fri'],
    weekStart: '2025-01-13',
    createdAt: '2025-01-13T03:00:00Z',
  },

  // 4주차: 2025-01-20 ~ 2025-01-26
  {
    id: 'assign-4-1',
    userId: 'user-1',
    roomId: 'room-1',
    taskId: 'room',
    days: ['mon', 'wed', 'fri'],
    weekStart: '2025-01-20',
    createdAt: '2025-01-20T03:00:00Z',
  },
  {
    id: 'assign-4-2',
    userId: 'user-2',
    roomId: 'room-1',
    taskId: 'dishes',
    days: ['mon', 'wed', 'sat'],
    weekStart: '2025-01-20',
    createdAt: '2025-01-20T03:00:00Z',
  },
  {
    id: 'assign-4-3',
    userId: 'user-3',
    roomId: 'room-1',
    taskId: 'bathroom',
    days: ['wed', 'fri', 'sun'],
    weekStart: '2025-01-20',
    createdAt: '2025-01-20T03:00:00Z',
  },
  {
    id: 'assign-4-4',
    userId: 'user-4',
    roomId: 'room-1',
    taskId: 'laundry',
    days: ['tue', 'wed', 'fri'],
    weekStart: '2025-01-20',
    createdAt: '2025-01-20T03:00:00Z',
  },
  {
    id: 'assign-4-5',
    userId: 'user-5',
    roomId: 'room-1',
    taskId: 'trash',
    days: ['mon', 'wed', 'thu', 'sat'],
    weekStart: '2025-01-20',
    createdAt: '2025-01-20T03:00:00Z',
  },

  // 5주차: 2025-01-27 ~ 2025-02-02
  {
    id: 'assign-5-1',
    userId: 'user-1',
    roomId: 'room-1',
    taskId: 'laundry',
    days: ['tue', 'wed', 'fri'],
    weekStart: '2025-01-27',
    createdAt: '2025-01-27T03:00:00Z',
  },
  {
    id: 'assign-5-2',
    userId: 'user-2',
    roomId: 'room-1',
    taskId: 'trash',
    days: ['mon', 'tue', 'thu'],
    weekStart: '2025-01-27',
    createdAt: '2025-01-27T03:00:00Z',
  },
  {
    id: 'assign-5-3',
    userId: 'user-3',
    roomId: 'room-1',
    taskId: 'room',
    days: ['tue', 'thu', 'fri'],
    weekStart: '2025-01-27',
    createdAt: '2025-01-27T03:00:00Z',
  },
  {
    id: 'assign-5-4',
    userId: 'user-4',
    roomId: 'room-1',
    taskId: 'dishes',
    days: ['mon', 'tue', 'wed', 'sun'],
    weekStart: '2025-01-27',
    createdAt: '2025-01-27T03:00:00Z',
  },
  {
    id: 'assign-5-5',
    userId: 'user-5',
    roomId: 'room-1',
    taskId: 'bathroom',
    days: ['mon', 'tue', 'fri', 'sat'],
    weekStart: '2025-01-27',
    createdAt: '2025-01-27T03:00:00Z',
  },
];

// Export TASKS for convenience
export { TASKS };
