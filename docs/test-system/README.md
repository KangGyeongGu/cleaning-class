# 테스트 시스템

코드 규칙 검사, 자동 테스트, 접근성·SEO·성능 검사로 품질을 확인한다. 각 도구는 서로 다른 종류의 문제를 찾으며, 하나의 도구가 다른 도구를 대체하지 않는다.

```text
코드 작성 규칙
├── TypeScript       타입 오류
├── ESLint           코드 규칙·구조·접근성 규칙 일부
├── Prettier         코드 형식 통일
└── Semgrep          보안·아키텍처 위험 패턴

자동 테스트
├── 단위 테스트       함수·훅·검증 로직
├── 통합 테스트       Action·Query·API Route의 조합
├── 컴포넌트 테스트   브라우저 안에서 UI 단위 동작
└── E2E 테스트        실제 앱을 띄운 전체 사용자 흐름

별도 품질 검사
├── 접근성 검사       WCAG 규칙
├── SEO 검사          sitemap·metadata·JSON-LD 등
└── 성능 검사         Lighthouse의 LCP·CLS 등
```

## 디렉토리 및 설정 파일 구조

```text
cleaning-class/
├── config/                                  검사 도구 설정
│   ├── eslint.config.mjs                    ESLint 규칙
│   ├── vitest.config.mts                    Vitest node·browser 테스트 설정
│   ├── playwright.config.ts                 Playwright E2E 설정
│   ├── commitlint.config.js                 커밋 메시지 규칙
│   ├── lighthouse/
│   │   ├── mobile.js                        모바일 Lighthouse 기준
│   │   └── desktop.js                       데스크톱 Lighthouse 기준
│   └── semgrep/
│       ├── rules.yaml                       공통 구조·데이터 접근 규칙
│       ├── next-quality.yaml                Next.js 코드 품질 규칙
│       ├── next-security.yaml               보안 위험 패턴 규칙
│       └── next-server-actions.yaml         Server Action 인증·오류 처리 규칙
│
├── tests/                                   테스트 코드
│   ├── unit/                                단위 테스트
│   ├── integration/                         통합 테스트
│   ├── component/                           브라우저 컴포넌트 테스트
│   ├── e2e/                                 Playwright E2E 테스트
│   ├── architecture/                        프로젝트 구조 규칙 테스트
│   ├── seo/                                 SEO 정적 테스트
│   └── __mocks__/                           테스트 대체 모듈·환경 보정
│
├── .husky/                                  Git Hook 실행 파일
│   ├── pre-commit                           staged 파일 포맷·ESLint
│   ├── commit-msg                           커밋 메시지 검사
│   └── pre-push                             verify 실행
│
├── tsconfig.json                            TypeScript 설정
├── .prettierrc.cjs                          Prettier 설정
├── package.json                             실행 명령·의존성·lint-staged 설정
├── next.config.ts                           Next.js 실행·빌드 설정
├── postcss.config.mjs                       Tailwind CSS 빌드 연결
├── .github/workflows/deploy.yml             배포 CI
│
├── coverage/                                커버리지 결과물
├── test-results/                            Playwright 실패 산출물
├── playwright-report/                       Playwright HTML 보고서
├── .lighthouseci/                           Lighthouse 결과물
└── .vitest-attachments/                     Vitest 첨부파일 저장 공간
```

`coverage/`, `test-results/`, `playwright-report/`, `.lighthouseci/`, `.vitest-attachments/`는 테스트 설정이나 테스트 코드가 아니라 실행 중 생성되는 결과물이다. 삭제해도 다음 실행에서 다시 생성된다.

## 코드 작성 규칙 검사

### TypeScript

> TypeScript 컴파일러 기반 정적 타입 검사 도구. 이 프로젝트에서는 함수·객체·모듈의 타입 일치와 `@/` 경로 설정 검사

| 항목 | 내용 |
| --- | --- |
| 설정 | `tsconfig.json` |
| 명령 | `npm run typecheck` |
| 역할 | 타입 오류, `@/` 경로 별칭, TypeScript 검사 대상 파일 확인 |
| 실행 시점 | `check:fast`, `verify`, `verify:full`, Git `pre-push` Hook |


### ESLint

> 코드 규칙 검사 도구. 이 프로젝트에서는 React·접근성·import·계층 의존성 규칙 검사

| 항목 | 내용 |
| --- | --- |
| 설정 | `config/eslint.config.mjs` |
| 명령 | `npm run lint`, `npm run lint:fix` |
| 역할 | 코드 규칙, React 규칙, 접근성 규칙 일부, import 규칙, 계층 의존성 검사 |
| 실행 시점 | `check:fast`, `verify`, `verify:full`, Git `pre-commit`·`pre-push` Hook |

### Prettier

> 코드 포맷 통일 도구. 이 프로젝트에서는 코드 스타일과 Tailwind 클래스 순서 통일

| 항목 | 내용 |
| --- | --- |
| 설정 | `.prettierrc.cjs` |
| 명령 | `npm run format`, `npm run format:check` |
| 역할 | 들여쓰기, 따옴표, 세미콜론, 후행 쉼표, Tailwind 클래스 순서 통일 |
| 실행 시점 | `check:fast`, `verify`, `verify:full`, Git `pre-commit`·`pre-push` Hook, Claude 편집 Hook |


### Semgrep

> 코드 패턴 정적 분석 도구. 이 프로젝트에서는 보안·아키텍처·입력 검증 위험 패턴 검사

| 항목 | 내용 |
| --- | --- |
| 설정 | `config/semgrep/*.yaml` |
| 명령 | `npm run security:semgrep` |
| 역할 | 보안·아키텍처·입력 검증 위험 패턴 정적 분석 |
| 실행 시점 | `verify`, `verify:full`, Git `pre-push` Hook |

| 규칙 파일 | 검사 범위 |
| --- | --- |
| `rules.yaml` | Server Action 오류 처리, DB 접근 계층, 서버/클라이언트 경계, DB 타입 재정의 |
| `next-quality.yaml` | 페이지의 직접 DB 접근, `console.log`, FormData 검증 누락 |
| `next-security.yaml` | 위험한 HTML 삽입, open redirect, 하드코딩 비밀값, 환경변수 노출, URL·메일 헤더 처리 |
| `next-server-actions.yaml` | 관리자 Server Action의 인증, DB 오류 노출, Supabase 오류 처리 |

## Vitest 자동 테스트

### Vitest node 프로젝트

> JavaScript·TypeScript 테스트 실행기인 Vitest의 jsdom 프로젝트. 이 프로젝트에서는 공유 로직과 프로젝트 구조 규칙 검사

| 항목 | 내용 |
| --- | --- |
| 설정 | `config/vitest.config.mts` |
| 환경 | jsdom |
| 명령 | `npm test`, `npm run test:coverage` |
| 대상 | `tests/unit/`, `tests/integration/`, `tests/architecture/`, `tests/seo/` |

#### 단위 테스트: `tests/unit/`

작은 함수·hook·검증 모듈을 독립적으로 검사한다.

- 순수 계산: 전화번호 포맷, 날짜·분석·대시보드 계산, 페이지네이션
- 입력 검증: 이미지 파일·Zod schema
- 도메인 데이터: JSON-LD, 정책 버전, 히어로 이미지
- React hook: 문의 폼, 이미지 업로드, drag reorder, pagination, viewport 감지
- 서버 보조 로직: rate limit, 분석 요청·방문자 처리, 메일 HTML 생성

#### 통합 테스트: `tests/integration/`

여러 프로젝트 모듈을 함께 검사한다. 실제 Supabase·SMTP에 접속하지 않고 대체 모듈을 이용하는 테스트가 중심이다.

- Server Action: 인증, 서비스·가격·FAQ·리뷰·설정·트래픽 변경 처리
- Query: Supabase 조회 결과 변환·오류 처리·데이터 조합
- API Route: 대시보드, 추적, 공개 리뷰 API
- 공개·관리자 기능: 섹션 설명, 관리자 홈 설명

#### 구조 테스트: `tests/architecture/`

- `.client.tsx`와 `"use client"` 선언 일치
- 파일명 규칙: 컴포넌트 PascalCase, hook `useXxx`, 일반 모듈 kebab-case
- 공개 페이지의 ISR `revalidate`
- 공개 페이지의 직접 서버 Supabase import 금지
- revalidatePath 호출 패턴

#### SEO 정적 테스트: `tests/seo/`

- 페이지 metadata, canonical URL, Open Graph 설정
- 공개 페이지 title 중복
- 컴포넌트 heading 순서와 h1 개수

### Vitest Browser 프로젝트

> Vitest의 실제 Chromium 실행 모드. 이 프로젝트에서는 개별 UI 컴포넌트의 렌더링·클릭·입력·상태 변화 검사

| 항목 | 내용 |
| --- | --- |
| 설정 | `config/vitest.config.mts` |
| 환경 | headless Chromium |
| 명령 | `npm run test:browser` |
| 대상 | `tests/component/` |

주요 대상은 견적 문의 폼, 서비스 카드·탭, 리뷰 UI, 모바일 CTA, 관리자 대시보드, Hero 이미지 크롭, 관리자 관리 폼과 페이지 이탈 방지 UI다.

### 커버리지 기준

> V8 기반 코드 실행 범위 측정. 이 프로젝트에서는 공유 서버·도메인 로직의 파일별 100% 기준 강제

```text
대상: src/shared/actions/**/*.ts, src/shared/lib/**/*.ts
제외: DB types, Supabase 클라이언트 구현, index.ts, 테스트 파일
기준: 파일별 statements·branches·functions·lines 100%
```

커버리지 결과는 `coverage/`에 생성된다. 이 기준은 전체 UI 코드가 아니라 지정된 공유 로직 범위에 적용된다.

## Playwright E2E 테스트

| 항목 | 내용 |
| --- | --- |
| 설정 | `config/playwright.config.ts` |
| 명령 | `npm run test:e2e` |
| 대상 | `tests/e2e/` |
| 브라우저 | Desktop Chrome, iPhone 14 화면 설정 |
| 서버 | 기본값: 매 실행마다 `npm run build && npm run start:standalone` |

Playwright는 production build된 Next.js 앱을 실행하고, 실제 브라우저로 URL 접속·클릭·입력·URL 변경·응답을 확인한다. 기본 대상은 `http://localhost:3000`이며 기존 서버를 재사용하지 않는다. 원격 대상을 검사할 때는 `E2E_BASE_URL`과 `ALLOW_REMOTE_E2E=true`를 함께 명시해야 하며, 이 경우 로컬 서버를 시작하지 않는다.

| 파일 | 주요 검사 |
| --- | --- |
| `a11y.spec.ts` | 주요 페이지 WCAG AA 접근성 검사 |
| `admin-auth.spec.ts` | 미인증 관리자 접근 차단·로그인 화면 |
| `contact-form.spec.ts` | 청소/이사 전환, 필수 입력, 전화번호 포맷, 서비스 선택 |
| `contact-image-upload.spec.ts` | 견적 이미지 첨부 UI·제한 |
| `mobile-cta.spec.ts` | 모바일 전화 CTA, iOS 전화번호 자동 감지 방지 |
| `public-performance.spec.ts` | 리뷰 목록 초기 표시, 필터, 페이지 이동, 뒤로가기 |
| `seo.spec.ts` | sitemap, robots, manifest, feed, JSON-LD, metadata, h1 |
| `global-setup.ts` | 테스트 전 주요 경로 워밍업 |

실패 시 Playwright는 trace와 스크린샷을 `test-results/`에 저장한다. 로컬 실행 보고서는 `playwright-report/`에 생성한다.

### 접근성 검사

> Axe 기반 접근성 검사 도구. 이 프로젝트에서는 렌더된 페이지의 WCAG 2/2.1 A·AA 위반 검사

예외 규칙 없이 `color-contrast`, `aria-hidden-focus`를 포함한 WCAG 2/2.1 A·AA 규칙을 검사한다.

## Lighthouse 성능 검사

| 항목 | 내용 |
| --- | --- |
| 설정 | `config/lighthouse/mobile.js`, `config/lighthouse/desktop.js` |
| 명령 | `npm run lighthouse`, `npm run lighthouse:mobile`, `npm run lighthouse:desktop` |
| 대상 | `/`, `/contact`, `/services` |
| 측정 횟수 | 환경별 3회 |
| 결과물 | `.lighthouseci/` |

Lighthouse는 기능 테스트가 아니라 로딩 품질 측정 도구다.

| 지표 | 의미 |
| --- | --- |
| FCP | 첫 화면 내용 표시 시작 시간 |
| LCP | 주요 콘텐츠 표시 시간 |
| CLS | 로딩 중 레이아웃 이동 정도 |
| TBT | JavaScript 작업으로 입력이 막힌 시간 |
| Interactive | 사용자 상호작용 가능 상태 도달 시간 |

`tests/e2e/public-performance.spec.ts`는 Lighthouse 측정이 아니라, 공개 페이지의 초기 렌더링과 목록 탐색 흐름을 검사하는 E2E 테스트다.

## Git Hook과 실행 단계

```text
git commit
├── pre-commit
│   └── lint-staged
│       ├── Prettier 수정
│       └── ESLint 수정·검사
└── commit-msg
    └── commitlint 커밋 메시지 검사

git push
└── pre-push
    └── npm run verify
        ├── TypeScript
        ├── ESLint
        ├── Prettier 검사
        ├── Vitest node 테스트 + 커버리지
        └── Semgrep
```

```text
npm run verify:full
├── npm run verify
├── Vitest Browser 컴포넌트 테스트
├── Next.js production build
├── Playwright E2E 테스트
└── Lighthouse 모바일·데스크톱 성능 측정
```

`pre-push`는 `verify`까지만 실행한다. 브라우저 컴포넌트 테스트, production build, E2E, Lighthouse는 `verify:full` 또는 각각의 명령으로 별도 실행한다.

## 빠른 명령표

| 목적 | 명령 |
| --- | --- |
| 타입 확인 | `npm run typecheck` |
| 코드 규칙 검사 | `npm run lint` |
| 코드 포맷 수정 | `npm run format` |
| 포맷 검사 | `npm run format:check` |
| 보안·구조 패턴 검사 | `npm run security:semgrep` |
| Vitest node 테스트 | `npm test` |
| Vitest node 테스트 + 커버리지 | `npm run test:coverage` |
| Vitest Browser 컴포넌트 테스트 | `npm run test:browser` |
| Playwright E2E | `npm run test:e2e` |
| Lighthouse 성능 측정 | `npm run lighthouse` |
| 푸시 전 검사 범위 | `npm run verify` |
| 전체 검사 범위 | `npm run verify:full` |
