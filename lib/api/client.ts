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
import { saveUserLocalData, getUserLocalData } from '@/lib/utils/userStorage';

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
      const user = await endpoints.getCurrentUser();

      if (user) {
        // localStorage에서 추가 정보 조회 (country, language)
        const localData = getUserLocalData(user.id);
        if (localData) {
          user.country = localData.country;
          user.language = localData.language;
        }
      }

      return user;
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
 * 백엔드 연동 시: PUT /users
 */
export async function updateProfile(data: {
  realName: string;
  country: string;
  language: string;
}): Promise<User> {
  if (USE_REAL_USER) {
    try {
      // 백엔드에 realName만 업데이트 (country, language는 아직 미지원)
      const user = await endpoints.updateProfile(data);

      // country, language는 localStorage에 저장
      saveUserLocalData(user.id, {
        country: data.country,
        language: data.language,
      });

      // 반환 시 localStorage 데이터 포함
      return {
        ...user,
        country: data.country,
        language: data.language,
      };
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  }

  // Mock
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
  if (USE_REAL_ROOM) {
    return await endpoints.createRoom(name);
  }
  // Mock
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
  if (USE_REAL_ROOM) {
    return await endpoints.joinRoom(code);
  }
  // Mock
  await delay(500);
  return mockRoom;
}

/**
 * 내 방 정보 가져오기
 * 백엔드 연동 시: GET /rooms/my
 */
export async function getMyRoom(): Promise<Room | null> {
  if (USE_REAL_ROOM) {
    return await endpoints.getMyRoom();
  }
  // Mock
  await delay(300);
  return mockRoom;
}

/**
 * 방 멤버 목록 가져오기
 * 백엔드 연동 시: GET /rooms/:roomId/members
 * TODO: 백엔드 API 미구현 - Mock 사용 중
 */
export async function getRoomMembers(roomId: string): Promise<User[]> {
  // 백엔드 API 미구현으로 임시 Mock 사용
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
  if (USE_REAL_SCHEDULE) {
    return await endpoints.getMySchedule();
  }
  // Mock
  await delay(300);
  return mockWeeklySchedule;
}

/**
 * 주간 스케줄 저장
 * 백엔드 연동 시: PUT /schedules/my
 */
export async function saveSchedule(schedule: WeeklySchedule): Promise<void> {
  if (USE_REAL_SCHEDULE) {
    return await endpoints.saveSchedule(schedule);
  }
  // Mock: 실제로는 백엔드에 저장
  await delay(500);
}

/**
 * 모든 사용자의 스케줄 가져오기
 * 백엔드 연동 시: GET /schedules?userIds=id1,id2,...
 */
export async function getAllSchedules(userIds: string[]): Promise<Map<string, WeeklySchedule>> {
  if (USE_REAL_SCHEDULE) {
    // Real API는 userIds 파라미터 없이 room의 모든 멤버 스케줄 반환
    const schedules = await endpoints.getAllSchedules();
    // Record를 Map으로 변환
    const result = new Map<string, WeeklySchedule>();
    Object.entries(schedules).forEach(([userId, schedule]) => {
      result.set(userId, schedule);
    });
    return result;
  }
  // Mock
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
