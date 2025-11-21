'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import ScheduleEditor from '@/components/schedule/ScheduleEditor';
import { saveSchedule } from '@/lib/api/endpoints';
import { getWeekStart } from '@/lib/utils/dateHelpers';
import type { WeeklySchedule, DayOfWeek, HourlySchedule } from '@/types';

/**
 * 빈 스케줄 생성
 */
const createEmptySchedule = (): WeeklySchedule => {
  const days: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const schedule = {} as WeeklySchedule;

  days.forEach((day) => {
    const hours: HourlySchedule = {};
    for (let i = 0; i < 24; i++) {
      hours[i] = null;
    }
    schedule[day] = hours;
  });

  return schedule;
};

export default function OnboardingSchedulePage() {
  const router = useRouter();

  const [schedule, setSchedule] = useState<WeeklySchedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadSchedule = async () => {
      setIsLoading(true);
      try {
        // 온보딩은 ACTIVE 스케줄을 사용하지 않고 항상 빈 스케줄로 시작
        // (신규 유저이므로 기존 스케줄이 없음)
        setSchedule(createEmptySchedule());
      } catch (error) {
        console.error('스케줄 로드 실패:', error);
        setSchedule(createEmptySchedule());
      } finally {
        setIsLoading(false);
      }
    };
    loadSchedule();
  }, []);

  /**
   * 저장 및 다음 단계로 이동
   * 온보딩은 현재 주 스케줄(ACTIVE)로 저장됨
   */
  const handleSubmit = async () => {
    if (!schedule) return;

    setIsSubmitting(true);
    try {
      const weekStart = getWeekStart(new Date()); // 현재 주 월요일
      await saveSchedule(schedule, weekStart);
      router.push('/dashboard');
    } catch (error) {
      console.error('스케줄 저장 실패:', error);
      alert('스케줄 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 건너뛰기 (나중에 설정)
   */
  const handleSkip = () => {
    if (confirm('타임테이블을 나중에 설정하시겠습니까?')) {
      router.push('/dashboard');
    }
  };

  if (isLoading || !schedule) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">스케줄을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 이번 주 월요일 날짜 계산
  const thisWeekStart = new Date(getWeekStart(new Date()));
  const thisWeekEnd = new Date(thisWeekStart);
  thisWeekEnd.setDate(thisWeekEnd.getDate() + 6);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary-700 mb-2">
            주간 타임테이블 설정
          </h1>
          <p className="text-gray-600">
            <strong className="text-primary-600">
              이번 주 ({thisWeekStart.getMonth() + 1}월 {thisWeekStart.getDate()}일 ~ {thisWeekEnd.getMonth() + 1}월 {thisWeekEnd.getDate()}일)
            </strong> 스케줄을 설정해주세요 (일요일 밤 12시까지 수정 가능)
          </p>
        </div>

        <ScheduleEditor schedule={schedule} onChange={setSchedule} />

        {/* 액션 버튼 */}
        <div className="mt-8 flex gap-3 justify-center">
          <Button
            onClick={handleSkip}
            variant="outline"
            size="lg"
            disabled={isSubmitting}
          >
            나중에 설정
          </Button>
          <Button
            onClick={handleSubmit}
            variant="primary"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? '저장 중...' : '저장하고 시작하기'}
          </Button>
        </div>

        {/* 프로그레스 표시 */}
        <div className="mt-8">
          <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary-600"></div>
            <div className="w-3 h-3 rounded-full bg-primary-600"></div>
            <div className="w-3 h-3 rounded-full bg-primary-600"></div>
          </div>
          <p className="text-center text-sm text-gray-600 mt-2">
            3 / 3 단계: 타임테이블 설정
          </p>
        </div>
      </div>
    </div>
  );
}
