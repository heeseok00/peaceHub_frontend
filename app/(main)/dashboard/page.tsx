'use client';

import { useState, useRef, useMemo, useCallback } from 'react';
import MonthlyCalendar from '@/components/dashboard/MonthlyCalendar';
import CombinedTimelineBar from '@/components/dashboard/CombinedTimelineBar';
import TimelineBar from '@/components/dashboard/TimelineBar';
import { MainLoadingSpinner } from '@/components/common/LoadingSpinner';
import type { User, Assignment, WeeklySchedule, DayOfWeek } from '@/types';
import { getCurrentUser, getRoomMembers, getMemberDailySchedule, getMemberTaskSchedule } from '@/lib/api/endpoints';
import { useApiData } from '@/hooks/useApiData';
import { getDayOfWeekFromISO, hourFromISOTimestamp, getWeekStart } from '@/lib/utils/dateHelpers';
import type { MemberTaskSchedule } from '@/types/api';

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

  // 3. Fetch assignments (배정된 업무)
  const { data: memberTaskSchedules, isLoading: isLoadingAssignments } = useApiData(
    getMemberTaskSchedule,
    { autoFetch: !!currentUser?.roomId }
  );

  // 4. Convert MemberTaskSchedule[] to Assignment[]
  const assignments = useMemo(() => {
    if (!memberTaskSchedules || memberTaskSchedules.length === 0) {
      return [];
    }

    if (!currentUser?.roomId) {
      return [];
    }

    // user.name으로 userId를 찾기 위한 맵 생성
    const nameToUserIdMap = new Map<string, string>();
    
    // roomMembers가 있으면 사용
    if (roomMembers && roomMembers.length > 0) {
      roomMembers.forEach(member => {
        nameToUserIdMap.set(member.realName, member.id);
        // name 필드도 추가 (혹시 모를 경우 대비)
        if (member.realName !== (member as any).name) {
          nameToUserIdMap.set((member as any).name || '', member.id);
        }
      });
    }
    
    // currentUser도 맵에 추가
    if (currentUser) {
      nameToUserIdMap.set(currentUser.realName, currentUser.id);
      // currentUser의 name 필드도 추가 (혹시 모를 경우)
      if (currentUser.realName !== (currentUser as any).name) {
        nameToUserIdMap.set((currentUser as any).name || '', currentUser.id);
      }
    }

    // memberTaskSchedules에서 나온 모든 user.name을 수집하여 임시 사용자 맵 생성
    // (roomMembers가 없을 때를 대비)
    const uniqueUserNames = new Set(memberTaskSchedules.map(s => s.user.name));
    uniqueUserNames.forEach(userName => {
      // 아직 맵에 없으면, currentUser와 이름이 같으면 currentUser.id 사용
      if (!nameToUserIdMap.has(userName) && currentUser) {
        // 이름이 정확히 일치하거나 부분 일치하면 currentUser.id 사용
        if (userName === currentUser.realName ||
            currentUser.realName.includes(userName) ||
            userName.includes(currentUser.realName)) {
          nameToUserIdMap.set(userName, currentUser.id);
        }
      }
    });

    const converted = memberTaskSchedules
      .map((schedule: MemberTaskSchedule): Assignment | null => {
        const startDate = new Date(schedule.startTime);
        const endDate = new Date(schedule.endTime);
        
        // user.name으로 userId 찾기
        let userId = nameToUserIdMap.get(schedule.user.name);

        // 매칭 실패 시 부분 매칭 시도
        if (!userId) {
          // 정확한 매칭 실패 시 부분 매칭 시도
          for (const [name, id] of nameToUserIdMap.entries()) {
            if (name.includes(schedule.user.name) || schedule.user.name.includes(name)) {
              userId = id;
              break;
            }
          }
        }

        // 여전히 매칭 실패 시, currentUser와 이름이 같으면 currentUser.id 사용
        if (!userId && currentUser) {
          if (schedule.user.name === currentUser.realName ||
              schedule.user.name === (currentUser as any).name ||
              currentUser.realName.includes(schedule.user.name) ||
              schedule.user.name.includes(currentUser.realName)) {
            userId = currentUser.id;
          }
        }

        // 최후의 수단: user.name을 해시하여 임시 userId로 사용
        // 하지만 이 경우 타임라인에서 필터링이 안 될 수 있으므로 주의
        if (!userId) {
          return null;
        }

        // weekStart 계산
        const weekStart = getWeekStart(startDate);

        // 요일 추출
        const day = getDayOfWeekFromISO(schedule.startTime);

        // 시간 추출
        const startHour = hourFromISOTimestamp(schedule.startTime);
        const endHour = hourFromISOTimestamp(schedule.endTime);

        return {
          id: schedule.id,
          userId: userId,
          roomId: currentUser.roomId || '',
          taskId: schedule.roomTask.title,
          days: [day],
          timeRange: {
            start: startHour,
            end: endHour,
          },
          weekStart: weekStart,
          createdAt: schedule.startTime,
        };
      })
      .filter((a): a is Assignment => a !== null);

    return converted;
  }, [memberTaskSchedules, roomMembers, currentUser, selectedDate]);

  // 4. Fetch daily schedule for selected date (선택한 날짜의 스케줄 조회)
  const selectedDateStr = useMemo(
    () => `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`,
    [selectedDate]
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

  // memberScheduleBlocks에서 현재 사용자 것만 필터링
  const myScheduleBlocks = useMemo(() => {
    if (!memberScheduleBlocks || !currentUser) return [];
    return memberScheduleBlocks.filter(block => block.userId === currentUser.id);
  }, [memberScheduleBlocks, currentUser]);

  // 6. 사용자 목록 생성 (memberScheduleBlocks 이후)
  const displayUsers = useMemo(() => {
    // 1. roomMembers가 있으면 사용
    if (roomMembers && roomMembers.length > 0) {
      return roomMembers;
    }
    
    // 2. memberScheduleBlocks에서 userId 추출하여 사용자 목록 생성
    if (memberScheduleBlocks && memberScheduleBlocks.length > 0) {
      const userIds = Array.from(new Set(memberScheduleBlocks.map(b => b.userId)));

      // userId만 가진 임시 User 객체 생성 (userName을 realName으로 매핑)
      return userIds.map(userId => {
        // 해당 userId의 첫 번째 블록에서 userName 가져오기
        const userBlock = memberScheduleBlocks.find(b => b.userId === userId);
        const realName = userBlock?.userName || `사용자 ${userId.substring(0, 8)}`;

        return {
          id: userId,
          email: '',
          realName, // userName을 realName으로 매핑
          country: '',
          language: '',
          createdAt: '',
        };
      });
    }
    
    // 3. 아무것도 없으면 currentUser만
    return currentUser ? [currentUser] : [];
  }, [roomMembers, memberScheduleBlocks, currentUser]);

  // 7. Convert ScheduleBlock[] to Map<userId, WeeklySchedule>
  const allSchedules = useMemo(() => {
    const scheduleMap = new Map<string, WeeklySchedule>();

    if (!memberScheduleBlocks || memberScheduleBlocks.length === 0) {
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
      
      // ISO timestamp에서 요일과 시간 추출 (UTC 기준, 타임존 변환 없음)
      const day = getDayOfWeekFromISO(block.startTime);
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
  }, [memberScheduleBlocks, currentUser]);

  const isLoading = isLoadingUser || isLoadingMembers || isLoadingAssignments || isLoadingMemberSchedules;
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

          {/* allSchedules에서 현재 사용자 스케줄 가져오기 */}
          {(() => {
            const mySchedule = currentUser ? allSchedules.get(currentUser.id) : undefined;

            return (
              <>
                {/* 통합 타임라인 (모두) */}
          {allSchedules && displayUsers && displayUsers.length > 0 && (
            <CombinedTimelineBar
              date={selectedDate}
              allSchedules={allSchedules}
              memberTaskBlocks={memberScheduleBlocks || []}
              users={displayUsers}
            />
          )}

          {/* 개인 타임라인 (나) */}
          {mySchedule && (
            <TimelineBar
              date={selectedDate}
              schedule={mySchedule}
              myTaskBlocks={myScheduleBlocks}
              userId={currentUser.id}
            />
          )}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
