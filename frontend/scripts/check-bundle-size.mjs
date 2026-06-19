import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const DIST_ASSETS = join(process.cwd(), "dist", "assets");

/** Max size for the main app entry chunk (not vendor-*). Fail CI if exceeded. */
const FAIL_BYTES = 1300 * 1024;
/** Warn threshold — logged but does not fail CI. */
const WARN_BYTES = 1100 * 1024;

function listJsFiles(dir) {
  return readdirSync(dir)
    .filter((name) => name.endsWith(".js") && !name.startsWith("vendor-"))
    .map((name) => join(dir, name));
}

const files = listJsFiles(DIST_ASSETS);
if (files.length === 0) {
  console.error("Bundle check: no JS assets found in dist/assets");
  process.exit(1);
}

let failed = false;

for (const file of files) {
  const size = statSync(file).size;
  const name = file.split(/[/\\]/).pop();
  if (size > FAIL_BYTES) {
    console.error(`Bundle check FAIL: ${name} ${(size / 1024).toFixed(1)} KB > ${FAIL_BYTES / 1024} KB`);
    failed = true;
  } else if (size > WARN_BYTES) {
    console.warn(`Bundle check WARN: ${name} ${(size / 1024).toFixed(1)} KB > ${WARN_BYTES / 1024} KB`);
  } else {
    console.log(`Bundle check OK: ${name} ${(size / 1024).toFixed(1)} KB`);
  }
}

if (failed) {
  process.exit(1);
}
