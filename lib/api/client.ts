/**
 * API Client
 *
 * 현재는 더미 데이터를 반환하지만, 향후 백엔드 API와 연동 시
 * 이 파일의 함수들만 수정하면 됩니다.
 *
 * 백엔드 연동 시 수정 사항:
 * 1. BASE_URL을 실제 백엔드 주소로 변경
 * 2. 각 함수에서 fetch를 사용하여 실제 API 호출
 * 3. 인증 토큰(쿠키/세션) 처리 추가
 */

import type {
  User,
  Room,
  WeeklySchedule,
  Preference,
  Assignment,
  Task
} from '@/types';
import {
  currentUser,
  mockUsers,
  mockRoom,
  mockWeeklySchedule,
  mockPreferences,
  mockAssignments,
  mockAllSchedules,
  TASKS,
} from './mockData';
import * as endpoints from './endpoints';

// 백엔드 API URL
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';

// Feature flags for progressive integration
const USE_REAL_AUTH = process.env.NEXT_PUBLIC_USE_REAL_AUTH === 'true';
const USE_REAL_USER = process.env.NEXT_PUBLIC_USE_REAL_USER === 'true';
const USE_REAL_ROOM = process.env.NEXT_PUBLIC_USE_REAL_ROOM === 'true';
const USE_REAL_SCHEDULE = process.env.NEXT_PUBLIC_USE_REAL_SCHEDULE === 'true';

// ============================================
// 인증 관련 API
// ============================================

/**
 * Google OAuth 로그인 URL 가져오기
 * 백엔드 연동 시: GET /auth/google
 */
export async function getGoogleAuthUrl(): Promise<string> {
  if (USE_REAL_AUTH) {
    // 실제 백엔드 OAuth URL
    return `${BASE_URL}/auth/google`;
  }
  // Mock: 온보딩 프로필 페이지로 직접 이동
  return '/onboarding/profile';
}

/**
 * 현재 로그인한 사용자 정보 가져오기
 * 백엔드 연동 시: GET /users (쿠키/세션 기반)
 */
export async function getCurrentUser(): Promise<User | null> {
  if (USE_REAL_USER) {
    try {
      return await endpoints.getCurrentUser();
    } catch (error) {
      if (error instanceof Error && error.message === 'need login') {
        return null;
      }
      throw error;
    }
  }
  // Mock
  await delay(300);
  return currentUser;
}

/**
 * 로그아웃
 * 백엔드 연동 시: POST /auth/logout
 */
export async function logout(): Promise<void> {
  if (USE_REAL_AUTH) {
    await endpoints.logout();
    return;
  }
  // Mock
  await delay(300);
  // 쿠키 삭제 등
}

// ============================================
// 사용자 프로필 관련 API
// ============================================

/**
 * 프로필 정보 업데이트 (실명, 국가, 언어)
 * 백엔드 연동 시: PATCH /users/me
 */
export async function updateProfile(data: {
  realName: string;
  country: string;
  language: string;
}): Promise<User> {
  await delay(500);
  return { ...currentUser, ...data };
}

// ============================================
// 방(Room) 관련 API
// ============================================

/**
 * 방 생성
 * 백엔드 연동 시: POST /rooms
 */
export async function createRoom(name: string): Promise<Room> {
  await delay(500);
  return {
    ...mockRoom,
    name,
    code: generateRoomCode(),
  };
}

/**
 * 방 참여 (코드로)
 * 백엔드 연동 시: POST /rooms/join
 */
export async function joinRoom(code: string): Promise<Room> {
  await delay(500);
  return mockRoom;
}

/**
 * 내 방 정보 가져오기
 * 백엔드 연동 시: GET /rooms/my
 */
export async function getMyRoom(): Promise<Room | null> {
  await delay(300);
  return mockRoom;
}

/**
 * 방 멤버 목록 가져오기
 * 백엔드 연동 시: GET /rooms/:roomId/members
 */
export async function getRoomMembers(roomId: string): Promise<User[]> {
  await delay(300);
  return mockUsers;
}

// ============================================
// 타임테이블 관련 API
// ============================================

/**
 * 주간 스케줄 가져오기
 * 백엔드 연동 시: GET /schedules/my
 */
export async function getMySchedule(): Promise<WeeklySchedule> {
  await delay(300);
  return mockWeeklySchedule;
}

/**
 * 주간 스케줄 저장
 * 백엔드 연동 시: PUT /schedules/my
 */
export async function saveSchedule(schedule: WeeklySchedule): Promise<void> {
  await delay(500);
  // Mock: 실제로는 백엔드에 저장
}

/**
 * 모든 사용자의 스케줄 가져오기
 * 백엔드 연동 시: GET /schedules?userIds=id1,id2,...
 */
export async function getAllSchedules(userIds: string[]): Promise<Map<string, WeeklySchedule>> {
  await delay(300);
  const result = new Map<string, WeeklySchedule>();
  userIds.forEach(id => {
    const schedule = mockAllSchedules.get(id);
    if (schedule) {
      result.set(id, schedule);
    }
  });
  return result;
}

// ============================================
// 업무 선호도 관련 API
// ============================================

/**
 * 업무 목록 가져오기 (고정 데이터)
 */
export async function getTasks(): Promise<Task[]> {
  await delay(100);
  return TASKS;
}

/**
 * 내 선호도 가져오기
 * 백엔드 연동 시: GET /preferences/my
 */
export async function getMyPreference(): Promise<Preference | null> {
  await delay(300);
  return mockPreferences[0];
}

/**
 * 선호도 저장
 * 백엔드 연동 시: PUT /preferences/my
 */
export async function savePreference(first: string, second: string): Promise<void> {
  await delay(500);
  // Mock: 실제로는 백엔드에 저장
}

/**
 * 방의 모든 멤버 선호도 가져오기
 * 백엔드 연동 시: GET /preferences/room/:roomId
 */
export async function getRoomPreferences(roomId: string): Promise<Preference[]> {
  await delay(300);
  return mockPreferences.filter((p) => p.roomId === roomId);
}

// ============================================
// 배정 결과 관련 API
// ============================================

/**
 * 이번 주 배정 결과 가져오기
 * 백엔드 연동 시: GET /assignments/current
 */
export async function getCurrentAssignments(): Promise<Assignment[]> {
  await delay(300);
  return mockAssignments;
}

/**
 * 특정 주의 배정 결과 가져오기
 * 백엔드 연동 시: GET /assignments?weekStart=YYYY-MM-DD
 */
export async function getAssignmentsByWeek(weekStart: string): Promise<Assignment[]> {
  await delay(300);
  return mockAssignments;
}

/**
 * 내 배정 결과만 가져오기
 * 백엔드 연동 시: GET /assignments/my
 */
export async function getMyAssignments(): Promise<Assignment[]> {
  await delay(300);
  return mockAssignments.filter(a => a.userId === currentUser.id);
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 딜레이 함수 (더미 API 응답 시뮬레이션)
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 방 코드 생성 (6자리 영문+숫자)
 */
function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
