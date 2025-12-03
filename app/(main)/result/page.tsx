'use client';

import { useApiData } from '@/hooks/useApiData';
import { MainLoadingSpinner } from '@/components/common/LoadingSpinner';
import Card from '@/components/ui/Card';
import { getMemberTaskSchedule } from '@/lib/api/endpoints';
import type { MemberTaskSchedule } from '@/types/api';

// ==================== Helper Functions ====================

/**
 * Group task schedules by user
 */
interface UserTaskGroup {
  userId: string;
  userName: string;
  tasks: Array<{
    id: string;
    taskTitle: string;
    startTime: Date;
    endTime: Date;
    dayOfWeek: string; // "월", "화", etc.
    dateString: string; // "11/22"
    timeString: string; // "09:00-11:00"
  }>;
}

function groupByUser(schedules: MemberTaskSchedule[]): UserTaskGroup[] {
  const grouped = new Map<string, UserTaskGroup>();

  schedules.forEach((schedule) => {
    const userName = schedule.user.name;

    if (!grouped.has(userName)) {
      grouped.set(userName, {
        userId: userName, // Use name as ID since we don't have userId
        userName: userName,
        tasks: [],
      });
    }

    const startDate = new Date(schedule.startTime);
    const endDate = new Date(schedule.endTime);

    grouped.get(userName)!.tasks.push({
      id: schedule.id,
      taskTitle: schedule.roomTask.title,
      startTime: startDate,
      endTime: endDate,
      dayOfWeek: formatDayOfWeek(startDate),
      dateString: formatDate(startDate),
      timeString: formatTimeRange(startDate, endDate),
    });
  });

  return Array.from(grouped.values());
}

function formatDayOfWeek(date: Date): string {
  const days = ['월', '화', '수', '목', '금', '토', '일'];
  const jsDay = date.getDay(); // 0=일요일, 1=월요일, ..., 6=토요일
  const adjustedDay = jsDay === 0 ? 6 : jsDay - 1; // 월요일 기준으로 변환
  return days[adjustedDay];
}

function formatDate(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
}

function formatTimeRange(start: Date, end: Date): string {
  // UTC 시간 사용 (백엔드가 UTC로 저장하므로)
  const startHour = String(start.getUTCHours()).padStart(2, '0');
  const startMin = String(start.getUTCMinutes()).padStart(2, '0');
  let endHour = end.getUTCHours();
  const endMin = String(end.getUTCMinutes()).padStart(2, '0');

  // 다음날 00시 예외처리 (24시로 표시)
  if (endHour === 0 && end.getUTCMinutes() === 0) {
    endHour = 24;
  }

  const endHourStr = String(endHour).padStart(2, '0');
  return `${startHour}:${startMin}-${endHourStr}:${endMin}`;
}

// ==================== Component ====================

export default function ResultPage() {
  const { data, isLoading, error } = useApiData(getMemberTaskSchedule);

  if (isLoading) {
    return <MainLoadingSpinner text="배정 결과를 불러오는 중..." />;
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold">배정 결과를 불러오지 못했습니다.</p>
          <p className="text-sm mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="page-container">
        <div className="text-center text-gray-600">
          <p className="text-lg">아직 배정된 업무가 없습니다.</p>
          <p className="text-sm mt-2">업무 배정이 완료되면 여기에 표시됩니다.</p>
        </div>
      </div>
    );
  }

  const groupedTasks = groupByUser(data);

  return (
    <div className="page-container">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-700 mb-2">
            주간 업무 배정 결과
          </h1>
          <p className="text-gray-600">총 {data.length}개 업무 배정</p>
        </div>

        {/* Task List - Horizontal Layout */}
        <div className="space-y-4">
          {groupedTasks.map((userGroup) => (
            <Card key={userGroup.userId} padding="lg">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Left: User Name */}
                <div className="md:w-32 flex-shrink-0">
                  <div className="font-bold text-lg text-gray-800">
                    {userGroup.userName}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {userGroup.tasks.length}개 업무
                  </div>
                </div>

                {/* Right: Tasks */}
                <div className="flex-1">
                  <div className="space-y-3">
                    {userGroup.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        {/* Day & Date */}
                        <div className="sm:w-16 text-center sm:text-center flex-shrink-0">
                          <div className="font-bold text-primary-600">
                            {task.dayOfWeek}
                          </div>
                          <div className="text-sm text-gray-600">
                            {task.dateString}
                          </div>
                        </div>

                        {/* Time */}
                        <div className="sm:w-32 text-sm text-gray-700 flex-shrink-0">
                          🕐 {task.timeString}
                        </div>

                        {/* Task Title */}
                        <div className="flex-1 font-semibold text-gray-800">
                          {task.taskTitle}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            💡 매주 월요일에 새로운 업무가 배정됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
