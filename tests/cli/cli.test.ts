import assert from "node:assert/strict";
import { access, mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
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
  await writeFile(
    path.join(repo, "README.md"),
    "# Demo\n\n## Install\nnpm install\n\n## Quickstart\noss-launch-lint .\n\n## Example\nScore: 80\n\n## Roadmap\n- More checks\n\n## Contributing\nOpen a PR.\n\n## Support\nOpen an issue.\n",
  );
  await writeFile(path.join(repo, "LICENSE"), "MIT License\n");
  await writeFile(path.join(repo, "CONTRIBUTING.md"), "# Contributing\n");
  await writeFile(path.join(repo, "CODE_OF_CONDUCT.md"), "# Code of Conduct\n");
  await writeFile(path.join(repo, "SECURITY.md"), "# Security\n");
  await writeFile(path.join(repo, "CHANGELOG.md"), "# Changelog\n");
  await writeFile(path.join(repo, ".github/workflows/ci.yml"), "name: CI\n");
  await writeFile(path.join(repo, ".github/ISSUE_TEMPLATE/bug.md"), "---\nname: Bug\n---\n");
  await writeFile(
    path.join(repo, "package.json"),
    JSON.stringify({ name: "demo", scripts: { test: "node --test" } }, null, 2),
  );
  return repo;
}

test("writes report and promotion files for a repository", async () => {
  const repo = await makeRepo();
  const output = path.join(repo, "tmp", "report.md");
  const promotionOutput = path.join(repo, "tmp", "promotion.md");

  try {
    const result = spawnSync(
      process.execPath,
      ["--import", "tsx", cliPath, repo, "--output", output, "--promotion-output", promotionOutput],
      {
        cwd: rootDir,
        encoding: "utf8",
      },
    );

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
    const result = spawnSync(
      process.execPath,
      ["--import", "tsx", cliPath, repo, "--json", "--no-promotion"],
      {
        cwd: rootDir,
        encoding: "utf8",
      },
    );

    assert.equal(result.status, 0, result.stderr);
    const payload = JSON.parse(result.stdout);
    assert.deepEqual(Object.keys(payload).sort(), [
      "checks",
      "nextActions",
      "score",
      "summary",
      "topics",
    ]);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("invalid repository path exits non-zero with an actionable error", () => {
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", cliPath, "/path/that/does/not/exist"],
    {
      cwd: rootDir,
      encoding: "utf8",
    },
  );

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Cannot read repository path/);
});

test("prints the package version for --version", async () => {
  const packageJson = JSON.parse(await readFile(path.join(rootDir, "package.json"), "utf8"));
  const result = spawnSync(process.execPath, ["--import", "tsx", cliPath, "--version"], {
    cwd: rootDir,
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), packageJson.version);
});

test("--output - prints the Markdown report to stdout", async () => {
  const repo = await makeRepo();

  try {
    const result = spawnSync(
      process.execPath,
      ["--import", "tsx", cliPath, repo, "--output", "-", "--no-promotion"],
      {
        cwd: rootDir,
        encoding: "utf8",
      },
    );

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /# Launch Readiness Report/);
    assert.doesNotMatch(result.stdout, /Launch report written/);
    await assert.rejects(access(path.join(repo, "launch-report.md")), /ENOENT/);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("--fail-under exits non-zero when the score is below the threshold", async () => {
  const repo = await makeRepo();

  try {
    const result = spawnSync(
      process.execPath,
      ["--import", "tsx", cliPath, repo, "--fail-under", "100", "--no-promotion"],
      {
        cwd: rootDir,
        encoding: "utf8",
      },
    );

    assert.equal(result.status, 1);
    assert.match(result.stderr, /Score \d+\/100 is below fail-under threshold 100/);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("--fail-under rejects scores above 100", () => {
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", cliPath, "--fail-under", "101", "--no-promotion"],
    {
      cwd: rootDir,
      encoding: "utf8",
    },
  );

  assert.equal(result.status, 1);
  assert.match(result.stderr, /--fail-under must be between 0 and 100/);
});

test("--fail-under exits zero when the score meets the threshold", async () => {
  const repo = await makeRepo();

  try {
    const result = spawnSync(
      process.execPath,
      ["--import", "tsx", cliPath, repo, "--fail-under", "0", "--no-promotion"],
      {
        cwd: rootDir,
        encoding: "utf8",
      },
    );

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Score:/);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("--json cannot be combined with --github-step-summary", () => {
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", cliPath, "--json", "--github-step-summary", "--no-promotion"],
    {
      cwd: rootDir,
      encoding: "utf8",
    },
  );

  assert.equal(result.status, 1);
  assert.match(result.stderr, /--json cannot be combined with --github-step-summary/);
});

test("--github-step-summary appends the Markdown report when configured", async () => {
  const repo = await makeRepo();
  const summaryPath = path.join(repo, "summary.md");

  try {
    const result = spawnSync(
      process.execPath,
      ["--import", "tsx", cliPath, repo, "--github-step-summary", "--no-promotion"],
      {
        cwd: rootDir,
        encoding: "utf8",
        env: { ...process.env, GITHUB_STEP_SUMMARY: summaryPath },
      },
    );

    assert.equal(result.status, 0, result.stderr);
    const summary = await readFile(summaryPath, "utf8");
    assert.match(summary, /# Launch Readiness Report/);
    assert.match(summary, /## Score/);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("--github-step-summary warns but does not fail when env var is missing", async () => {
  const repo = await makeRepo();

  try {
    const env = { ...process.env };
    delete env.GITHUB_STEP_SUMMARY;

    const result = spawnSync(
      process.execPath,
      ["--import", "tsx", cliPath, repo, "--github-step-summary", "--no-promotion"],
      {
        cwd: rootDir,
        encoding: "utf8",
        env,
      },
    );

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stderr, /GITHUB_STEP_SUMMARY is not set/);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("--fix --dry-run prints scaffold targets and writes nothing", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "oss-launch-lint-cli-fix-"));

  try {
    const result = spawnSync(
      process.execPath,
      ["--import", "tsx", cliPath, repo, "--fix", "--dry-run", "--no-promotion"],
      {
        cwd: rootDir,
        encoding: "utf8",
      },
    );

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /CONTRIBUTING\.md/);
    assert.match(result.stdout, /\.github\/workflows\/oss-launch-lint\.yml/);
    await assert.rejects(access(path.join(repo, "CONTRIBUTING.md")), /ENOENT/);
    await assert.rejects(access(path.join(repo, "launch-report.md")), /ENOENT/);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("--fix --dry-run does not write a GitHub step summary", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "oss-launch-lint-cli-fix-"));
  const summaryPath = path.join(repo, "summary.md");

  try {
    const result = spawnSync(
      process.execPath,
      [
        "--import",
        "tsx",
        cliPath,
        repo,
        "--fix",
        "--dry-run",
        "--github-step-summary",
        "--no-promotion",
      ],
      {
        cwd: rootDir,
        encoding: "utf8",
        env: { ...process.env, GITHUB_STEP_SUMMARY: summaryPath },
      },
    );

    assert.equal(result.status, 0, result.stderr);
    await assert.rejects(access(summaryPath), /ENOENT/);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("--fix --yes creates missing scaffold files without prompting", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "oss-launch-lint-cli-fix-"));

  try {
    const result = spawnSync(
      process.execPath,
      ["--import", "tsx", cliPath, repo, "--fix", "--yes", "--no-promotion"],
      {
        cwd: rootDir,
        encoding: "utf8",
      },
    );

    assert.equal(result.status, 0, result.stderr);
    assert.match(await readFile(path.join(repo, "CONTRIBUTING.md"), "utf8"), /Contributing/);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("--fix --yes writes a post-fix report with before and after scores", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "oss-launch-lint-cli-fix-"));
  const output = path.join(repo, "report.md");

  try {
    const result = spawnSync(
      process.execPath,
      ["--import", "tsx", cliPath, repo, "--fix", "--yes", "--output", output, "--no-promotion"],
      {
        cwd: rootDir,
        encoding: "utf8",
      },
    );

    assert.equal(result.status, 0, result.stderr);
    const report = await readFile(output, "utf8");
    assert.match(report, /## Fix summary/);
    assert.match(report, /Score before fix: \d+\/100/);
    assert.match(report, /Score after fix: \d+\/100/);
    assert.match(report, /Scaffold: \d+ written, \d+ skipped/);
    assert.doesNotMatch(report, /CONTRIBUTING\.md is missing/);
    assert.match(report, /Contributing guide found at CONTRIBUTING\.md/);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("--fix --yes does not overwrite existing files without --force", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "oss-launch-lint-cli-fix-"));
  const contributingPath = path.join(repo, "CONTRIBUTING.md");

  try {
    await writeFile(contributingPath, "custom guidance\n", "utf8");
    const result = spawnSync(
      process.execPath,
      ["--import", "tsx", cliPath, repo, "--fix", "--yes", "--no-promotion"],
      {
        cwd: rootDir,
        encoding: "utf8",
      },
    );

    assert.equal(result.status, 0, result.stderr);
    assert.equal(await readFile(contributingPath, "utf8"), "custom guidance\n");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("--fix --yes --force overwrites scaffold targets", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "oss-launch-lint-cli-fix-"));
  const contributingPath = path.join(repo, "CONTRIBUTING.md");

  try {
    await writeFile(contributingPath, "custom guidance\n", "utf8");
    const result = spawnSync(
      process.execPath,
      ["--import", "tsx", cliPath, repo, "--fix", "--yes", "--force", "--no-promotion"],
      {
        cwd: rootDir,
        encoding: "utf8",
      },
    );

    assert.equal(result.status, 0, result.stderr);
    assert.notEqual(await readFile(contributingPath, "utf8"), "custom guidance\n");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("promotion copy uses normalized package repository URL", async () => {
  const repo = await makeRepo();
  const promotionOutput = path.join(repo, "promotion.md");

  try {
    await writeFile(
      path.join(repo, "package.json"),
      JSON.stringify(
        {
          name: "demo",
          repository: { type: "git", url: "git+https://github.com/example/demo.git" },
          scripts: { test: "node --test" },
        },
        null,
        2,
      ),
    );

    const result = spawnSync(
      process.execPath,
      [
        "--import",
        "tsx",
        cliPath,
        repo,
        "--output",
        path.join(repo, "report.md"),
        "--promotion-output",
        promotionOutput,
      ],
      {
        cwd: rootDir,
        encoding: "utf8",
      },
    );

    assert.equal(result.status, 0, result.stderr);
    const promotion = await readFile(promotionOutput, "utf8");
    assert.match(promotion, /https:\/\/github\.com\/example\/demo/);
    assert.doesNotMatch(promotion, /git\+https/);
    assert.doesNotMatch(promotion, /Add your repository URL before posting/);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("promotion copy falls back to normalized git remote URL", async () => {
  const repo = await makeRepo();
  const promotionOutput = path.join(repo, "promotion.md");

  try {
    const init = spawnSync("git", ["init"], { cwd: repo, encoding: "utf8" });
    assert.equal(init.status, 0, init.stderr);
    const remote = spawnSync("git", ["remote", "add", "origin", "git@github.com:example/fallback.git"], {
      cwd: repo,
      encoding: "utf8",
    });
    assert.equal(remote.status, 0, remote.stderr);

    const result = spawnSync(
      process.execPath,
      [
        "--import",
        "tsx",
        cliPath,
        repo,
        "--output",
        path.join(repo, "report.md"),
        "--promotion-output",
        promotionOutput,
      ],
      {
        cwd: rootDir,
        encoding: "utf8",
      },
    );

    assert.equal(result.status, 0, result.stderr);
    const promotion = await readFile(promotionOutput, "utf8");
    assert.match(promotion, /https:\/\/github\.com\/example\/fallback/);
    assert.doesNotMatch(promotion, /git@github\.com/);
    assert.doesNotMatch(promotion, /Add your repository URL before posting/);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("--dry-run requires --fix", () => {
  const result = spawnSync(process.execPath, ["--import", "tsx", cliPath, "--dry-run"], {
    cwd: rootDir,
    encoding: "utf8",
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /--dry-run requires --fix/);
});

test("help lists fix and CI options", () => {
  const result = spawnSync(process.execPath, ["--import", "tsx", cliPath, "--help"], {
    cwd: rootDir,
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /--fix/);
  assert.match(result.stdout, /--fail-under/);
  assert.match(result.stdout, /--github-step-summary/);
});
