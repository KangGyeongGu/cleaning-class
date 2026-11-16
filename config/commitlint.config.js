/**
 * @file config/commitlint.config.js
 * @description 커밋 메시지 유형·제목 길이·문장 형식 검사 규칙
 * @activation 직접 실행: commitlint --config config/commitlint.config.js
 * @activation Git Hook: git commit의 commit-msg에서 자동 호출
 * @activation Agent Skill: 전용 실행 없음
 */
const commitlintConfig = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "refactor",
        "style",
        "test",
        "docs",
        "chore",
        "perf",
        "ci",
        "build",
      ],
    ],
    "subject-max-length": [2, "always", 50],
    "subject-full-stop": [2, "never", "."],
  },
};

export default commitlintConfig;
