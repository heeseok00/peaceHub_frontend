'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { MainLoadingSpinner } from '@/components/common/LoadingSpinner';
import { getCurrentUser, getTasks, saveTaskPreferences, getRoomMembers, getMyRoom } from '@/lib/api/endpoints';
import type { Preference, User } from '@/types';
import type { RoomTaskWithPreferences } from '@/types/api';

/**
 * 업무 배정 페이지
 *
 * 1지망, 2지망 선호도 제출
 * - 마감: 일요일 23:59:59
 * - 중복 선택 방지
 */

export default function AssignPage() {
  const router = useRouter();

  // 선호도 상태
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');

  // 기존 선호도
  const [existingPreference, setExistingPreference] = useState<Preference | null>(null);

  // 업무 목록 (API에서 가져온 데이터)
  const [tasks, setTasks] = useState<RoomTaskWithPreferences[]>([]);

  // 룸메 데이터
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [roomMembers, setRoomMembers] = useState<User[]>([]);
  const [roomPreferences, setRoomPreferences] = useState<Preference[]>([]);

  // UI 상태
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ first?: string; second?: string }>({});

  /**
   * 초기 데이터 로드
   */
  useEffect(() => {
    const loadData = async () => {
      try {
        const [user, room, tasksData] = await Promise.all([
          getCurrentUser(),
          getMyRoom(),
          getTasks(), // 업무 목록 API 호출
        ]);

        setCurrentUser(user);
        setTasks(tasksData); // 업무 목록 저장

        if (room) {
          const members = await getRoomMembers(room.id);
          setRoomMembers(members);
        }
      } catch (error) {
        console.error('데이터 로드 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  /**
   * 마감 시간 계산 (다음 일요일 23:59:59)
   */
  const getDeadline = (): Date => {
    const now = new Date();
    const day = now.getDay();
    const daysUntilSunday = day === 0 ? 7 : 7 - day;
    const deadline = new Date(now);
    deadline.setDate(now.getDate() + daysUntilSunday);
    deadline.setHours(23, 59, 59, 999);
    return deadline;
  };

  /**
   * 남은 시간 계산
   */
  const getTimeRemaining = (): string => {
    const deadline = getDeadline();
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();

    if (diff <= 0) return '마감됨';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `D-${days}일 ${hours}시간`;
    } else {
      return `${hours}시간 남음`;
    }
  };

  /**
   * 유효성 검사
   */
  const validateForm = (): boolean => {
    const newErrors: { first?: string; second?: string } = {};

    if (!first) {
      newErrors.first = '1지망을 선택해주세요';
    }

    if (!second) {
      newErrors.second = '2지망을 선택해주세요';
    }

    if (first && second && first === second) {
      newErrors.second = '1지망과 다른 집안일을 선택해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 제출
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      await saveTaskPreferences([
        { taskId: first, priority: 1 },
        { taskId: second, priority: 2 }
      ]);
      alert('선호도가 제출되었습니다!');
      router.push('/dashboard');
    } catch (error) {
      console.error('선호도 제출 실패:', error);
      alert('제출에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 선택 옵션 (API에서 가져온 tasks 사용)
  const taskOptions = tasks.map((task) => ({
    value: task.id,
    label: task.title,
  }));

  // 1지망 옵션 (2지망에서 선택한 항목 제외)
  const firstOptions = taskOptions.filter((option) => option.value !== second);

  // 2지망 옵션 (1지망에서 선택한 항목 제외)
  const secondOptions = taskOptions.filter((option) => option.value !== first);

  if (isLoading) {
    return <MainLoadingSpinner text="불러오는 중..." />;
  }

  return (
    <div className="page-container">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary-700 mb-2">
            업무 선호도 제출
          </h1>
          <p className="text-gray-600">
            하고 싶은 집안일을 1지망, 2지망 순으로 선택해주세요
          </p>
          <div className="mt-3">
            <span className="inline-block px-4 py-2 bg-red-100 text-red-700 rounded-lg font-semibold">
              ⏰ 마감까지: {getTimeRemaining()}
            </span>
          </div>
        </div>

        {/* 선호도 선택 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1지망 */}
          <Card padding="md">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              1지망 (가장 하고 싶은 집안일)
            </h3>
            <Select
              options={firstOptions}
              value={first}
              onChange={(value) => {
                setFirst(value);
                setErrors({ ...errors, first: undefined });
              }}
              error={errors.first}
              placeholder="집안일을 선택하세요"
              fullWidth
            />
            {second && (
              <p className="text-xs text-gray-500 mt-2">
                ⚠️ 2지망에서 선택한 "{tasks.find(t => t.id === second)?.title}"은(는) 선택할 수 없습니다
              </p>
            )}
          </Card>

          {/* 2지망 */}
          <Card padding="md">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              2지망 (두 번째로 하고 싶은 집안일)
            </h3>
            <Select
              options={secondOptions}
              value={second}
              onChange={(value) => {
                setSecond(value);
                setErrors({ ...errors, second: undefined });
              }}
              error={errors.second}
              placeholder="집안일을 선택하세요"
              fullWidth
            />
            {first && (
              <p className="text-xs text-gray-500 mt-2">
                ⚠️ 1지망에서 선택한 "{tasks.find(t => t.id === first)?.title}"은(는) 선택할 수 없습니다
              </p>
            )}
          </Card>

          {/* 룸메들의 선호도 (API 데이터 기반) */}
          <Card padding="md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              👥 다른 룸메들의 선호도
            </h3>
            <div className="space-y-2">
              {/* 사람별로 그룹화하여 표시 */}
              {(() => {
                // 사람별로 선호도 데이터 그룹화
                const userPreferences: Record<string, { 
                  userName: string; 
                  first?: string; 
                  second?: string; 
                }> = {};

                tasks.forEach((task) => {
                  task.preferences.forEach((pref) => {
                    if (!userPreferences[pref.userId]) {
                      userPreferences[pref.userId] = { userName: pref.user.name };
                    }
                    if (pref.priority === 1) {
                      userPreferences[pref.userId].first = task.title;
                    } else if (pref.priority === 2) {
                      userPreferences[pref.userId].second = task.title;
                    }
                  });
                });

                const userList = Object.entries(userPreferences);

                if (userList.length === 0) {
                  return (
                    <p className="text-sm text-gray-500 text-center py-4">
                      아직 아무도 선호도를 제출하지 않았습니다
                    </p>
                  );
                }

                return userList.map(([userId, data]) => (
                  <div key={userId} className="py-2 px-3 bg-gray-50 rounded">
                    <div className="font-medium text-gray-800 mb-2">
                      {data.userName}
                    </div>
                    <div className="space-y-1 pl-4">
                      {data.first && (
                        <div className="text-sm text-gray-700">
                          1지망: {data.first}
                        </div>
                      )}
                      {data.second && (
                        <div className="text-sm text-gray-700">
                          2지망: {data.second}
                        </div>
                      )}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </Card>

          {/* 안내 */}
          <Card padding="md" className="bg-yellow-50 border-yellow-200">
            <p className="text-sm text-gray-700">
              💡 <strong>알아두세요:</strong> 선호도는 일요일 자정까지 수정
              가능하며, 이후 자동으로 집안일이 배정됩니다.
            </p>
          </Card>

          {/* 제출 버튼 */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={isSubmitting || !first || !second}
          >
            {isSubmitting
              ? '제출 중...'
              : existingPreference
              ? '선호도 수정하기'
              : '선호도 제출하기'}
          </Button>
          
          {/* 선택 필수 안내 */}
          {(!first || !second) && (
            <p className="text-sm text-gray-500 text-center -mt-2">
              1지망과 2지망을 모두 선택해주세요
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
