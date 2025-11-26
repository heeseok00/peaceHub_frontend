/**
 * Real API Endpoints
 *
 * 백엔드와 실제로 통신하는 fetch 기반 API 함수들
 */

import type { User, Room, WeeklySchedule, Preference, ScheduleBlock } from '@/types';
import type {
  GetCurrentUserResponse,
  CreateRoomRequest,
  RoomResponse,
  JoinRoomRequest,
  PostScheduleRequest,
  GetScheduleResponse,
  GetMemberDailyScheduleResponse,
  GetTasksResponse,
  RoomTaskWithPreferences,
  API_BASE_URL as BASE_URL,
} from '@/types/api';
import {
  toBackendSchedule,
  fromBackendSchedule,
  fromBackendScheduleBlocks,
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
 * 로그인 페이지로 리디렉션
 * 세션 만료 또는 인증 실패 시 사용
 */
function redirectToLogin(): never {
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
  throw new Error('need login');
}

/**
 * API 응답 처리 헬퍼
 * @param response Response 객체
 * @returns JSON 파싱된 데이터
 * @throws 에러 응답 시 예외 발생
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    // 401 Unauthorized - 로그인 페이지로 강제 리디렉션
    if (response.status === 401) {
      redirectToLogin();
    }

    // 403 Forbidden - 방 미참여 시 온보딩으로 리디렉션
    if (response.status === 403) {
      const errorData = await response.json().catch(() => ({ message: 'Forbidden' }));

      // "not participate in room" 에러인 경우 온보딩 페이지로 이동
      if (errorData.message === 'not participate in room') {
        if (typeof window !== 'undefined') {
          window.location.href = '/onboarding/join-room';
        }
        throw new Error('not participate in room');
      }

      // 기타 403 에러는 그대로 throw
      throw new Error(errorData.message || 'Forbidden');
    }

    // 기타 에러 응답 처리
    const errorData = await response.json().catch(() => ({
      message: `HTTP ${response.status}: ${response.statusText}`,
    }));

    throw new Error(errorData.message || 'API request failed');
  }

  // 204 No Content 처리
  if (response.status === 204) {
    return null as T;
  }

  // 201 Created인데 Body가 없는 경우 처리 (신규 유저 스케줄 저장)
  const contentType = response.headers.get('content-type');
  if (response.status === 201 && (!contentType || !contentType.includes('application/json'))) {
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
  redirectToLogin();
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
      workLoad: response.workLoad ?? 0, // 지난 주 업무 강도
      room: response.room, // 방 정보 (inviteCode, name)
      createdAt: response.createdAt,
    };
  } catch (error) {
    // 401 에러는 로그인 페이지로 리디렉션
    if (error instanceof Error && error.message.includes('need login')) {
      redirectToLogin();
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
    workLoad: response.workLoad ?? 0, // 지난 주 업무 강도
    room: response.room, // 방 정보
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
 * GET /api/rooms/:roomId/members
 */
export async function getRoomMembers(roomId: string): Promise<User[]> {
  try {
    const response = await get<GetCurrentUserResponse[]>(`/rooms/${roomId}/members`);

    return response.map(user => ({
      id: user.id,
      email: user.email,
      profileImage: user.picture || '',
      realName: user.realName || user.name || '',
      country: user.country || '',
      language: user.language || '',
      roomId: user.roomId ?? undefined,
      createdAt: user.createdAt,
    }));
  } catch (error) {
    // API 미구현 시 빈 배열 반환 (에러를 던지지 않음)
    // console.error('getRoomMembers 404: 백엔드 API 미구현');
    return [];
  }
}

// ==================== Schedule ====================

/**
 * 현재 주 스케줄 조회 (ACTIVE)
 * GET /api/schedules/activeSchedules
 */
export async function getActiveSchedule(): Promise<WeeklySchedule> {
  const response = await get<GetScheduleResponse>('/schedules/activeSchedules');

  // Backend TimeBlock[] → Frontend WeeklySchedule 변환
  const converted = fromBackendSchedule(response);

  return converted;
}

/**
 * 다음 주 스케줄 조회 (TEMPORARY)
 * GET /api/schedules/temporarySchedules
 */
export async function getTemporarySchedule(): Promise<WeeklySchedule> {
  const response = await get<GetScheduleResponse>('/schedules/temporarySchedules');

  // Backend TimeBlock[] → Frontend WeeklySchedule 변환
  const converted = fromBackendSchedule(response);

  return converted;
}

/**
 * 스케줄 저장 (기본값: TEMPORARY)
 * POST /api/schedules
 * @param schedule Frontend WeeklySchedule
 * @param weekStart 해당 주의 월요일 날짜 (YYYY-MM-DD 형식)
 */
export async function saveSchedule(schedule: WeeklySchedule, weekStart: string): Promise<void> {
  // Frontend WeeklySchedule → Backend TimeBlock[] 변환
  const requestData: PostScheduleRequest = toBackendSchedule(schedule, weekStart);

  await post<void, PostScheduleRequest>('/schedules', requestData);
}

/**
 * 날짜별 스케줄 조회 (ACTIVE + TEMPORARY + ScheduleHistory)
 * GET /api/schedules/daily?date=YYYY-MM-DD
 *
 * @param date 조회할 날짜 (YYYY-MM-DD 형식)
 * @returns WeeklySchedule (해당 날짜만 포함)
 */
export async function getDailySchedule(date: string): Promise<WeeklySchedule> {
  const response = await get<GetScheduleResponse>(`/schedules/daily?date=${date}`);

  // Backend TimeBlock[] → Frontend WeeklySchedule 변환
  const converted = fromBackendSchedule(response);

  return converted;
}

/**
 * 날짜별 멤버 스케줄 조회 (같은 방의 모든 멤버, QUIET + TASK만)
 * GET /api/schedules/memberDaily?date=YYYY-MM-DD
 *
 * @param date 조회할 날짜 (YYYY-MM-DD 형식)
 * @returns ScheduleBlock[] (업무 정보 포함, userId별로 그룹화되지 않음)
 */
export async function getMemberDailySchedule(date: string): Promise<ScheduleBlock[]> {
  try {
    const response = await get<GetMemberDailyScheduleResponse>(`/schedules/memberDaily?date=${date}`);

    // Backend TimeBlock[] → Frontend ScheduleBlock[] 변환 (업무 정보 포함)
    const converted = fromBackendScheduleBlocks(response);

    return converted;
  } catch (error) {
    // 에러 발생 시 빈 배열 반환
    return [];
  }
}

// ==================== Tasks ====================

/**
 * 업무 목록 및 선호도 조회
 * GET /api/tasks
 * 
 * @returns 방의 모든 업무 목록과 각 업무별 신청자 정보
 */
export async function getTasks(): Promise<RoomTaskWithPreferences[]> {
  const response = await get<GetTasksResponse>('/tasks');
  return response;
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
