# 검사 도구 설정

검사는 프로젝트 루트에서 기존 npm 명령으로 실행합니다.

| 설정 | 실행 명령 |
| --- | --- |
| eslint.config.mjs | `npm run lint`, `npm run lint:fix` |
| vitest.config.mts | `npm test`, `npm run test:coverage`, `npm run test:browser` |
| playwright.config.ts | `npm run test:e2e` |
| lighthouse/mobile.js | `npm run lighthouse:mobile` |
| lighthouse/desktop.js | `npm run lighthouse:desktop` |
| semgrep/ | `npm run security:semgrep` |
| commitlint.config.js | `.husky/commit-msg`에서 실행 |

`npm run verify`와 `npm run verify:full`은 위 명령들을 조합합니다.
직접 ESLint, Vitest, Playwright를 실행할 때는 `--config config/<설정 파일>`을 지정합니다.

ESLint 에디터 연동에도 설정 경로를 지정해야 합니다. VS Code ESLint 확장에서는
워크스페이스 설정에 다음 값을 사용합니다.

```json
{
  "eslint.options": {
    "overrideConfigFile": "config/eslint.config.mjs"
  }
}
```

다른 IDE에서도 ESLint 구성 파일을 `config/eslint.config.mjs`로 지정합니다.

Prettier와 TypeScript 설정은 에디터 자동 인식을 위해 루트에 유지합니다.
검사 결과도 기존 `coverage/`, `playwright-report/`, `test-results/`, `.lighthouseci/`에 유지합니다.

## 파일 목적 주석

설정 파일은 `@file`과 `@description`을 파일 상단에 기록합니다. JS/TS는 JSDoc, YAML·Shell·Docker 설정은 `#` 주석을 사용합니다.

- `.prettierrc.cjs`: 코드 포맷과 Tailwind 클래스 정렬 규칙입니다. 주석을 지원하도록 JSON에서 CommonJS 설정으로 전환했습니다.
- `tsconfig.json`: TypeScript가 지원하는 JSONC 주석을 사용합니다.
- `package.json`: 앱·검사 도구의 의존성, 실행 명령, lint-staged 설정입니다. 표준 JSON이므로 주석을 삽입하지 않습니다.
- `package-lock.json`: 설치할 의존성의 정확한 버전과 무결성 정보를 기록한 자동 생성 파일입니다. 표준 JSON이므로 주석을 삽입하지 않습니다.

## 실행 시점 주석

각 설정 상단의 `@activation`은 직접 실행, Git Hook, Agent, 앱·IDE·CI의 적용 시점을 구분합니다. Agent는 Skill에서 npm 명령을 호출하는 경로이며 설정 파일 존재만으로 검사가 실행되지는 않습니다. Git Hook은 Husky가 활성화되어 있고 Hook을 건너뛰지 않은 경우에 적용됩니다.

- `package.json`: npm 명령 실행 시 scripts가 선택되며, 커밋 전 lint-staged는 이 파일의 설정을 읽습니다. npm 설치의 prepare 단계는 Husky를 설치합니다.
- `package-lock.json`: npm ci에서 고정 버전을 설치하고 npm install에서 의존성을 해석·갱신할 때 사용합니다. 커밋 검사나 Agent Skill을 직접 실행하는 파일은 아닙니다.
