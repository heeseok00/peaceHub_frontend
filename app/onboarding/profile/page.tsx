'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { MainLoadingSpinner } from '@/components/common/LoadingSpinner';
import { COUNTRIES, LANGUAGES } from '@/types';
import { updateProfile, getCurrentUser } from '@/lib/api/endpoints';

/**
 * 프로필 설정 페이지
 *
 * Google 로그인 후 처음 진입하는 페이지
 * 실명, 국가, 언어를 필수로 입력받습니다.
 *
 * 완료 후 /join-room으로 이동
 */

export default function ProfilePage() {
  const router = useRouter();

  // 폼 상태
  const [realName, setRealName] = useState('');
  const [country, setCountry] = useState('대한민국'); // 고정값
  const [language, setLanguage] = useState('한국어'); // 고정값

  // 에러 상태
  const [errors, setErrors] = useState<{
    realName?: string;
    country?: string;
    language?: string;
  }>({});

  // 로딩 상태
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * 페이지 로드 시 현재 사용자 정보 확인
   * 이미 프로필이 설정되어 있으면 다음 단계로 스킵
   */
  useEffect(() => {
    const checkProfile = async () => {
      try {
        const user = await getCurrentUser();

        if (user) {
          // 프로필이 완전히 설정되어 있으면 다음 단계로
          if (user.realName && user.country && user.language) {
            router.push('/onboarding/join-room');
            return;
          }

          // 부분적으로 설정되어 있으면 폼에 채우기
          if (user.realName) setRealName(user.realName);
          if (user.country) setCountry(user.country);
          if (user.language) setLanguage(user.language);
        }
      } catch (error) {
        // 에러 무시 (사용자 정보 조회 실패)
      } finally {
        setIsLoading(false);
      }
    };

    checkProfile();
  }, [router]);

  /**
   * 폼 유효성 검사
   */
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!realName.trim()) {
      newErrors.realName = '실명을 입력해주세요';
    } else if (realName.trim().length < 2) {
      newErrors.realName = '실명은 2자 이상 입력해주세요';
    }

    // country, language는 고정값이므로 검사 불필요

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 폼 제출 핸들러
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검사
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // API 호출 (더미 데이터 반환)
      await updateProfile({
        realName: realName.trim(),
        country,
        language,
      });

      // 성공 시 다음 페이지로 이동
      router.push('/onboarding/join-room');
    } catch (error) {
      alert('프로필 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 국가 옵션 변환
  const countryOptions = COUNTRIES.map((c) => ({
    value: c.code,
    label: c.name,
  }));

  // 언어 옵션 변환
  const languageOptions = LANGUAGES.map((l) => ({
    value: l.code,
    label: l.name,
  }));

  // 로딩 중
  if (isLoading) {
    return <MainLoadingSpinner text="프로필 정보를 불러오는 중..." />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4 py-8">
      <div className="w-full max-w-lg">
        {/* 헤더 */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary-700 mb-2">
            프로필 설정
          </h1>
          <p className="text-gray-600">
            기본 정보를 입력해주세요
          </p>
        </div>

        {/* 폼 카드 */}
        <Card padding="lg" shadow>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 실명 입력 */}
            <Input
              label="실명"
              type="text"
              placeholder="홍길동"
              value={realName}
              onChange={(e) => setRealName(e.target.value)}
              error={errors.realName}
              fullWidth
              required
            />

            {/* 국가, 언어는 고정값 (대한민국, 한국어) - 숨김 처리 */}
            <input type="hidden" value={country} />
            <input type="hidden" value={language} />

            {/* 제출 버튼 */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={isSubmitting}
            >
              {isSubmitting ? '저장 중...' : '다음'}
            </Button>
          </form>
        </Card>

        {/* 프로그레스 표시 */}
        <div className="mt-6">
          <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary-600"></div>
            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
          </div>
          <p className="text-center text-sm text-gray-600 mt-2">
            1 / 3 단계: 프로필 설정
          </p>
        </div>
      </div>
    </div>
  );
}
