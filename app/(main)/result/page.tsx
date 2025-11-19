'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import { MainLoadingSpinner } from '@/components/common/LoadingSpinner';
import { getCurrentUser, getRoomMembers, getCurrentAssignments } from '@/lib/api/client';
import { DAY_NAMES, TASKS } from '@/types';
import { TASK_EMOJIS, formatTimeRange } from '@/lib/constants/tasks';
import type { Assignment, DayOfWeek, TimeRange } from '@/types';

interface UserAssignment {
  userId: string;
  userName: string;
  profileImage?: string;
  tasks: {
    taskId: string;
    taskName: string;
    days: DayOfWeek[];
    timeRange?: TimeRange;
  }[];
}

// Helper to get the start of the current week (Monday)
const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff));
};

export default function ResultPage() {
  const [assignmentsByUser, setAssignmentsByUser] = useState<UserAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [week, setWeek] = useState({ start: '', end: '' });
  const [totalTasks, setTotalTasks] = useState(0);

  useEffect(() => {
    const loadAssignmentData = async () => {
      try {
        setIsLoading(true);

        // 1. Get current user to retrieve roomId
        const user = await getCurrentUser();
        if (!user || !user.roomId) {
          console.error('User or roomId not found');
          setIsLoading(false);
          return;
        }

        // 2. Fetch room members and current assignments in parallel
        const [members, assignments] = await Promise.all([
          getRoomMembers(user.roomId),
          getCurrentAssignments(),
        ]);

        // 3. Calculate week start/end from assignments
        if (assignments.length > 0) {
          const weekStartStr = assignments[0].weekStart;
          const weekStart = new Date(weekStartStr);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);

          const formatDate = (d: Date) =>
            `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
          setWeek({ start: formatDate(weekStart), end: formatDate(weekEnd) });
        }

        setTotalTasks(assignments.length);

        // 4. Group assignments by user
        const groupedAssignments: { [userId: string]: UserAssignment } = {};

        members.forEach((member) => {
          groupedAssignments[member.id] = {
            userId: member.id,
            userName: member.realName,
            profileImage: member.profileImage,
            tasks: [],
          };
        });

        assignments.forEach((assignment) => {
          if (groupedAssignments[assignment.userId]) {
            const task = TASKS.find((t) => t.id === assignment.taskId);
            if (task) {
              groupedAssignments[assignment.userId].tasks.push({
                taskId: task.id,
                taskName: task.name,
                days: assignment.days,
                timeRange: assignment.timeRange,
              });
            }
          }
        });

        setAssignmentsByUser(Object.values(groupedAssignments));
      } catch (error) {
        console.error('Failed to load assignment data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAssignmentData();
  }, []);

  if (isLoading) {
    return <MainLoadingSpinner text="결과를 불러오는 중..." />;
  }

  return (
    <div className="page-container">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-700 mb-2">
            주간 업무 배정 결과
          </h1>
          <p className="text-gray-600 text-lg mb-2">
            📅 {week.start} ~ {week.end}
          </p>
          <p className="text-primary-600 font-semibold">
            이번 주 총 {totalTasks}개 업무 배정
          </p>
        </div>

        {/* 배정 결과 목록 */}
        <div className="space-y-6">
          {assignmentsByUser.map((userAssignment) => (
            <Card key={userAssignment.userId} padding="lg">
              <div className="flex items-start gap-6">
                <img
                  src={userAssignment.profileImage}
                  alt={userAssignment.userName}
                  className="w-20 h-20 rounded-full border-4 border-primary-100 shadow-md"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">
                      {userAssignment.userName}
                    </h2>
                    <span className="px-3 py-1 bg-primary-600 text-white text-sm font-semibold rounded-full">
                      {userAssignment.tasks.length}개 업무
                    </span>
                  </div>
                  {userAssignment.tasks.length > 0 ? (
                    <div className="space-y-4">
                      {userAssignment.tasks.map((task, index) => (
                        <div
                          key={`${task.taskId}-${index}`}
                          className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border-l-4 border-primary-500 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">
                              {TASK_EMOJIS[task.taskId] || '📋'}
                            </span>
                            <p className="font-bold text-gray-800 text-lg">
                              {task.taskName}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {task.days.map((day) => (
                              <span
                                key={day}
                                className="px-3 py-1 bg-primary-100 text-primary-700 text-sm font-semibold rounded-full"
                              >
                                {DAY_NAMES[day]}
                              </span>
                            ))}
                            {task.timeRange && (
                              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full flex items-center gap-1">
                                🕐{' '}
                                {formatTimeRange(
                                  task.timeRange.start,
                                  task.timeRange.end
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-gray-500">
                      이번 주 배정된 업무가 없습니다.
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            매주 월요일 자정에 새로운 업무가 배정됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
