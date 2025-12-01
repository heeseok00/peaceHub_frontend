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
  PostTaskPreferenceRequest,
  PostTaskPreferencesResponse,
  MemberTaskSchedule,
  GetMemberTaskScheduleResponse,
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
 * API 호출 시작 로깅
 * @param method API 카테고리 (Schedule, Task 등)
 * @param endpoint API 엔드포인트
 * @param params 요청 파라미터 (선택)
 * @returns 시작 시간 (timestamp)
 */
function logApiCall(method: string, endpoint: string, params?: unknown): number {
  const timestamp = Date.now();
  console.log(`[${method} API] ${endpoint} - Start`, params ? { params } : '');
  return timestamp;
}

/**
 * API 호출 성공 로깅
 * @param method API 카테고리
 * @param endpoint API 엔드포인트
 * @param startTime 시작 시간
 * @param data 응답 데이터
 */
function logApiSuccess(method: string, endpoint: string, startTime: number, data: unknown): void {
  const duration = Date.now() - startTime;
  const size = Array.isArray(data) ? data.length : (data ? 1 : 0);
  console.log(`[${method} API] ${endpoint} - Success (${duration}ms, ${size} items)`);
}

/**
 * API 호출 실패 로깅
 * @param method API 카테고리
 * @param endpoint API 엔드포인트
 * @param error 에러 객체
 */
function logApiError(method: string, endpoint: string, error: unknown): void {
  console.error(`[${method} API] ${endpoint} - Error`, error);
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
 * GET /api/rooms/my
 */
export async function getMyRoom(): Promise<Room | null> {
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
  const startTime = logApiCall('Schedule', 'GET /schedules/activeSchedules');

  try {
    const response = await get<GetScheduleResponse>('/schedules/activeSchedules');

    // Backend TimeBlock[] → Frontend WeeklySchedule 변환
    const converted = fromBackendSchedule(response);

    logApiSuccess('Schedule', 'GET /schedules/activeSchedules', startTime, response);
    return converted;
  } catch (error) {
    logApiError('Schedule', 'GET /schedules/activeSchedules', error);
    throw error;
  }
}

/**
 * 다음 주 스케줄 조회 (TEMPORARY)
 * GET /api/schedules/temporarySchedules
 */
export async function getTemporarySchedule(): Promise<WeeklySchedule> {
  const startTime = logApiCall('Schedule', 'GET /schedules/temporarySchedules');

  try {
    const response = await get<GetScheduleResponse>('/schedules/temporarySchedules');

    // Backend TimeBlock[] → Frontend WeeklySchedule 변환
    const converted = fromBackendSchedule(response);

    logApiSuccess('Schedule', 'GET /schedules/temporarySchedules', startTime, response);
    return converted;
  } catch (error) {
    logApiError('Schedule', 'GET /schedules/temporarySchedules', error);
    throw error;
  }
}

/**
 * 스케줄 저장 (기본값: TEMPORARY)
 * POST /api/schedules
 * @param schedule Frontend WeeklySchedule
 * @param weekStart 해당 주의 월요일 날짜 (YYYY-MM-DD 형식)
 */
export async function saveSchedule(schedule: WeeklySchedule, weekStart: string): Promise<void> {
  const startTime = logApiCall('Schedule', 'POST /schedules', { weekStart });

  try {
    // Frontend WeeklySchedule → Backend TimeBlock[] 변환
    const requestData: PostScheduleRequest = toBackendSchedule(schedule, weekStart);

    console.log(`[Schedule API] POST /schedules - Sending ${requestData.length} blocks for week ${weekStart}`);

    await post<void, PostScheduleRequest>('/schedules', requestData);

    logApiSuccess('Schedule', 'POST /schedules', startTime, requestData);
  } catch (error) {
    logApiError('Schedule', 'POST /schedules', error);
    throw error;
  }
}

/**
 * 날짜별 스케줄 조회 (ACTIVE + TEMPORARY + ScheduleHistory)
 * GET /api/schedules/daily?date=YYYY-MM-DD
 *
 * @param date 조회할 날짜 (YYYY-MM-DD 형식)
 * @returns WeeklySchedule (해당 날짜만 포함)
 */
export async function getDailySchedule(date: string): Promise<WeeklySchedule> {
  const startTime = logApiCall('Schedule', 'GET /schedules/daily', { date });

  try {
    const response = await get<GetScheduleResponse>(`/schedules/daily?date=${date}`);

    // Backend TimeBlock[] → Frontend WeeklySchedule 변환
    const converted = fromBackendSchedule(response);

    logApiSuccess('Schedule', 'GET /schedules/daily', startTime, response);
    return converted;
  } catch (error) {
    logApiError('Schedule', 'GET /schedules/daily', error);
    throw error;
  }
}

/**
 * 날짜별 멤버 스케줄 조회 (같은 방의 모든 멤버, QUIET + TASK만)
 * GET /api/schedules/memberDaily?date=YYYY-MM-DD
 *
 * @param date 조회할 날짜 (YYYY-MM-DD 형식)
 * @returns ScheduleBlock[] (업무 정보 포함, userId별로 그룹화되지 않음)
 */
export async function getMemberDailySchedule(date: string): Promise<ScheduleBlock[]> {
  const startTime = logApiCall('Schedule', 'GET /schedules/memberDaily', { date });

  try {
    const response = await get<GetMemberDailyScheduleResponse>(`/schedules/memberDaily?date=${date}`);

    // Backend TimeBlock[] → Frontend ScheduleBlock[] 변환 (업무 정보 포함)
    const converted = fromBackendScheduleBlocks(response);

    logApiSuccess('Schedule', 'GET /schedules/memberDaily', startTime, response);
    console.log(`[Schedule API] GET /schedules/memberDaily - Converted ${converted.length} blocks for ${date}`);

    return converted;
  } catch (error) {
    console.warn(`[Schedule API] GET /schedules/memberDaily - Failed for ${date}, returning empty array`, error);
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
  const startTime = logApiCall('Task', 'GET /tasks');

  try {
    const response = await get<GetTasksResponse>('/tasks');

    const tasksWithPrefs = response.filter(t => t.preferences.length > 0).length;
    console.log(`[Task API] GET /tasks - Success (${response.length} tasks, ${tasksWithPrefs} with preferences)`);
    logApiSuccess('Task', 'GET /tasks', startTime, response);

    return response;
  } catch (error) {
    logApiError('Task', 'GET /tasks', error);
    throw error;
  }
}

/**
 * 업무 선호도 제출
 * POST /api/tasks/preferences
 *
 * @param preferences 1지망, 2지망 선호도 배열
 * @returns 저장된 선호도 정보
 */
export async function saveTaskPreferences(
  preferences: PostTaskPreferenceRequest[]
): Promise<PostTaskPreferencesResponse> {
  const startTime = logApiCall('Task', 'POST /tasks/preferences', {
    count: preferences.length,
    priorities: preferences.map(p => p.priority)
  });

  try {
    const response = await post<PostTaskPreferencesResponse>('/tasks/preferences', preferences);

    console.log(`[Task API] POST /tasks/preferences - Saved ${response.length} preferences`);
    logApiSuccess('Task', 'POST /tasks/preferences', startTime, response);

    return response;
  } catch (error) {
    logApiError('Task', 'POST /tasks/preferences', error);
    throw error;
  }
}

/**
* 멤버 업무 배정 조회 (주간 배정 결과)
* GET /api/schedules/memberTask
*
* @returns 방 멤버들의 업무 배정 목록 (시간순 정렬)
*/
export async function getMemberTaskSchedule(): Promise<MemberTaskSchedule[]> {
  const startTime = logApiCall('Task', 'GET /schedules/memberTask');

  try {
    const response = await get<GetMemberTaskScheduleResponse>('/schedules/memberTask');

    const uniqueUsers = new Set(response.map(s => s.user.name)).size;
    const uniqueTasks = new Set(response.map(s => s.roomTask.title)).size;

    console.log(`[Task API] GET /schedules/memberTask - Success (${response.length} assignments, ${uniqueUsers} users, ${uniqueTasks} tasks)`);
    logApiSuccess('Task', 'GET /schedules/memberTask', startTime, response);

    return response;
  } catch (error) {
    console.warn('[Task API] GET /schedules/memberTask - Failed, returning empty array', error);
    return [];
  }
}
