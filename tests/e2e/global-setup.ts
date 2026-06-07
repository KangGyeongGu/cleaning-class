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
  await Promise.all(
    WARMUP_PATHS.map(async (path) => {
      try {
        await context.get(path, { timeout: 60_000 });
      } catch {
        void 0;
      }
    }),
  );
  await context.dispose();
}

export default globalSetup;
