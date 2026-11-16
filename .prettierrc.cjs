/**
 * @file .prettierrc.cjs
 * @description 세미콜론·따옴표·들여쓰기·후행 쉼표·Tailwind CSS 클래스 정렬 규칙
 * @activation 직접 실행: npm run format, npm run format:check
 * @activation 통합 검사: check:fast, verify, verify:full
 * @activation Git Hook: pre-commit의 lint-staged 수정, pre-push의 verify 검사
 * @activation Agent: Claude format-on-edit Hook, /cut-release
 * @activation IDE: Prettier 포맷 명령 또는 저장 시 포맷 설정
 */
module.exports = {
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "all",
  "plugins": ["prettier-plugin-tailwindcss"],
  "tailwindStylesheet": "./src/app/globals.css"
};
