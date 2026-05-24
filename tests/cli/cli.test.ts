import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const cliPath = path.join(rootDir, "src/cli.ts");

async function makeRepo(): Promise<string> {
  const repo = await mkdtemp(path.join(tmpdir(), "oss-launch-lint-cli-"));
  await mkdir(path.join(repo, ".github/workflows"), { recursive: true });
  await mkdir(path.join(repo, ".github/ISSUE_TEMPLATE"), { recursive: true });
  await writeFile(path.join(repo, "README.md"), "# Demo\n\n## Install\nnpm install\n\n## Quickstart\noss-launch-lint .\n\n## Example\nScore: 80\n\n## Roadmap\n- More checks\n\n## Contributing\nOpen a PR.\n\n## Support\nOpen an issue.\n");
  await writeFile(path.join(repo, "LICENSE"), "MIT License\n");
  await writeFile(path.join(repo, "CONTRIBUTING.md"), "# Contributing\n");
  await writeFile(path.join(repo, "CODE_OF_CONDUCT.md"), "# Code of Conduct\n");
  await writeFile(path.join(repo, "SECURITY.md"), "# Security\n");
  await writeFile(path.join(repo, "CHANGELOG.md"), "# Changelog\n");
  await writeFile(path.join(repo, ".github/workflows/ci.yml"), "name: CI\n");
  await writeFile(path.join(repo, ".github/ISSUE_TEMPLATE/bug.md"), "---\nname: Bug\n---\n");
  await writeFile(path.join(repo, "package.json"), JSON.stringify({ name: "demo", scripts: { test: "node --test" } }, null, 2));
  return repo;
}

test("writes report and promotion files for a repository", async () => {
  const repo = await makeRepo();
  const output = path.join(repo, "tmp", "report.md");
  const promotionOutput = path.join(repo, "tmp", "promotion.md");

  try {
    const result = spawnSync(process.execPath, [
      "--import",
      "tsx",
      cliPath,
      repo,
      "--output",
      output,
      "--promotion-output",
      promotionOutput
    ], {
      cwd: rootDir,
      encoding: "utf8"
    });

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Launch report written/);
    assert.match(await readFile(output, "utf8"), /Launch Readiness Report/);
    assert.match(await readFile(promotionOutput, "utf8"), /Ethical Promotion Copy/);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("prints documented JSON when --json is provided", async () => {
  const repo = await makeRepo();

  try {
    const result = spawnSync(process.execPath, [
      "--import",
      "tsx",
      cliPath,
      repo,
      "--json",
      "--no-promotion"
    ], {
      cwd: rootDir,
      encoding: "utf8"
    });

    assert.equal(result.status, 0, result.stderr);
    const payload = JSON.parse(result.stdout);
    assert.deepEqual(Object.keys(payload).sort(), [
      "checks",
      "nextActions",
      "score",
      "summary",
      "topics"
    ]);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("invalid repository path exits non-zero with an actionable error", () => {
  const result = spawnSync(process.execPath, [
    "--import",
    "tsx",
    cliPath,
    "/path/that/does/not/exist"
  ], {
    cwd: rootDir,
    encoding: "utf8"
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Cannot read repository path/);
});

test("prints the package version for --version", async () => {
  const packageJson = JSON.parse(await readFile(path.join(rootDir, "package.json"), "utf8"));
  const result = spawnSync(process.execPath, [
    "--import",
    "tsx",
    cliPath,
    "--version"
  ], {
    cwd: rootDir,
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), packageJson.version);
});
