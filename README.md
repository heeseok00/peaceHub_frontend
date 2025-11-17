# PeaceHub Frontend

피스허브 - 공동생활을 위한 집안일 관리 플랫폼 프론트엔드

## 📌 프로젝트 개요

PeaceHub는 룸메이트들이 집안일을 공평하게 분배하고 관리할 수 있도록 돕는 웹 애플리케이션입니다.

### 기술 스택

- **프레임워크**: Next.js 15.1.4 (App Router)
- **라이브러리**: React 19.0.0
- **언어**: TypeScript 5
- **스타일링**: Tailwind CSS 3.4.1 + Custom globals.css
- **상태 관리**: React Hooks (useState, useEffect)
- **린팅**: ESLint (eslint-config-next)
- **패키지 매니저**: npm

### 주요 기능

- 🔐 Google OAuth 로그인 (현재 Mock)
- 👥 룸메이트 초대 및 관리
- 📅 주간 타임테이블 작성 (조용시간, 외출시간 등)
- 🎯 집안일 선호도 제출 (1지망, 2지망)
- 📊 자동 업무 배정 알고리즘
- 📈 월간 캘린더 및 타임라인 대시보드

## 🚀 빠른 시작

### 개발 서버 실행

```bash
npm install
npm run dev
```

개발 서버는 http://localhost:3000 에서 실행됩니다.

### 빌드

```bash
npm run build
npm run start
```

### 린트

```bash
npm run lint
```

## 📁 프로젝트 구조

```
/home/juhwan/front/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 인증 페이지 (로그인)
│   ├── (main)/                   # 메인 앱 (헤더+사이드바 레이아웃)
│   │   ├── dashboard/            # 대시보드 (캘린더 + 타임라인)
│   │   ├── schedule/             # 주간 스케줄 수정
│   │   ├── assign/               # 선호도 제출
│   │   └── result/               # 배정 결과 조회
│   ├── onboarding/               # 온보딩 플로우
│   │   ├── profile/              # 프로필 설정
│   │   ├── join-room/            # 룸 생성/가입
│   │   └── schedule/             # 초기 스케줄 작성
│   └── globals.css               # 전역 스타일 (270+ lines)
│
├── components/                   # 재사용 가능한 컴포넌트
│   ├── ui/                       # 기본 UI 컴포넌트
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   └── Modal.tsx
│   ├── common/                   # 공통 컴포넌트
│   │   ├── TimelineRenderer.tsx  # 타임라인 렌더링 (통합)
│   │   ├── LoadingSpinner.tsx    # 로딩 스피너
│   │   ├── PageContainer.tsx     # 페이지 컨테이너
│   │   ├── EmptyState.tsx        # 빈 상태 UI
│   │   └── OnboardingProgress.tsx
│   ├── layout/                   # 레이아웃 컴포넌트
│   │   ├── Header.tsx
│   │   └── Sidebar.tsx
│   ├── dashboard/                # 대시보드 전용
│   │   ├── MonthlyCalendar.tsx
│   │   ├── TimelineBar.tsx
│   │   ├── CombinedTimelineBar.tsx
│   │   └── FilterButtons.tsx
│   └── schedule/                 # 스케줄 전용
│       ├── WeeklyGrid.tsx
│       └── ScheduleEditor.tsx
│
├── lib/                          # 비즈니스 로직 및 유틸리티
│   ├── api/                      # API 레이어
│   │   ├── client.ts             # Mock API 함수들
│   │   ├── mockData.ts           # 테스트용 Mock 데이터
│   │   └── endpoints.ts          # 실제 백엔드 엔드포인트 (준비됨)
│   ├── utils/                    # 유틸리티 함수
│   │   ├── dateHelpers.ts        # 날짜/주 계산 (17 functions)
│   │   ├── scheduleHelpers.ts    # 스케줄 조작 (9 functions)
│   │   ├── taskHelpers.ts        # 업무 정보 유틸리티
│   │   └── apiTransformers.ts    # Frontend ↔ Backend 변환
│   └── constants/                # 상수 정의
│       ├── tasks.ts              # 업무 정보 및 가중치
│       ├── taskEmojis.ts         # 업무별 이모지
│       ├── taskTimes.ts          # 업무별 시간대
│       └── colors.ts             # 색상 스킴
│
├── hooks/                        # Custom React Hooks
│   ├── useApiData.ts             # 표준 데이터 패칭 훅
│   └── useScheduleEditor.ts      # 스케줄 편집 로직
│
├── types/                        # TypeScript 타입 정의
│   ├── index.ts                  # 프론트엔드 타입
│   └── api.ts                    # 백엔드 API 타입
│
└── public/
    └── images/
```

## 🏗️ 아키텍처 하이라이트

### 1. Mock API 패턴 (백엔드 연동 준비 완료)

현재 모든 API 호출은 `lib/api/client.ts`에서 Mock 데이터를 반환합니다. 백엔드 연동 시 각 함수의 내부 구현만 `fetch()` 호출로 변경하면 됩니다.

```typescript
// 현재 (Mock)
export async function getCurrentUser(): Promise<User> {
  await delay(500);
  return mockUsers.find(u => u.id === 'user-5')!;
}

// 백엔드 연동 후
export async function getCurrentUser(): Promise<User> {
  const response = await fetch('/api/users/', {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  const backendData = await response.json();
  return fromBackendUser(backendData); // 타입 변환
}
```

### 2. 타입 변환 레이어

프론트엔드와 백엔드의 데이터 형식 차이를 `lib/utils/apiTransformers.ts`에서 처리합니다.

- **요일**: Frontend `'mon'` ↔ Backend `'MONDAY'`
- **시간**: Frontend 시간(0-23) ↔ Backend 분(0-1439)
- **TimeSlot**: Frontend `'quiet' | 'out' | null` ↔ Backend `'QUIET' | 'BUSY'` + TimeBlock

### 3. 통합 타임라인 렌더링

`components/common/TimelineRenderer.tsx`에서 모든 타임라인 렌더링을 통합 관리합니다.

```typescript
import { TimeLabels, TimelineBlocks, TimelineRow } from '@/components/common/TimelineRenderer';

// 시간 라벨 (2시간 간격, 0시 표시, 24시 미표시)
<TimeLabels interval={2} showZero />

// 타임라인 행 (자동으로 연속된 블록 병합)
<TimelineRow label="월요일" blocks={blocks} />
```

### 4. globals.css 기반 일관성

`app/globals.css`에 프로젝트 전체에서 사용하는 CSS 변수와 컴포넌트 클래스가 정의되어 있습니다.

```css
/* CSS 변수 */
:root {
  --time-quiet: #4b5563;
  --time-task: #10b981;
  --header-height: 4rem;
}

/* 공통 클래스 */
.page-container { /* 모든 메인 페이지 */}
.timeline-container { /* 타임라인 래퍼 */}
.time-slot-quiet { /* 조용시간 색상 */}
```

### 5. 주간 배정 시스템

- 주의 시작: **월요일** (일요일 아님)
- 배정 단위: `weekStart` 키 (YYYY-MM-DD 형식의 월요일 날짜)
- 선호도 마감: 매주 **일요일 23:59:59**
- 유틸리티: `getWeekStart(date)`, `getDayOfWeek(date)`

## 🔄 최근 리팩토링 (2025-01)

### 코드 중복 제거

- **193줄 제거** (29% 감소)
- 8개 중복 함수 통합 (`getWeekStart`, `createEmptySchedule` 등)
- 3개 타임라인 구현 → 1개 통합 컴포넌트

### 재사용성 개선

- ✅ Custom Hooks 추가 (`useApiData`, `useScheduleEditor`)
- ✅ 공통 컴포넌트 추가 (LoadingSpinner, PageContainer, EmptyState 등)
- ✅ 유틸리티 함수 모듈화 (26개 함수)
- ✅ globals.css 확장 (28 → 270 lines)

### 백엔드 연동 준비

- ✅ Backend API 타입 정의 (`types/api.ts`)
- ✅ 데이터 변환 레이어 구현 (`apiTransformers.ts`)
- ✅ 실제 엔드포인트 구조 정의 (`lib/api/endpoints.ts`)

## 📚 개발 가이드

자세한 개발 가이드는 [CLAUDE.md](./CLAUDE.md)를 참고하세요.

### 주요 컨벤션

- **TypeScript**: PascalCase (컴포넌트), camelCase (함수/변수), SCREAMING_SNAKE_CASE (상수)
- **스타일링**: Tailwind CSS + globals.css 클래스 우선 사용
- **데이터 패칭**: `useApiData` 훅 사용
- **타임라인**: `TimelineRenderer` 컴포넌트 사용
- **페이지 레이아웃**: `.page-container` 클래스 사용

### 코드 작성 체크리스트

- [ ] globals.css의 기존 클래스 확인 후 재사용
- [ ] 날짜 계산은 `lib/utils/dateHelpers.ts` 함수 사용
- [ ] 타임라인은 `TimelineRenderer` 컴포넌트 사용
- [ ] API 호출은 `lib/api/client.ts` 함수 사용
- [ ] 로딩 상태는 `LoadingSpinner` 컴포넌트 사용

## 🔧 배포

### Vercel 배포

1. GitHub 저장소를 Vercel에 연결
2. 자동으로 빌드 및 배포됨
3. 환경 변수 설정 (추후 백엔드 연동 시)

### 환경 변수 (예정)

```env
NEXT_PUBLIC_API_URL=https://api.peacehub.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id
```

## 📝 라이선스

MIT License

## 👥 기여자

- 허주환 (juhwan0628)