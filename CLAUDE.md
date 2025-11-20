# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Architecture Overview

### Tech Stack

- **Next.js 15.1.4** with App Router
- **React 19.0.0** with TypeScript 5
- **Tailwind CSS 3.4.1** for styling
- **No state management library** (React hooks only)
- **No external UI library** (custom components)

### Routing Structure

The app uses **Next.js App Router with route groups**:

- `(auth)/` - Authentication pages (no header/sidebar layout)
- `(main)/` - Main application with shared Header + Sidebar layout
- `onboarding/` - Multi-step onboarding flow (profile → join-room → schedule)

**Main app flow:**
1. Root (`/`) → redirects to `/login`
2. Login (Google OAuth) → `/onboarding/profile`
3. Onboarding: profile → join-room → schedule → `/dashboard`
4. Main app: dashboard, schedule, assign, result pages

### Data Layer (API Integration)

**Location:** `lib/api/endpoints.ts` and `lib/api/client.ts`

The app uses **Real backend APIs** with fallback for unimplemented endpoints:

- `endpoints.ts` - **Real backend API implementation** (fully integrated)
- `client.ts` - **Fallback layer** for backend-unimplemented APIs (returns empty data, 404 prevention)

**API Function Categories:**

**✅ Real APIs (use endpoints.ts):**
- Authentication: `getCurrentUser()`, `getGoogleAuthUrl()`
- Profile: `updateProfile(data)`
- Room: `createRoom()`, `joinRoom()`
- Schedule: `getActiveSchedule()`, `getTemporarySchedule()`, `saveSchedule()`, `getDailySchedule()`, `getMemberDailySchedule()`

**⏳ Fallback APIs (use client.ts - backend pending):**
- Room: `getMyRoom()`, `getRoomMembers()` → return `null`, `[]`
- Schedule: `getAllSchedules()` → return `new Map()`
- Preferences: `getTasks()`, `getMyPreference()`, `savePreference()`, `getRoomPreferences()` → return empty/TASKS constant
- Assignments: `getCurrentAssignments()`, `getAssignmentsByWeek()`, `getMyAssignments()` → return `[]`

### Component Organization

```
components/
├── ui/              # Reusable UI primitives (Button, Card, Input, Select, Modal)
├── layout/          # Header (hamburger menu), Sidebar (navigation)
├── auth/            # GoogleButton
├── common/          # Shared components (NEW - refactored for reusability)
│   ├── LoadingSpinner.tsx       # MainLoadingSpinner, InlineSpinner
│   ├── PageContainer.tsx        # Page layout wrappers
│   ├── EmptyState.tsx           # Empty state displays
│   ├── OnboardingProgress.tsx   # Progress indicators
│   └── TimelineRenderer.tsx     # Timeline rendering logic (IMPORTANT)
├── dashboard/       # MonthlyCalendar, TimelineBar, FilterButtons, DailyTasks
├── schedule/        # ScheduleEditor, WeeklyGrid
└── assign/          # (future components)

hooks/
├── useApiData.ts         # Standard data fetching pattern
└── useScheduleEditor.ts  # Schedule editing logic

lib/
├── api/
│   ├── client.ts         # Fallback API (backend-unimplemented endpoints)
│   └── endpoints.ts      # Real API (fully integrated)
├── constants/
│   ├── colors.ts         # Unified color schemes
│   ├── tasks.ts          # Task constants (TASKS, EMOJIS, TIME_RANGES)
│   └── (deprecated: taskEmojis.ts, taskTimes.ts - use tasks.ts instead)
└── utils/
    ├── dateHelpers.ts        # Date/week calculations
    ├── scheduleHelpers.ts    # Schedule manipulation
    ├── taskHelpers.ts        # Task info utilities
    └── apiTransformers.ts    # Frontend ↔ Backend data conversion

types/
├── index.ts    # Frontend UI types
└── api.ts      # Backend API types (NEW)
```

**Component Design Pattern:**
- **Variant-based styling:** `<Button variant="primary|secondary|outline" />`
- **Composition over configuration:** Small, focused components
- **Props-based customization:** size, fullWidth, padding, shadow, etc.
- **TypeScript interfaces** for all props
- **Client components** marked with `'use client'`

### Type System

**Frontend Types:** `types/index.ts`
- Core types: `User`, `Room`, `Task`, `Preference`, `Assignment`, `WeeklySchedule`
- `TASKS`: 5 household tasks with weights (bathroom: 9, trash: 7, vacuum: 6, laundry: 4, dishes: 2)
- `DayOfWeek`: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
- `TimeSlot`: 'quiet' | 'out' | null (null = free time)
- `COUNTRIES`, `LANGUAGES`, `DAY_NAMES` for i18n support

**Backend Types:** `types/api.ts` (NEW)
- API request/response types separate from UI types
- `BackendDayOfWeek`: 'MONDAY' | 'TUESDAY' | ... (uppercase)
- `BackendTimeBlockType`: 'QUIET' | 'BUSY' | 'TASK'
- Time representation: minutes from midnight (0-1439)

**Type Conversion:** Use `lib/utils/apiTransformers.ts`
- `toBackendDay()` / `fromBackendDay()` - DayOfWeek conversion
- `toBackendSchedule()` / `fromBackendSchedule()` - Schedule format conversion

## Backend API Notes

### Error Handling
- **401 Unauthorized**: 자동으로 `/login`으로 리디렉션
- **403 Forbidden** (not participate in room): 자동으로 `/onboarding/join-room`으로 리디렉션
- **201 Created**: body가 없을 수 있음 (신규 유저 스케줄 저장 시)

### Schedule API 특징
- **URL 컨벤션**: camelCase (`activeSchedules`, `temporarySchedules`)
- **dayOfWeek 필드**: 백엔드 응답에 포함되지 않을 수 있음 → startTime에서 자동 추출
- **memberDaily**: QUIET + TASK만 필터링하여 반환 (외출/빈 시간 제외)

## Important Conventions

### globals.css Usage (IMPORTANT - Updated)

**All main pages must use `.page-container` class:**

```typescript
// ✅ Correct - using globals.css class
<div className="page-container">
  {/* content */}
</div>

// ❌ Wrong - manual inline classes
<div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-primary-50 to-primary-100 px-4 py-8">
  {/* content */}
</div>
```

**Available globals.css classes:**
- **Layout:** `.page-container`, `.page-container-full`
- **Cards:** `.card`, `.card-compact`
- **Buttons:** `.btn-primary`, `.btn-secondary`, `.btn-outline`, `.btn-sm`
- **Timeline:** `.timeline-container`, `.timeline-row`, `.timeline-bar`, `.timeline-cell`
- **Time Slots:** `.time-slot-quiet`, `.time-slot-out`, `.time-slot-task`, `.time-slot-free`
- **Utilities:** `.bg-page-gradient`, `.spinner`, `.glass`, `.focus-ring`

### Timeline Rendering Pattern (IMPORTANT - New)

**Always use TimelineRenderer components** (NOT manual rendering):

```typescript
import { TimeLabels, TimelineBlocks, TimelineRow } from '@/components/common/TimelineRenderer';

// Time labels (0시 정렬, 블록 왼쪽 정렬)
<TimeLabels interval={2} showZero />

// Timeline blocks
<TimelineBlocks blocks={blocks} cellHeight="h-8" readOnly />

// Complete timeline row (label + blocks)
<TimelineRow label="월" blocks={blocks} />
```

**Do NOT manually render time labels or blocks** - this creates code duplication.

### Utility Functions (Use Shared Utils)

**Date/Time:**
```typescript
import { getWeekStart, getDayOfWeek, formatDateKorean } from '@/lib/utils/dateHelpers';

const weekStart = getWeekStart(new Date());
const dayOfWeek = getDayOfWeek(new Date());
```

**Schedule:**
```typescript
import { createEmptySchedule, validateSchedule } from '@/lib/utils/scheduleHelpers';

const schedule = createEmptySchedule();
```

**Tasks:**
```typescript
import { getTaskInfo, getUserName } from '@/lib/utils/taskHelpers';

const taskInfo = getTaskInfo('bathroom'); // { id, name, emoji, weight }
const userName = getUserName('user-1', users);
```

### Week-based Assignment System

- **Week starts on Monday** (not Sunday)
- Assignments are keyed by `weekStart` date (YYYY-MM-DD format of Monday)
- Use helper functions: `getWeekStart(date)`, `getDayOfWeek(date)` from `lib/utils/dateHelpers.ts`
- Deadline for preference submission: **Next Sunday 23:59:59**

### File Organization

- Page components in `app/` directories (`page.tsx`)
- Shared layouts in `layout.tsx` files
- Reusable components in `components/` (use `components/common/` for shared utilities)
- Business logic/data in `lib/`
- Utility functions in `lib/utils/`
- Constants in `lib/constants/`
- All TypeScript files use `.tsx` for components, `.ts` for utilities

### Naming Conventions

- **PascalCase** for components and types
- **camelCase** for functions and variables
- **SCREAMING_SNAKE_CASE** for constants
- File names match component names

### Data Fetching Pattern (Updated - Use Hooks)

**Recommended:** Use `useApiData` hook:

```typescript
'use client';
import { useApiData } from '@/hooks/useApiData';
import { MainLoadingSpinner } from '@/components/common/LoadingSpinner';
import { getCurrentUser } from '@/lib/api/endpoints';

export default function MyPage() {
  const { data, isLoading, error } = useApiData(() => getCurrentUser());

  if (isLoading) return <MainLoadingSpinner />;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{/* render data */}</div>;
}
```

**Old pattern** (still works but not recommended):
```typescript
const [data, setData] = useState<DataType | null>(null);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  const loadData = async () => {
    try {
      const result = await apiFunction();
      setData(result);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  loadData();
}, []);
```

### Form Validation

- Client-side validation before submission
- Error state object: `{ fieldName?: string }`
- Display errors inline with form fields
- Simple `alert()` for success/error messages (no toast library yet)

### Styling Conventions

- **Tailwind CSS + globals.css** (prefer globals.css classes for common patterns)
- Custom primary color palette (blue theme): `primary-50` to `primary-900`
- **Prefer globals.css classes:**
  - `.page-container` instead of manual min-height/background
  - `.card-compact` instead of manual bg-white/rounded/shadow
  - `.time-slot-*` instead of hardcoded bg colors
- Common patterns:
  - Rounded corners: `rounded-lg`
  - Shadows: `shadow-sm`, `shadow-md`
  - Responsive: Mobile-first approach with `md:`, `lg:` breakpoints

### UI/UX Conventions

- **No task weights shown to users** (weights are internal only)
- **Emoji indicators:** 🚽 bathroom, 🗑️ trash, 🧹 vacuum, 👔 laundry, 🍽️ dishes
- **Color coding for time slots:**
  - Dark gray (`time-slot-quiet`): quiet time
  - Red (`time-slot-out`): busy/out
  - Green (`time-slot-task`): task time
  - Light gray (`time-slot-free`): free time
- **Active menu item:** `bg-blue-50 text-blue-600 border-l-4 border-blue-600`
- **Selected date:** `border-2 border-primary-400`
- **Today's date:** `border-2 border-primary-500`
- **Timeline numbers:** Align to left edge of blocks (0, 2, 4... 22)

## Project-Specific Notes

### Backend Integration Status

**✅ Phase 1-4 Complete - 온보딩 API 완전 통합**

All onboarding and main app Real APIs are fully integrated:

- **Authentication**
  - ✅ Google OAuth login (`GET /api/auth/google`)
  - ✅ OAuth callback with session/cookie
  - ✅ Auto-redirect to `/auth/callback` → `/onboarding/profile`
  - ✅ Session-based auth (credentials: 'include')
  - ✅ 401 auto-redirect to login

- **User Profile**
  - ✅ Get current user (`GET /api/users/me`)
  - ✅ Update profile (`PUT /api/users/profile`)
  - ℹ️ `country`, `language` fields stored in localStorage (backend unsupported)

- **Room**
  - ✅ Create room (`POST /api/rooms`)
  - ✅ Join room (`POST /api/rooms/join`)
  - ⏳ Get my room (`GET /api/rooms/my`) - returns `null` (pending backend)
  - ⏳ Get room members (`GET /api/rooms/:id/members`) - returns `[]` (pending backend)

- **Schedule** (ScheduleStatus: ACTIVE/TEMPORARY)
  - ✅ Get active schedule (`GET /api/schedules/activeSchedules`) - 현재 주
  - ✅ Get temporary schedule (`GET /api/schedules/temporarySchedules`) - 다음 주
  - ✅ Save schedule (`POST /api/schedules`)
    - ISO timestamp format with date
    - Explicit FREE blocks (24h coverage)
    - Onboarding: ACTIVE, Main: TEMPORARY
    - 신규 유저: 201 status code만 반환 (body 없음)
    - 기존 유저: 201 + JSON body 반환
  - ✅ Get daily schedule (`GET /api/schedules/daily?date=YYYY-MM-DD`) - 날짜별 스케줄 (ACTIVE + TEMPORARY + History)
  - ✅ Get member daily schedule (`GET /api/schedules/memberDaily?date=YYYY-MM-DD`) - 방 멤버 전체 스케줄 (QUIET + TASK만)
  - ⏳ Get all schedules - returns `new Map()` (pending backend)

- **Preferences**
  - ⏳ All APIs return empty data (pending backend)

- **Assignments**
  - ⏳ All APIs return `[]` (pending backend)

**Data Transformers:**
- `lib/utils/apiTransformers.ts` handles frontend ↔ backend conversion
- DayOfWeek: `'mon'` ↔ `'MONDAY'` (백엔드 응답에서 dayOfWeek 필드가 없으면 startTime에서 자동 추출)
- TimeSlot: `'quiet'` ↔ `'QUIET'`, `'out'` ↔ `'BUSY'`, `null` ↔ `'FREE'`, `'task'` ↔ `'TASK'`
- Time: hours (0-23) ↔ ISO timestamps
- User: `realName` ↔ `name`, `workLoad` 추가, `room` 정보 포함
- Schedule: `fromBackendScheduleBlocks()` - 업무 정보(taskInfo) 포함 변환

### Authentication Status

- ✅ **Google OAuth integrated** with real backend
- ✅ **Session-based authentication** working (connect.sid cookie)
- ✅ **Protected routes** via `checkAuth` middleware (backend)
- ✅ **401 auto-redirect** to login page (global error handling in `endpoints.ts`)
- ✅ **403 auto-redirect** to onboarding page (방 미참여 시 - `requireRoom` middleware)
- ✅ **Automatic logout on session expiry** - all API calls checked
- ⚠️ Frontend route protection not implemented (optional for SPA)

### Client vs Server Components

- Most components are **Client Components** (`'use client'`)
- Pages that need interactivity (state, effects, event handlers) use `'use client'`
- No Server Components pattern implemented yet
- Consider refactoring for SSR/RSC optimization later

### State Management

- **No global state library** (no Redux, Zustand, Jotai, etc.)
- Using local `useState`, custom hooks, and props
- Custom hooks available: `useApiData`, `useScheduleEditor`
- For future: Consider adding state management if complexity grows

### Deployment

- Designed for **Vercel** deployment (Next.js native)
- Connect GitHub repo to Vercel for automatic deployments
- Build command: `npm run build`
- Output directory: `.next/` (default)
- Environment variables:
  - `NEXT_PUBLIC_API_BASE_URL` - Backend API URL (required)

## Best Practices & Guidelines

### DO's ✅

- Use `<MainLoadingSpinner />` for loading states
- Use `.page-container` for page layouts
- Use `TimelineRenderer` components for timelines
- Use utility functions from `lib/utils/`
- Use custom hooks (`useApiData`, `useScheduleEditor`)
- Use globals.css classes for common patterns
- Import constants from consolidated files (`lib/constants/tasks.ts`)

### DON'Ts ❌

- Don't manually render time labels/blocks
- Don't duplicate utility functions
- Don't use inline classes when globals.css class exists
- Don't create duplicate loading spinners
- Don't import from deprecated constant files
- Don't manually calculate week start/day of week (use utilities)

### Code Review Checklist

Before committing, verify:
- [ ] No duplicate utility functions
- [ ] Using `.page-container` for main pages
- [ ] Using `<MainLoadingSpinner />` for loading
- [ ] Using `TimelineRenderer` for timelines
- [ ] Using utility functions from `lib/utils/`
- [ ] No hardcoded colors (use globals.css classes)
- [ ] TypeScript types properly imported
- [ ] No console.errors in production code

## Frontend Pages & Routes

### Authentication Pages (`(auth)/`)

- **`/login`** - Google OAuth 로그인 페이지
  - Google 계정으로 로그인
  - 성공 시 → `/onboarding/profile`

### Onboarding Pages (`onboarding/`)

온보딩 플로우 (3단계):

1. **`/onboarding/profile`** - 프로필 설정
   - 실명, 국가, 언어 입력
   - 다음 → `/onboarding/join-room`

2. **`/onboarding/join-room`** - 방 생성/참여
   - 새 방 만들기 or 초대 코드로 참여
   - 다음 → `/onboarding/schedule`

3. **`/onboarding/schedule`** - 초기 타임테이블 설정
   - 주간 스케줄 작성 (조용시간, 외출시간)
   - 저장 → `/dashboard`
   - "나중에 설정" → `/dashboard`

### Main App Pages (`(main)/`)

헤더 + 사이드바 레이아웃 적용:

1. **`/dashboard`** - 대시보드 (홈)
   - 월간 캘린더 (배정 결과 표시)
   - 내 타임라인 (선택한 날짜의 스케줄 + 배정된 업무)
   - 모두의 타임테이블 (룸메이트 전체 스케줄)
   - 필터: 전체 / 내 업무만

2. **`/schedule`** - 주간 타임테이블 수정
   - WeeklyGrid 에디터
   - 조용시간(회색) / 외출(빨강) 설정
   - 저장 후 → `/dashboard`

3. **`/assign`** - 선호도 제출
   - 1지망, 2지망 선택 (🚽🗑️🧹👔🍽️)
   - 마감: 일요일 23:59:59
   - 제출 후 → `/dashboard`

4. **`/result`** - 배정 결과 조회
   - 주차별 배정 내역
   - 업무별 통계
   - 공평성 점수

### API Callback

- **`/auth/callback`** - Google OAuth 콜백
  - 자동 리디렉션: → `/onboarding/profile`

### Home

- **`/`** - 루트 페이지
  - 자동 리디렉션: → `/login`

## Environment Setup

### Required Environment Variables

프로젝트 실행 전 `.env.local` 파일 생성 필요:

```env
# .env.local (root directory)
# Backend API URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

**중요**: `.env.local` 파일은 `.gitignore`에 포함되어 GitHub에 올라가지 않습니다.
각 개발자는 로컬에서 직접 생성해야 합니다.

### 백엔드 서버 실행

프론트엔드는 **항상 Real API**를 사용합니다. 백엔드 서버와 함께 실행하세요:

```bash
# 백엔드 서버 (포트 8000)
cd ../backend
npm start

# 프론트엔드 서버 (포트 3000)
cd ../front
npm run dev
```

**참고:** 백엔드 미구현 API는 빈 데이터를 반환하므로 백엔드 없이도 에러 없이 실행 가능합니다.
