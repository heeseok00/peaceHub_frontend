'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import ScheduleEditor from '@/components/schedule/ScheduleEditor';
import { MainLoadingSpinner } from '@/components/common/LoadingSpinner';
import { saveSchedule, getTemporarySchedule } from '@/lib/api/client';
import { createEmptySchedule } from '@/lib/utils/scheduleHelpers';
import type { WeeklySchedule } from '@/types';

export default function MainSchedulePage() {
  const [schedule, setSchedule] = useState<WeeklySchedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadSchedule = async () => {
      setIsLoading(true);
      try {
        const data = await getTemporarySchedule();
        setSchedule(data);
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
   * 변경사항 저장
   */
  const handleSaveChanges = async () => {
    if (!schedule) return;

    setIsSubmitting(true);
    try {
      await saveSchedule(schedule);
      alert('스케줄이 성공적으로 저장되었습니다.');
    } catch (error) {
      console.error('스케줄 저장 실패:', error);
      alert('스케줄 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !schedule) {
    return <MainLoadingSpinner text="내 스케줄을 불러오는 중..." />;
  }

  return (
    <div className="page-container">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">주간 타임테이블 수정</h1>
          <p className="text-sm text-gray-500 mt-1">
            매주 반복되는 일정을 수정합니다. (일요일 밤 12시까지 수정 가능)
          </p>
        </div>

        <ScheduleEditor schedule={schedule} onChange={setSchedule} />

        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleSaveChanges}
            variant="primary"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? '저장 중...' : '변경사항 저장'}
          </Button>
        </div>
      </div>
    </div>
  );
}