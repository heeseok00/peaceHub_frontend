/**
 * Backend API Type Definitions
 *
 * 이 파일은 백엔드 API와 통신할 때 사용하는 타입 정의를 포함합니다.
 * 프론트엔드 UI 타입(types/index.ts)과는 구분됩니다.
 *
 * 변환: lib/utils/apiTransformers.ts를 사용하여 frontend ↔ backend 타입 변환
 */

// ==================== Enums ====================

/**
 * 백엔드 요일 형식 (대문자, 전체 이름)
 */
export type BackendDayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

/**
 * 백엔드 타임 블록 타입
 */
export type BackendTimeBlockType = 'QUIET' | 'BUSY' | 'TASK' | 'FREE';

// ==================== Authentication ====================

/**
 * Google OAuth 로그인 응답
 * GET /api/auth/google
 */
export interface GoogleAuthResponse {
  redirectUrl: string;
}

// ==================== User ====================

/**
 * 사용자 정보 조회 응답
 * GET /api/users/me
 */
export interface GetCurrentUserResponse {
  id: string;
  email: string;
  name: string; // Google에서 제공하는 이름
  picture?: string; // 프로필 이미지 URL
  realName?: string; // 사용자가 설정한 실명
  country?: string;
  language?: string;
  roomId?: string; // 속한 방 ID (없으면 null)
  workLoad?: number; // 지난 주 업무 강도 (기본값 0)
  room?: {
    // 방 정보 (roomId가 있을 경우)
    inviteCode: string; // 초대 코드
    name: string; // 방 이름
  };
  createdAt: string; // ISO 8601 형식
  updatedAt: string;
}

// ==================== Room ====================

/**
 * 방 생성 요청
 * POST /api/rooms/
 */
export interface CreateRoomRequest {
  name: string;
}

/**
 * 방 생성/조회 응답
 */
export interface RoomResponse {
  id: string;
  name: string;
  inviteCode: string; // 6자리 랜덤 코드
  createdAt: string;
  updatedAt: string;
  ownerId: string; // 방장 ID
}

/**
 * 방 참여 요청
 * POST /api/rooms/join
 */
export interface JoinRoomRequest {
  inviteCode: string;
}

// ==================== Schedule (Time Table) ====================

/**
 * 타임 블록 (백엔드 형식)
 *
 * 주간 스케줄은 타임 블록의 배열로 표현됩니다.
 * - dayOfWeek: 요일 (대문자)
 * - type: 블록 타입 (QUIET, BUSY, TASK, FREE)
 * - startDateTime, endDateTime: ISO 8601 timestamp (날짜 포함)
 *   예) "2025-11-24T09:00:00.000Z"
 *
 * 주의: POST 요청(스케줄 저장)은 startTime/endTime 사용
 *       GET 응답(스케줄 조회)은 startDateTime/endDateTime 사용
 */
export interface BackendTimeBlock {
  id?: string; // 백엔드에서 제공하는 ID (응답 시)
  dayOfWeek: BackendDayOfWeek;
  type: BackendTimeBlockType;
  // POST 요청용
  startTime?: string; // ISO 8601 timestamp
  endTime?: string; // ISO 8601 timestamp
  // GET 응답용
  startDateTime?: string; // ISO 8601 timestamp (응답 시)
  endDateTime?: string; // ISO 8601 timestamp (응답 시)
  status?: 'ACTIVE' | 'TEMPORARY'; // 스케줄 상태 (응답 시)
  userId?: string; // 사용자 ID (응답 시)
  roomTaskId?: string; // TASK 타입일 경우 업무 ID (응답 시)
  roomTask?: {
    title: string; // 업무 이름
  }; // TASK 타입일 경우 업무 정보 (응답 시)
  difficulty?: number; // TASK 타입일 경우 난이도 (응답 시)
}

/**
 * 스케줄 작성/수정 요청
 * POST /api/schedules
 */
export type PostScheduleRequest = BackendTimeBlock[];

/**
 * 스케줄 조회 응답
 * GET /api/schedules
 */
export type GetScheduleResponse = BackendTimeBlock[];

/**
 * 날짜별 스케줄 조회 응답
 * GET /api/schedules/daily?date=YYYY-MM-DD
 *
 * ACTIVE + TEMPORARY + ScheduleHistory를 모두 포함
 */
export type GetDailyScheduleResponse = (BackendTimeBlock | BackendScheduleHistory)[];

/**
 * 날짜별 멤버 스케줄 조회 응답
 * GET /api/schedules/memberDaily?date=YYYY-MM-DD
 *
 * 같은 방의 모든 멤버 스케줄 (QUIET + TASK만 필터링)
 */
export type GetMemberDailyScheduleResponse = BackendTimeBlock[];

// ==================== Room Task ====================

/**
 * 방 업무 템플릿
 * 방 생성 시 사용되는 업무 템플릿
 */
export interface BackendRoomTaskTemplate {
  id: string;
  title: string;
  difficulty: number; // knapsack 가치
  estimatedTime: number; // knapsack 용량 (분 단위)
}

/**
 * 방별 업무
 * 템플릿에서 복사된 실제 방 업무
 */
export interface BackendRoomTask {
  id: string;
  title: string;
  difficulty: number; // knapsack 가치
  estimatedTime: number; // knapsack 용량 (분 단위)
  roomId: string;
}

// ==================== Task Preference ====================

/**
 * 업무 선호도
 * POST /api/preferences (TODO)
 */
export interface BackendTaskPreference {
  id: string;
  priority: number; // 우선순위 (1: 1지망, 2: 2지망)
  userId: string;
  taskId: string; // RoomTask ID
}

/**
 * 선호도 제출 요청
 */
export interface PostTaskPreferenceRequest {
  priority: number;
  taskId: string;
}

// ==================== Schedule History ====================

/**
 * 스케줄 히스토리 (지난 날짜의 스케줄 아카이브)
 * GET /api/schedules/daily에서 반환될 수 있음
 */
export interface BackendScheduleHistory {
  id: string;
  startDateTime: string; // ISO 8601 timestamp (응답)
  endDateTime: string; // ISO 8601 timestamp (응답)
  type: BackendTimeBlockType; // QUIET, BUSY, FREE, TASK
  roomTaskId?: string; // TASK일 경우 업무 ID
  roomTask?: {
    title: string; // 업무 이름
  };
  difficulty?: number; // TASK일 경우 난이도
  userId: string;
}

// ==================== Error Responses ====================

/**
 * 공통 에러 응답 형식
 */
export interface ErrorResponse {
  message: string;
  statusCode?: number;
  error?: string;
}

/**
 * 401 Unauthorized - 로그인 필요
 */
export interface UnauthorizedError extends ErrorResponse {
  message: 'need login';
}

/**
 * 400 Bad Request - 잘못된 요청
 */
export interface BadRequestError extends ErrorResponse {
  message: string; // 구체적인 에러 메시지
}

/**
 * 404 Not Found - 리소스를 찾을 수 없음
 */
export interface NotFoundError extends ErrorResponse {
  message: string;
}

/**
 * 409 Conflict - 리소스 충돌 (예: 이미 방에 속해있음)
 */
export interface ConflictError extends ErrorResponse {
  message: string;
}

// ==================== Type Guards ====================

/**
 * 에러 응답인지 확인
 */
export function isErrorResponse(response: unknown): response is ErrorResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'message' in response
  );
}

/**
 * 401 에러인지 확인
 */
export function isUnauthorizedError(response: unknown): response is UnauthorizedError {
  return (
    isErrorResponse(response) &&
    (response.message === 'need login' || (response as ErrorResponse).statusCode === 401)
  );
}

// ==================== Constants ====================

/**
 * API Base URL
 * 환경 변수에서 가져오거나 기본값 사용
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

/**
 * API 엔드포인트 경로
 */
export const API_ENDPOINTS = {
  // Auth
  GOOGLE_AUTH: '/auth/google',
  GOOGLE_CALLBACK: '/auth/google/callback',

  // User
  CURRENT_USER: '/users',

  // Room
  ROOMS: '/rooms',
  JOIN_ROOM: '/rooms/join',

  // Schedule
  SCHEDULES: '/schedules',
} as const;
