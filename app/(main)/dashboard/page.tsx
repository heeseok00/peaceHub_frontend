'use client';

import { useState, useEffect } from 'react';
import MonthlyCalendar from '@/components/dashboard/MonthlyCalendar';
import FilterButtons from '@/components/dashboard/FilterButtons';
import DailyTasks from '@/components/dashboard/DailyTasks';
import TimelineBar from '@/components/dashboard/TimelineBar';
import type { User, Assignment, WeeklySchedule } from '@/types';
import {
  getCurrentUser,
  getRoomMembers,
  getCurrentAssignments,
  getMySchedule,
} from '@/lib/api/client';

/**
 * 대시보드 페이지
 *
 * 월간 캘린더 + 필터 + 업무 목록 + 타임테이블
 */

export default function DashboardPage() {
  // 상태
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [schedule, setSchedule] = useState<WeeklySchedule | null>(null);

  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null); // null = 전체

  const [isLoading, setIsLoading] = useState(true);

  /**
   * 초기 데이터 로드
   */
  useEffect(() => {
    const loadData = async () => {
      try {
        const [user, members, assignmentsData, scheduleData] =
          await Promise.all([
            getCurrentUser(),
            getRoomMembers('room-1'),
            getCurrentAssignments(),
            getMySchedule(),
          ]);

        setCurrentUser(user);
        setUsers(members);
        setAssignments(assignmentsData);
        setSchedule(scheduleData);
      } catch (error) {
        console.error('데이터 로드 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">대시보드를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || !schedule) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
        <div className="text-center">
          <p className="text-gray-600">데이터를 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary-700 mb-2">
            {currentUser.realName}님의 집안일 대시보드
          </h1>
          <p className="text-gray-600">
            {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
          </p>
        </div>

        {/* 월간 캘린더 */}
        <MonthlyCalendar
          currentMonth={currentMonth}
          selectedDate={selectedDate}
          assignments={assignments}
          selectedUserId={selectedUserId}
          onDateClick={setSelectedDate}
          onMonthChange={setCurrentMonth}
        />

        {/* 필터 버튼 */}
        <FilterButtons
          users={users}
          selectedUserId={selectedUserId}
          onFilterChange={setSelectedUserId}
        />

        {/* 업무 목록 */}
        <DailyTasks
          date={selectedDate}
          assignments={assignments}
          users={users}
          selectedUserId={selectedUserId}
        />

        {/* 타임테이블 바 */}
        <TimelineBar
          date={new Date()} // 오늘 날짜
          schedule={schedule}
          assignments={assignments}
          userId={currentUser.id}
        />
      </div>
    </div>
  );
}
