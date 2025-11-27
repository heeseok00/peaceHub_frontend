'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseApiDataOptions {
  /**
   * 컴포넌트 마운트 시 자동으로 데이터를 가져올지 여부
   * @default true
   */
  autoFetch?: boolean;

  /**
   * 에러 발생 시 호출할 콜백 함수
   */
  onError?: (error: Error) => void;

  /**
   * 성공 시 호출할 콜백 함수
   */
  onSuccess?: <T>(data: T) => void;
}

interface UseApiDataReturn<T> {
  /**
   * API로부터 가져온 데이터
   */
  data: T | null;

  /**
   * 로딩 상태
   */
  isLoading: boolean;

  /**
   * 에러 객체
   */
  error: Error | null;

  /**
   * 데이터를 다시 가져오는 함수
   */
  refetch: () => Promise<void>;

  /**
   * 데이터를 직접 설정하는 함수 (낙관적 업데이트 등에 사용)
   */
  setData: (data: T | null) => void;

  /**
   * 로딩 상태를 직접 설정하는 함수
   */
  setIsLoading: (loading: boolean) => void;
}

/**
 * API 데이터 fetching을 위한 공통 훅
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = useApiData(
 *   () => getCurrentUser(),
 *   { onError: (err) => alert(err.message) }
 * );
 * ```
 *
 * @param apiFunction API를 호출하는 비동기 함수
 * @param options 옵션 객체
 * @returns API 데이터, 로딩 상태, 에러, refetch 함수 등을 포함한 객체
 */
export function useApiData<T>(
  apiFunction: () => Promise<T>,
  options: UseApiDataOptions = {}
): UseApiDataReturn<T> {
  const { autoFetch = true, onError, onSuccess } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(autoFetch);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiFunction();
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [apiFunction, onError, onSuccess]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    setData,
    setIsLoading,
  };
}

/**
 * 여러 API를 병렬로 호출하는 훅
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useParallelApiData([
 *   () => getCurrentUser(),
 *   () => getRoomMembers('room-1'),
 *   () => getCurrentAssignments()
 * ]);
 *
 * if (isLoading) return <LoadingSpinner />;
 * const [user, members, assignments] = data || [];
 * ```
 *
 * @param apiFunctions API 호출 함수 배열
 * @param options 옵션 객체
 * @returns 병렬로 호출한 결과 배열과 로딩, 에러 상태
 */
export function useParallelApiData<T extends unknown[]>(
  apiFunctions: { [K in keyof T]: () => Promise<T[K]> },
  options: UseApiDataOptions = {}
): UseApiDataReturn<T> {
  const { autoFetch = true, onError, onSuccess } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(autoFetch);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const results = await Promise.all(apiFunctions.map(fn => fn()));
      setData(results as T);
      onSuccess?.(results as T);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [apiFunctions, onError, onSuccess]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    setData,
    setIsLoading,
  };
}
