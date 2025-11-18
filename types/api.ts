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
export type BackendTimeBlockType = 'QUIET' | 'BUSY' | 'TASK';

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
 * GET /api/users/
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
 * - type: 블록 타입 (QUIET, BUSY, TASK)
 * - startTime, endTime: 00:00 기준 분 단위 (0-1439)
 *   예) 오전 9시 = 540분, 오후 4시 = 960분
 */
export interface BackendTimeBlock {
  id?: string; // 백엔드에서 제공하는 ID (선택적)
  dayOfWeek: BackendDayOfWeek;
  type: BackendTimeBlockType;
  startTime: number; // 분 단위 (0-1439)
  endTime: number; // 분 단위 (0-1439)
  status?: 'ACTIVE' | 'TEMPORARY'; // 스케줄 상태 (선택적)
  userId?: string; // 사용자 ID (선택적)
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
