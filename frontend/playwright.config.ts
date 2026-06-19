import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const backendDir = path.join(repoRoot, "backend");

const isCI = !!process.env.CI;

const backendEnv: NodeJS.ProcessEnv = {
  ...process.env,
  DATABASE_URL:
    process.env.DATABASE_URL ??
    (isCI ? "postgresql://learn:learn@localhost:5432/learn" : "postgresql://learn:learn@localhost:5433/learn"),
  SEED_ON_STARTUP: "true",
  AUTH_ENABLED: "false",
  SECRET_KEY: process.env.SECRET_KEY ?? "e2e-test-secret",
  AUTHORING_ENABLED: "false",
};

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:5173",
    trace: "on-first-retry",
  },
  webServer: process.env.PLAYWRIGHT_SKIP_SERVER
    ? undefined
    : [
        {
          command: "python -m uvicorn app.main:app --host 127.0.0.1 --port 8000",
          cwd: backendDir,
          url: "http://127.0.0.1:8000/health",
          reuseExistingServer: !isCI,
          timeout: 180_000,
          env: backendEnv,
        },
        {
          command: "npm run dev -- --host 127.0.0.1 --port 5173",
          url: "http://127.0.0.1:5173",
          reuseExistingServer: !isCI,
          timeout: 120_000,
        },
      ],
});
