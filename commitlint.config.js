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
