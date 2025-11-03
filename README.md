# PeaceHub Frontend

피스허브 프론트엔드 레포지토리입니다.

## 프로젝트 개요

- **프레임워크**: Next.js 15
- **라이브러리**: React 19
- **스타일링**: Tailwind CSS
- **린팅**: ESLint (eslint-config-next)
- **패키지 매니저**: npm

## 파일 구조

```
/home/juhwan/front/
├───app/
│   ├───(auth)/
│   ├───(main)/
│   └───onboarding/
├───components/
│   ├───assign/
│   ├───auth/
│   ├───dashboard/
│   ├───layout/
│   ├───schedule/
│   └───ui/
├───lib/
│   ├───api/
│   └───utils/
├───public/
│   └───images/
└───types/
```

## 의존성 관리

### 주요 의존성

- `react`: ^19.0.0
- `react-dom`: ^19.0.0
- `next`: ^15.1.4

### 의존성 업데이트

현재 일부 의존성을 업데이트해야 합니다. 다음 명령어로 업데이트할 수 있습니다.

```bash
npm install @types/node@latest eslint-config-next@latest next@latest tailwindcss@latest
```

## 배포 가이드

### 빌드

다음 명령어로 프로젝트를 빌드합니다.

```bash
npm run build
```

### 시작

빌드 후 다음 명령어로 서버를 시작합니다.

```bash
npm run start
```

### Vercel에 배포

Next.js 프로젝트는 Vercel에 쉽게 배포할 수 있습니다. GitHub 저장소를 Vercel에 연결하면 자동으로 배포됩니다.