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
2. Login (mock Google OAuth) → `/onboarding/profile`
3. Onboarding: profile → join-room → schedule → `/dashboard`
4. Main app: dashboard, schedule, assign, result pages

### Data Layer (Mock API Pattern)

**Location:** `lib/api/client.ts`, `lib/api/mockData.ts`, and `lib/api/endpoints.ts`

The app supports both **mock** and **real** API modes:

- `client.ts` - Current mock API implementation with simulated delays (500ms)
- `endpoints.ts` - Real backend API structure (ready for integration)
- `mockData.ts` - Pure test data without logic
- **Backend integration:** Toggle `USE_MOCK_API` environment variable

**API Function Categories:**
- Authentication: `getCurrentUser()`, `logout()`, `getGoogleAuthUrl()`
- Profile: `updateProfile(data)`
- Room: `createRoom()`, `joinRoom()`, `getMyRoom()`, `getRoomMembers()`
- Schedule: `getMySchedule()`, `saveSchedule()`, `getAllSchedules()`
- Preferences: `getTasks()`, `getMyPreference()`, `savePreference()`
- Assignments: `getCurrentAssignments()`, `getAssignmentsByWeek()`, `getMyAssignments()`

**Mock Data Setup:**
- 5 mock users: 양희석, 이세용, 정준영, 조재현, 허주환
- Current user: 허주환 (user-5)
- 1 mock room: "301호" with code "ABC123"
- Pre-populated schedules and assignments for testing

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
│   ├── client.ts         # Mock API (current)
│   ├── endpoints.ts      # Real API structure (ready for backend)
│   └── mockData.ts       # Test data
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
import { getCurrentUser } from '@/lib/api/client';

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

### Current Development Status

- **Phase 1 (Completed):** Login, Profile, Join-Room, Schedule onboarding pages
- **Phase 2 (Completed):** Dashboard, Assign, Schedule, Result pages with full UI
- **Phase 3 (Completed):** Frontend optimization & refactoring for backend integration
- **Phase 4 (Completed):** Backend integration preparation complete
- **Phase 5 (In Progress):** Backend API integration
  - ✅ Phase 1-2: Authentication & User Profile (완료)
  - ✅ Phase 3: Room 생성/참여 (완료)
  - ⏳ Phase 4-7: Schedule, Preferences, Assignments (예정)

### Code Refactoring Achievements (Latest)

- ✅ **29% code reduction** (-193 lines of duplicate code)
- ✅ **Timeline rendering unified** (3 components → 1 TimelineRenderer)
- ✅ **globals.css enhanced** (243 lines of reusable styles)
- ✅ **Utility functions consolidated** (8 duplicate functions eliminated)
- ✅ **Component reusability maximized** (LoadingSpinner, PageContainer, EmptyState)
- ✅ **Backend types prepared** (types/api.ts, apiTransformers.ts)

### Backend Integration Status

**✅ Integrated APIs (Phase 1-3 Complete):**

- **Authentication**
  - ✅ Google OAuth login (`GET /api/auth/google`)
  - ✅ OAuth callback with session/cookie
  - ✅ Auto-redirect to `/auth/callback` → `/onboarding/profile`

- **User Profile**
  - ✅ Get current user (`GET /api/users`)
  - 🔄 Update profile (`PUT /api/users`) - Mock mode (백엔드 작업 대기 중)
  - ✅ localStorage for `country`, `language` (temporary)

- **Room**
  - ✅ Create room (`POST /api/rooms`)
  - ✅ Join room (`POST /api/rooms/join`)
  - ✅ Get my room (`GET /api/rooms/my`)
  - ✅ Get room members (`GET /api/rooms/:id/members`)

- **CORS & Session**
  - ✅ CORS configured (`credentials: true`)
  - ✅ Session cookies working (`connect.sid`)
  - ✅ Real API mode enabled

**Environment Variables:**
```env
# .env.local (Phase 3 완료 - Room 통합)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_USE_REAL_AUTH=true
NEXT_PUBLIC_USE_REAL_USER=false
NEXT_PUBLIC_USE_REAL_ROOM=true
NEXT_PUBLIC_USE_REAL_SCHEDULE=false
```

**⏳ Pending APIs:**
- Schedule: `POST /api/schedules`, `GET /api/schedules`
- Preferences: CRUD endpoints
- Assignments: Query endpoints

**Data format differences handled by transformers:**
- DayOfWeek: 'mon' (frontend) ↔ 'MONDAY' (backend)
- TimeSlot: 'quiet' ↔ 'QUIET', 'out' ↔ 'BUSY'
- Time: hours (0-23) ↔ minutes from midnight (0-1439)
- User fields: `realName` (frontend) ↔ `name` (backend)

### Authentication Status

- ✅ **Google OAuth integrated** with real backend
- ✅ **Session-based authentication** working (connect.sid cookie)
- ✅ **Protected routes** via `checkAuth` middleware (backend)
- ✅ **401 auto-redirect** to login page
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
  - `NEXT_PUBLIC_USE_REAL_AUTH` - Enable real auth (default: false)
  - `NEXT_PUBLIC_USE_REAL_USER` - Enable real user API (default: false)
  - `NEXT_PUBLIC_USE_REAL_ROOM` - Enable real room API (default: false)
  - `NEXT_PUBLIC_USE_REAL_SCHEDULE` - Enable real schedule API (default: false)

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
