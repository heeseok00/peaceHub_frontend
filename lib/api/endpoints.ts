/**
 * Real API Endpoints
 *
 * 백엔드와 실제로 통신하는 fetch 기반 API 함수들
 * Mock API (mockData.ts)와 교체하여 사용
 *
 * 환경 변수 USE_MOCK_API로 mock/real 전환
 */

import type { User, Room, WeeklySchedule, Preference } from '@/types';
import type {
  GetCurrentUserResponse,
  CreateRoomRequest,
  RoomResponse,
  JoinRoomRequest,
  PostScheduleRequest,
  GetScheduleResponse,
  API_BASE_URL as BASE_URL,
} from '@/types/api';
import {
  toBackendSchedule,
  fromBackendSchedule,
} from '@/lib/utils/apiTransformers';

// ==================== API Configuration ====================

/**
 * API Base URL (환경 변수 또는 기본값)
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

/**
 * Fetch 옵션 기본값 (credentials 포함)
 */
const DEFAULT_FETCH_OPTIONS: RequestInit = {
  credentials: 'include', // 쿠키 포함 (세션 인증용)
  headers: {
    'Content-Type': 'application/json',
  },
};

// ==================== Helper Functions ====================

/**
 * API 응답 처리 헬퍼
 * @param response Response 객체
 * @returns JSON 파싱된 데이터
 * @throws 에러 응답 시 예외 발생
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    // 에러 응답 처리
    const errorData = await response.json().catch(() => ({
      message: `HTTP ${response.status}: ${response.statusText}`,
    }));

    throw new Error(errorData.message || 'API request failed');
  }

  // 204 No Content 처리
  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

/**
 * GET 요청 헬퍼
 */
async function get<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...DEFAULT_FETCH_OPTIONS,
    method: 'GET',
  });

  return handleResponse<T>(response);
}

/**
 * POST 요청 헬퍼
 */
async function post<T, D = unknown>(endpoint: string, data?: D): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...DEFAULT_FETCH_OPTIONS,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });

  return handleResponse<T>(response);
}

/**
 * PUT 요청 헬퍼
 */
async function put<T, D = unknown>(endpoint: string, data: D): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...DEFAULT_FETCH_OPTIONS,
    method: 'PUT',
    body: JSON.stringify(data),
  });

  return handleResponse<T>(response);
}

/**
 * DELETE 요청 헬퍼
 */
async function del<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...DEFAULT_FETCH_OPTIONS,
    method: 'DELETE',
  });

  return handleResponse<T>(response);
}

// ==================== Authentication ====================

/**
 * Google OAuth 로그인 URL 가져오기
 * GET /api/auth/google
 */
export async function getGoogleAuthUrl(): Promise<string> {
  return `${API_BASE_URL}/auth/google`;
}

/**
 * 로그아웃
 * POST /api/auth/logout (구현되어 있다면)
 */
export async function logout(): Promise<void> {
  // 백엔드 로그아웃 API가 있다면 호출
  // await post('/auth/logout');

  // 프론트엔드 리디렉션
  window.location.href = '/login';
}

// ==================== User ====================

/**
 * 현재 로그인한 사용자 정보 조회
 * GET /api/users/me
 *
 * @returns User 객체 또는 null
 * @throws 401 Unauthorized - 로그인 필요
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await get<GetCurrentUserResponse>('/users/me');

    // Backend response → Frontend User 타입 변환
    return {
      id: response.id,
      email: response.email,
      profileImage: response.picture || '', // Google OAuth에서 제공될 수 있음
      realName: response.realName || response.name || '', // realName이 없으면 name 사용
      country: response.country || '',
      language: response.language || '',
      roomId: response.roomId ?? undefined,
      createdAt: response.createdAt,
    };
  } catch (error) {
    // 401 에러는 로그인 페이지로 리디렉션
    if (error instanceof Error && error.message.includes('need login')) {
      window.location.href = '/login';
      return null;
    }
    throw error;
  }
}

/**
 * 사용자 프로필 업데이트
 * PUT /api/users/profile
 */
export async function updateProfile(data: {
  realName: string;
  country: string;
  language: string;
}): Promise<User> {
  // 백엔드는 name 필드만 지원 (country, language 미지원)
  const requestBody = {
    name: data.realName,
  };

  const response = await put<GetCurrentUserResponse>('/users/profile', requestBody);

  return {
    id: response.id,
    email: response.email,
    profileImage: response.picture || '', // Google OAuth에서 제공될 수 있음
    realName: response.realName || response.name || '', // realName이 없으면 name 사용
    country: response.country || '',
    language: response.language || '',
    roomId: response.roomId ?? undefined,
    createdAt: response.createdAt,
  };
}

// ==================== Room ====================

/**
 * 방 생성
 * POST /api/rooms/
 */
export async function createRoom(name: string): Promise<Room> {
  const requestData: CreateRoomRequest = { name };
  const response = await post<RoomResponse>('/rooms', requestData);

  return {
    id: response.id,
    name: response.name,
    code: response.inviteCode,
    ownerId: response.ownerId,
    memberIds: [], // Backend doesn't provide this, fetch separately via getRoomMembers
    createdAt: response.createdAt,
  };
}

/**
 * 방 참여
 * POST /api/rooms/join
 */
export async function joinRoom(inviteCode: string): Promise<Room> {
  const requestData: JoinRoomRequest = { inviteCode };
  const response = await post<RoomResponse>('/rooms/join', requestData);

  return {
    id: response.id,
    name: response.name,
    code: response.inviteCode,
    ownerId: response.ownerId,
    memberIds: [], // Backend doesn't provide this, fetch separately via getRoomMembers
    createdAt: response.createdAt,
  };
}

/**
 * 내 방 정보 조회
 * GET /api/rooms/my (구현되어 있다면)
 */
export async function getMyRoom(): Promise<Room | null> {
  // TODO: 백엔드 API 엔드포인트 확인 필요
  try {
    const response = await get<RoomResponse>('/rooms/my');
    return {
      id: response.id,
      name: response.name,
      code: response.inviteCode,
      ownerId: response.ownerId,
      memberIds: [], // Backend doesn't provide this, fetch separately via getRoomMembers
      createdAt: response.createdAt,
    };
  } catch {
    return null;
  }
}

/**
 * 방 멤버 목록 조회
 * GET /api/rooms/:roomId/members (구현되어 있다면)
 */
export async function getRoomMembers(roomId: string): Promise<User[]> {
  // TODO: 백엔드 API 엔드포인트 확인 필요
  const response = await get<GetCurrentUserResponse[]>(`/rooms/${roomId}/members`);

  return response.map(user => ({
    id: user.id,
    email: user.email,
    profileImage: user.picture || '', // Google OAuth에서 제공될 수 있음
    realName: user.realName || user.name || '', // realName이 없으면 name 사용
    country: user.country || '',
    language: user.language || '',
    roomId: user.roomId ?? undefined,
    createdAt: user.createdAt,
  }));
}

// ==================== Schedule ====================

/**
 * 현재 주 스케줄 조회 (ACTIVE)
 * GET /api/schedules/ActiveSchedules
 */
export async function getActiveSchedule(): Promise<WeeklySchedule> {
  const response = await get<GetScheduleResponse>('/schedules/ActiveSchedules');

  console.log('🔍 [ACTIVE] Backend Response (raw):', response);
  console.log('🔍 [ACTIVE] Response type:', typeof response);
  console.log('🔍 [ACTIVE] Is array:', Array.isArray(response));
  console.log('🔍 [ACTIVE] Length:', Array.isArray(response) ? response.length : 'N/A');

  // Backend TimeBlock[] → Frontend WeeklySchedule 변환
  const converted = fromBackendSchedule(response);
  console.log('✅ [ACTIVE] Converted Schedule:', converted);
  console.log('✅ [ACTIVE] Sample (mon):', converted.mon);

  return converted;
}

/**
 * 다음 주 스케줄 조회 (TEMPORARY)
 * GET /api/schedules/TemporarySchedules
 */
export async function getTemporarySchedule(): Promise<WeeklySchedule> {
  const response = await get<GetScheduleResponse>('/schedules/TemporarySchedules');

  console.log('🔍 Backend Response (raw):', response);
  console.log('🔍 Response type:', typeof response);
  console.log('🔍 Is array:', Array.isArray(response));
  console.log('🔍 Length:', Array.isArray(response) ? response.length : 'N/A');

  // Backend TimeBlock[] → Frontend WeeklySchedule 변환
  const converted = fromBackendSchedule(response);
  console.log('✅ Converted Schedule:', converted);

  return converted;
}

/**
 * 스케줄 저장 (기본값: TEMPORARY)
 * POST /api/schedules
 */
export async function saveSchedule(schedule: WeeklySchedule): Promise<void> {
  // Frontend WeeklySchedule → Backend TimeBlock[] 변환
  const requestData: PostScheduleRequest = toBackendSchedule(schedule);

  await post<void, PostScheduleRequest>('/schedules', requestData);
}

// ==================== Preferences (TODO) ====================

/**
 * 내 선호도 조회
 * GET /api/preferences (구현되어 있다면)
 */
export async function getMyPreference(): Promise<Preference | null> {
  // TODO: 백엔드 API 명세 확인 필요
  return null;
}

/**
 * 선호도 저장
 * POST /api/preferences (구현되어 있다면)
 */
export async function savePreference(preference: Preference): Promise<void> {
  // TODO: 백엔드 API 명세 확인 필요
  await post('/preferences', preference);
}

// ==================== Assignments (TODO) ====================

/**
 * 현재 배정 조회
 * GET /api/assignments/current (구현되어 있다면)
 */
export async function getCurrentAssignments(): Promise<any> {
  // TODO: 백엔드 API 명세 확인 필요
  return null;
}

/**
 * 주차별 배정 조회
 * GET /api/assignments?weekStart=YYYY-MM-DD (구현되어 있다면)
 */
export async function getAssignmentsByWeek(weekStart: string): Promise<any> {
  // TODO: 백엔드 API 명세 확인 필요
  return null;
}

/**
 * 내 배정 조회
 * GET /api/assignments/my (구현되어 있다면)
 */
export async function getMyAssignments(): Promise<any[]> {
  // TODO: 백엔드 API 명세 확인 필요
  return [];
}
