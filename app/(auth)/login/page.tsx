import GoogleButton from '@/components/auth/GoogleButton';
import Card from '@/components/ui/Card';

/**
 * 로그인 페이지
 *
 * Google OAuth를 통한 로그인
 * 백엔드 연동 시: /api/auth/google로 리다이렉트
 */

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
      <div className="w-full max-w-md">
        {/* 로고 및 타이틀 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-700 mb-2">
            peaceHub
          </h1>
          <p className="text-gray-600 text-lg">
            룸메이트 업무 분배 시스템
          </p>
        </div>

        {/* 로그인 카드 */}
        <Card padding="lg" shadow>
          <div className="space-y-6">
            {/* 환영 메시지 */}
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                환영합니다!
              </h2>
              <p className="text-gray-600">
                Google 계정으로 간편하게 시작하세요
              </p>
            </div>

            {/* Google 로그인 버튼 */}
            <GoogleButton />

            {/* 추가 정보 */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center">
                로그인하면{' '}
                <a href="#" className="text-primary-600 hover:underline">
                  서비스 약관
                </a>
                {' '}및{' '}
                <a href="#" className="text-primary-600 hover:underline">
                  개인정보 처리방침
                </a>
                에 동의하는 것으로 간주됩니다.
              </p>
            </div>
          </div>
        </Card>

        {/* 푸터 */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>© 2025 peaceHub. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
