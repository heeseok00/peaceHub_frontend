'use client';

import { useState, useRef, useMemo, useCallback } from 'react';
import MonthlyCalendar from '@/components/dashboard/MonthlyCalendar';
import CombinedTimelineBar from '@/components/dashboard/CombinedTimelineBar';
import TimelineBar from '@/components/dashboard/TimelineBar';
import { MainLoadingSpinner } from '@/components/common/LoadingSpinner';
import type { User, Assignment, WeeklySchedule } from '@/types';
import {
  getCurrentUser,
  getRoomMembers,
  getCurrentAssignments,
  getAllSchedules,
  getActiveSchedule,
} from '@/lib/api/client';
import { useApiData, useParallelApiData } from '@/hooks/useApiData';

/**
 * 대시보드 페이지
 *
 * 월간 캘린더 + 통합 타임라인 + 개인 타임라인
 */
export default function DashboardPage() {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const detailsRef = useRef<HTMLDivElement>(null);

  // 1. Fetch primary data in parallel
  const getRoomMembersCallback = useCallback(() => getRoomMembers('room-1'), []);
  const apiFunctions = useMemo(() => [
    getCurrentUser,
    getRoomMembersCallback,
    getCurrentAssignments,
  ], [getRoomMembersCallback]);

  const { data: parallelData, isLoading: isLoadingParallel, error: parallelError } = useParallelApiData(apiFunctions);
  const currentUser = (parallelData?.[0] as User | null) || null;
  const users = (parallelData?.[1] as User[]) || [];
  const assignments = (parallelData?.[2] as Assignment[]) || [];

  // 2. Fetch my active schedule (현재 주)
  const { data: mySchedule, isLoading: isLoadingMySchedule, error: myScheduleError } = useApiData(
    getActiveSchedule,
    { autoFetch: !!currentUser }
  );

  // 3. Fetch all schedules once users are loaded (통합 타임라인용, Mock)
  const getAllSchedulesCallback = useCallback(async () => {
    if (!users || !Array.isArray(users) || users.length === 0) {
      return new Map<string, WeeklySchedule>();
    }
    const userIds = users.map(u => u.id);
    return getAllSchedules(userIds);
  }, [users]);

  const { data: allSchedules, isLoading: isLoadingSchedules, error: schedulesError } = useApiData(
    getAllSchedulesCallback,
    { autoFetch: !!users && Array.isArray(users) && users.length > 0 }
  );

  const isLoading = isLoadingParallel || isLoadingMySchedule || isLoadingSchedules;
  const error = parallelError || myScheduleError || schedulesError;

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setTimeout(() => {
      detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  if (isLoading) {
    return <MainLoadingSpinner text="대시보드를 불러오는 중..." />;
  }

  if (error || !currentUser) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">데이터를 불러올 수 없습니다: {error?.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary-700 mb-2">
            {currentUser.realName}님의 집안일 대시보드
          </h1>
          <p className="text-gray-600">
            {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
          </p>
        </div>

        {/* 월간 캘린더 (축소됨) */}
        <div className="max-w-3xl mx-auto">
          <MonthlyCalendar
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            assignments={assignments || []}
            selectedUserId={null}
            onDateClick={handleDateClick}
            onMonthChange={setCurrentMonth}
          />
        </div>

        {/* 선택된 날짜 상세 (스크롤 타겟) */}
        <div ref={detailsRef} className="space-y-6 scroll-mt-20">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800">
              {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 상세
            </h2>
          </div>

          {/* 통합 타임라인 (모두) */}
          {allSchedules && users && (
            <CombinedTimelineBar
              date={selectedDate}
              allSchedules={allSchedules}
              assignments={assignments || []}
              users={users}
            />
          )}

          {/* 개인 타임라인 (나) */}
          {mySchedule && (
            <TimelineBar
              date={selectedDate}
              schedule={mySchedule}
              assignments={assignments || []}
              userId={currentUser.id}
            />
          )}
        </div>
      </div>
    </div>
  );
}
