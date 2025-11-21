'use client';

import { useState, useRef, useMemo, useCallback } from 'react';
import MonthlyCalendar from '@/components/dashboard/MonthlyCalendar';
import CombinedTimelineBar from '@/components/dashboard/CombinedTimelineBar';
import TimelineBar from '@/components/dashboard/TimelineBar';
import { MainLoadingSpinner } from '@/components/common/LoadingSpinner';
import type { User, Assignment, WeeklySchedule, DayOfWeek } from '@/types';
import { getCurrentUser, getDailySchedule, getRoomMembers, getMemberDailySchedule } from '@/lib/api/endpoints';
import {
  getCurrentAssignments,
} from '@/lib/api/client';
import { useApiData } from '@/hooks/useApiData';
import { getDayOfWeek, hourFromISOTimestamp } from '@/lib/utils/dateHelpers';

/**
 * 대시보드 페이지
 *
 * 월간 캘린더 + 통합 타임라인 + 개인 타임라인
 */
export default function DashboardPage() {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const detailsRef = useRef<HTMLDivElement>(null);

  // 1. Fetch current user first
  const { data: currentUser, isLoading: isLoadingUser, error: userError } = useApiData(getCurrentUser);

  // 2. Fetch room members (currentUser.roomId 사용)
  const getRoomMembersCallback = useCallback(
    () => currentUser?.roomId ? getRoomMembers(currentUser.roomId) : Promise.resolve([]),
    [currentUser?.roomId]
  );

  const { data: roomMembers, isLoading: isLoadingMembers } = useApiData(
    getRoomMembersCallback,
    { autoFetch: !!currentUser?.roomId }
  );

  // 3. Fetch assignments
  const { data: assignments, isLoading: isLoadingAssignments } = useApiData(getCurrentAssignments);

  // 4. Fetch daily schedule for selected date (선택한 날짜의 스케줄 조회)
  const selectedDateStr = useMemo(
    () => `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`,
    [selectedDate]
  );

  const getDailyScheduleCallback = useCallback(
    () => getDailySchedule(selectedDateStr),
    [selectedDateStr]
  );

  const { data: mySchedule, isLoading: isLoadingMySchedule } = useApiData(
    getDailyScheduleCallback,
    { autoFetch: !!currentUser }
  );

  // 5. Fetch all members' schedules for selected date (통합 타임라인용)
  const getMemberSchedulesCallback = useCallback(
    () => getMemberDailySchedule(selectedDateStr),
    [selectedDateStr]
  );

  const { data: memberScheduleBlocks, isLoading: isLoadingMemberSchedules } = useApiData(
    getMemberSchedulesCallback,
    { autoFetch: !!currentUser?.roomId }
  );
  
  // 디버깅 로그 (필요시 주석 해제)
  // console.log('selectedDateStr:', selectedDateStr);
  // console.log('memberScheduleBlocks:', memberScheduleBlocks);
  // console.log('memberScheduleBlocks length:', memberScheduleBlocks?.length);

  // 6. 사용자 목록 생성 (memberScheduleBlocks 이후)
  const displayUsers = useMemo(() => {
    // 1. roomMembers가 있으면 사용
    if (roomMembers && roomMembers.length > 0) {
      return roomMembers;
    }
    
    // 2. memberScheduleBlocks에서 userId 추출하여 사용자 목록 생성
    if (memberScheduleBlocks && memberScheduleBlocks.length > 0) {
      const userIds = Array.from(new Set(memberScheduleBlocks.map(b => b.userId)));
      
      // userId만 가진 임시 User 객체 생성
      return userIds.map(userId => ({
        id: userId,
        email: '',
        realName: userId === currentUser?.id ? currentUser.realName : `사용자 ${userId.substring(0, 8)}`,
        country: '',
        language: '',
        createdAt: '',
      }));
    }
    
    // 3. 아무것도 없으면 currentUser만
    return currentUser ? [currentUser] : [];
  }, [roomMembers, memberScheduleBlocks, currentUser]);
  
  // 디버깅 로그 (필요시 주석 해제)
  // console.log('=== Dashboard Debug ===');
  // console.log('currentUser:', currentUser);
  // console.log('currentUser.roomId:', currentUser?.roomId);
  // console.log('roomMembers:', roomMembers);
  // console.log('displayUsers:', displayUsers);

  // 7. Convert ScheduleBlock[] to Map<userId, WeeklySchedule>
  const allSchedules = useMemo(() => {
    const scheduleMap = new Map<string, WeeklySchedule>();

    if (!memberScheduleBlocks || memberScheduleBlocks.length === 0) {
      // 멤버 스케줄이 없으면 내 스케줄만 사용
      if (currentUser && mySchedule) {
        scheduleMap.set(currentUser.id, mySchedule);
      }
      return scheduleMap;
    }

    // userId별로 그룹화
    memberScheduleBlocks.forEach((block) => {
      
      if (!scheduleMap.has(block.userId)) {
        // 빈 WeeklySchedule 초기화 (모든 시간을 null로)
        const emptySchedule: WeeklySchedule = {
          mon: {}, tue: {}, wed: {}, thu: {}, fri: {}, sat: {}, sun: {}
        };
        ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].forEach((day) => {
          const d = day as DayOfWeek;
          for (let hour = 0; hour < 24; hour++) {
            emptySchedule[d][hour] = null;
          }
        });
        scheduleMap.set(block.userId, emptySchedule);
      }

      const userSchedule = scheduleMap.get(block.userId)!;
      
      // ISO timestamp에서 요일과 시간 추출
      const day = getDayOfWeek(new Date(block.startTime));
      const startHour = hourFromISOTimestamp(block.startTime);
      const endHour = hourFromISOTimestamp(block.endTime);

      // 시간대별로 상태 설정 (QUIET, OUT만 표시, TASK는 assignments에서 처리)
      if (block.type === 'quiet' || block.type === 'out') {
        for (let hour = startHour; hour < endHour && hour < 24; hour++) {
          userSchedule[day][hour] = block.type;
        }
      }
    });
    
    return scheduleMap;
  }, [memberScheduleBlocks, currentUser, mySchedule]);

  const isLoading = isLoadingUser || isLoadingMembers || isLoadingAssignments || isLoadingMySchedule || isLoadingMemberSchedules;
  const error = userError;

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
              {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일
              {new Date().toDateString() === selectedDate.toDateString() && (
                <span className="ml-2 text-primary-600">(오늘)</span>
              )}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'][selectedDate.getDay()]}
            </p>
          </div>

          {/* 통합 타임라인 (모두) */}
          {allSchedules && displayUsers && displayUsers.length > 0 && (
            <CombinedTimelineBar
              date={selectedDate}
              allSchedules={allSchedules}
              assignments={assignments || []}
              users={displayUsers}
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
