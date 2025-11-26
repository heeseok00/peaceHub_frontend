import { TASK_EMOJIS } from '@/lib/constants/tasks';
import type { User } from '@/types';

/**
 * Task ID로 이모지 조회
 * @param taskId Task ID
 * @returns 이모지 또는 기본값 '📋'
 */
export function getTaskEmoji(taskId: string): string {
  return TASK_EMOJIS[taskId] || '📋';
}

/**
 * User ID로 사용자 이름 조회
 * @param userId User ID
 * @param users 사용자 목록
 * @returns 사용자 이름 또는 '알 수 없음'
 */
export function getUserName(userId: string, users: User[]): string {
  const user = users.find((u) => u.id === userId);
  return user?.realName || '알 수 없음';
}

/**
 * User ID로 사용자 전체 객체 조회
 * @param userId User ID
 * @param users 사용자 목록
 * @returns User 객체 또는 undefined
 */
export function getUser(userId: string, users: User[]): User | undefined {
  return users.find((u) => u.id === userId);
}

