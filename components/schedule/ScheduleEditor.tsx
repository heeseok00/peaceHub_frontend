'use client';

import Card from '@/components/ui/Card';
import WeeklyGrid from '@/components/schedule/WeeklyGrid';
import type { WeeklySchedule } from '@/types';

interface ScheduleEditorProps {
  schedule: WeeklySchedule;
  onChange: (schedule: WeeklySchedule) => void;
}

export default function ScheduleEditor({ schedule, onChange }: ScheduleEditorProps) {
  return (
    <>
      {/* 사용 가이드 */}
      <Card padding="md" className="mb-6">
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-800">💡 사용 방법</h3>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>
              <strong>조용시간</strong> 또는 <strong>외출</strong>을 선택하고 시간대를 클릭/드래그하세요
            </li>
            <li>
              <strong>같은 색 클릭 시 지우기</strong>, 다른 색 클릭 시 덮어쓰기
            </li>
            <li>
              <strong>빠른 설정</strong>으로 요일 복사/붙여넣기, 평일/주말 일괄 적용
            </li>
            <li>비는 시간은 아무것도 선택하지 않으면 됩니다</li>
          </ul>
        </div>
      </Card>

      {/* 타임테이블 그리드 */}
      <WeeklyGrid schedule={schedule} onChange={onChange} />
    </>
  );
}