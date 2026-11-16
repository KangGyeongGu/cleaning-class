import { request } from "@playwright/test";

const WARMUP_PATHS = [
  "/",
  "/contact",
  "/services",
  "/reviews",
  "/price",
  "/admin/login",
];

async function globalSetup(): Promise<void> {
  const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
  const context = await request.newContext({ baseURL });
  const responses = await Promise.all(
    WARMUP_PATHS.map(async (path) => {
      const response = await context.get(path, { timeout: 60_000 });
      return { path, status: response.status() };
    }),
  );
  await context.dispose();

  const failed = responses.filter(({ status }) => status >= 400);
  if (failed.length > 0) {
    throw new Error(
      `E2E 워밍업 실패: ${failed.map(({ path, status }) => `${path} (${status})`).join(", ")}`,
    );
  }
}

export default globalSetup;
