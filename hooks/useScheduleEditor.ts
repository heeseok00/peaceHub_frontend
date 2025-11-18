'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { WeeklySchedule } from '@/types';
import { getTemporarySchedule, saveSchedule } from '@/lib/api/client';
import { createEmptySchedule } from '@/lib/utils/scheduleHelpers';
import { useApiData } from './useApiData';

export type ScheduleEditorMode = 'onboarding' | 'edit';

interface UseScheduleEditorOptions {
  /**
   * 모드 설정
   * - 'onboarding': 온보딩 중 스케줄 작성
   * - 'edit': 메인 앱에서 스케줄 수정
   */
  mode: ScheduleEditorMode;

  /**
   * 저장 성공 후 이동할 경로
   * @default '/dashboard'
   */
  redirectPath?: string;

  /**
   * 스케줄 로드 실패 시 빈 스케줄로 대체할지 여부
   * @default true
   */
  fallbackToEmpty?: boolean;

  /**
   * 저장 성공 시 호출할 콜백
   */
  onSaveSuccess?: () => void;

  /**
   * 저장 실패 시 호출할 콜백
   */
  onSaveError?: (error: Error) => void;
}

interface UseScheduleEditorReturn {
  /**
   * 현재 스케줄
   */
  schedule: WeeklySchedule | null;

  /**
   * 스케줄 설정 함수
   */
  setSchedule: (schedule: WeeklySchedule | null) => void;

  /**
   * 로딩 상태
   */
  isLoading: boolean;

  /**
   * 저장 중 상태
   */
  isSubmitting: boolean;

  /**
   * 스케줄 저장 및 리디렉션
   */
  handleSubmit: () => Promise<void>;

  /**
   * 건너뛰기 (온보딩 모드에서만 사용)
   */
  handleSkip: () => void;

  /**
   * 스케줄 다시 로드
   */
  refetch: () => Promise<void>;
}

/**
 * 스케줄 편집 로직을 관리하는 훅
 *
 * @example
 * ```tsx
 * const {
 *   schedule,
 *   setSchedule,
 *   isLoading,
 *   isSubmitting,
 *   handleSubmit,
 *   handleSkip,
 * } = useScheduleEditor({
 *   mode: 'onboarding',
 *   redirectPath: '/dashboard',
 * });
 * ```
 *
 * @param options 옵션 객체
 * @returns 스케줄 편집 관련 상태 및 함수들
 */
export function useScheduleEditor(options: UseScheduleEditorOptions): UseScheduleEditorReturn {
  const {
    mode,
    redirectPath = '/dashboard',
    fallbackToEmpty = true,
    onSaveSuccess,
    onSaveError,
  } = options;

  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // API로부터 스케줄 로드 (TEMPORARY - 다음 주 스케줄)
  const { data: schedule, isLoading, setData: setSchedule, refetch } = useApiData(
    getTemporarySchedule,
    {
      onError: (error) => {
        console.error('스케줄 로드 실패:', error);
        // 로드 실패 시 빈 스케줄로 대체
        if (fallbackToEmpty) {
          setSchedule(createEmptySchedule());
        }
      },
    }
  );

  /**
   * 스케줄 저장 및 다음 단계로 이동
   */
  const handleSubmit = useCallback(async () => {
    if (!schedule) {
      console.error('스케줄이 없습니다');
      return;
    }

    setIsSubmitting(true);
    try {
      await saveSchedule(schedule);
      onSaveSuccess?.();

      // 저장 성공 후 페이지 이동
      router.push(redirectPath);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('스케줄 저장 실패');
      console.error('스케줄 저장 실패:', err);
      onSaveError?.(err);
      alert('스케줄 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  }, [schedule, router, redirectPath, onSaveSuccess, onSaveError]);

  /**
   * 건너뛰기 (온보딩 모드에서만 사용)
   */
  const handleSkip = useCallback(() => {
    if (mode !== 'onboarding') {
      console.warn('Skip is only available in onboarding mode');
      return;
    }

    if (confirm('타임테이블을 나중에 설정하시겠습니까?')) {
      router.push(redirectPath);
    }
  }, [mode, router, redirectPath]);

  return {
    schedule,
    setSchedule,
    isLoading,
    isSubmitting,
    handleSubmit,
    handleSkip,
    refetch,
  };
}
