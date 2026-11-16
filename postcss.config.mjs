/**
 * @file postcss.config.mjs
 * @description PostCSS 빌드 과정의 Tailwind CSS 플러그인 연결
 * @activation 앱 실행: Next.js 개발 서버, production 빌드의 CSS 처리
 * @activation 검사·배포: E2E·Lighthouse·/cut-release·Docker의 Next.js 빌드
 * @activation 직접 실행·Git Hook: 없음
 */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
