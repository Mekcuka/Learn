/**
 * Capture demo screenshots for lesson content (1920x1080 WebP).
 *
 * Usage:
 *   DEMO_EMAIL=user@example.com DEMO_PASSWORD=secret npm run capture:screens
 *
 * Env:
 *   DEMO_URL — default https://97.60.spark.modeltech.ru/projects
 *   DEMO_EMAIL, DEMO_PASSWORD — required
 *   OUTPUT_DIR — default frontend/public/content/orientation-v1
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outputDir = process.env.OUTPUT_DIR ?? path.join(root, "public/content/orientation-v1");
const demoUrl = process.env.DEMO_URL ?? "https://97.60.spark.modeltech.ru/projects";

const shots = [
  { folder: "lesson-01-login", file: "slide-01.webp", url: demoUrl.replace("/projects", "/login") },
  { folder: "lesson-01-login", file: "slide-02.webp", url: demoUrl },
  { folder: "lesson-02-create-project", file: "slide-01.webp", url: demoUrl },
];

async function main() {
  const email = process.env.DEMO_EMAIL;
  const password = process.env.DEMO_PASSWORD;
  if (!email || !password) {
    console.error("Set DEMO_EMAIL and DEMO_PASSWORD");
    process.exit(1);
  }

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  await page.goto(demoUrl.replace("/projects", "/login"));
  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/projects/, { timeout: 30000 });

  for (const shot of shots) {
    await page.goto(shot.url);
    await page.waitForTimeout(1500);
    const dir = path.join(outputDir, shot.folder);
    await mkdir(dir, { recursive: true });
    const buffer = await page.screenshot({ type: "webp", quality: 85, fullPage: false });
    await writeFile(path.join(dir, shot.file), buffer);
    console.log("saved", path.join(shot.folder, shot.file));
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
