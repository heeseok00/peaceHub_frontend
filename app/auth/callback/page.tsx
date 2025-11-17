'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainLoadingSpinner } from '@/components/common/LoadingSpinner';

/**
 * Google OAuth Callback 페이지
 *
 * 백엔드에서 쿠키를 설정한 후 이 페이지로 리다이렉트됨
 * 이 페이지는 단순히 온보딩 프로필 페이지로 리다이렉트
 */
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // 백엔드에서 이미 세션 쿠키를 설정했으므로
    // 프로필 설정 페이지로 리다이렉트
    router.push('/onboarding/profile');
  }, [router]);

  return <MainLoadingSpinner text="로그인 처리 중..." />;
}
