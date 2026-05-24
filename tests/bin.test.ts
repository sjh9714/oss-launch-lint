import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("package bin imports and invokes the compiled CLI main function", async () => {
  const bin = await readFile(path.join(rootDir, "bin/oss-launch-lint"), "utf8");

  assert.match(bin, /await import\(compiledCliUrl\.href\)/);
  assert.match(bin, /await main\(\)/);
  assert.match(bin, /Run `npm run build` first/);
});
