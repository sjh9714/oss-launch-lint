import assert from "node:assert/strict";
import { lstat, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import { applyFixes, planFixes } from "../src/fix.js";

async function makeTempRepo(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), "oss-launch-lint-fix-"));
}

test("plans launch-readiness scaffold files for an empty repository", async () => {
  const repo = await makeTempRepo();

  try {
    const actions = await planFixes({ repoPath: repo, force: false });
    const paths = actions.map((action) => action.path).sort();

    assert.deepEqual(paths, [
      ".github/ISSUE_TEMPLATE/bug_report.md",
      ".github/ISSUE_TEMPLATE/feature_request.md",
      ".github/workflows/oss-launch-lint.yml",
      "CHANGELOG.md",
      "CODE_OF_CONDUCT.md",
      "CONTRIBUTING.md",
      "SECURITY.md",
    ]);
    assert.equal(
      actions.every((action) => action.status === "create"),
      true,
    );
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("skips existing scaffold files by default", async () => {
  const repo = await makeTempRepo();
  const contributingPath = path.join(repo, "CONTRIBUTING.md");

  try {
    await writeFile(contributingPath, "keep me\n", "utf8");
    const result = await applyFixes({
      repoPath: repo,
      dryRun: false,
      force: false,
      yes: true,
    });

    assert.equal(await readFile(contributingPath, "utf8"), "keep me\n");
    assert.equal(result.skipped.includes("CONTRIBUTING.md"), true);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("dry run writes no scaffold files", async () => {
  const repo = await makeTempRepo();

  try {
    const result = await applyFixes({
      repoPath: repo,
      dryRun: true,
      force: false,
      yes: true,
    });

    assert.equal(result.wrote.length, 0);
    await assert.rejects(readFile(path.join(repo, "CONTRIBUTING.md"), "utf8"), /ENOENT/);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("force overwrites only scaffold targets", async () => {
  const repo = await makeTempRepo();
  const contributingPath = path.join(repo, "CONTRIBUTING.md");
  const readmePath = path.join(repo, "README.md");

  try {
    await writeFile(contributingPath, "old contributing\n", "utf8");
    await writeFile(readmePath, "keep readme\n", "utf8");

    const result = await applyFixes({
      repoPath: repo,
      dryRun: false,
      force: true,
      yes: true,
    });

    assert.notEqual(await readFile(contributingPath, "utf8"), "old contributing\n");
    assert.equal(await readFile(readmePath, "utf8"), "keep readme\n");
    assert.equal(result.wrote.includes("CONTRIBUTING.md"), true);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("creates nested issue template and workflow directories", async () => {
  const repo = await makeTempRepo();

  try {
    await applyFixes({
      repoPath: repo,
      dryRun: false,
      force: false,
      yes: true,
    });

    assert.match(
      await readFile(path.join(repo, ".github/ISSUE_TEMPLATE/bug_report.md"), "utf8"),
      /Bug report/,
    );
    assert.match(
      await readFile(path.join(repo, ".github/workflows/oss-launch-lint.yml"), "utf8"),
      /Launch readiness/,
    );
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("does not write through dangling symlinks without force", async () => {
  const repo = await makeTempRepo();
  const outsideTarget = path.join(repo, "..", "outside-contributing.md");

  try {
    await symlink(outsideTarget, path.join(repo, "CONTRIBUTING.md"));

    const result = await applyFixes({
      repoPath: repo,
      dryRun: false,
      force: false,
      yes: true,
    });

    assert.equal(result.skipped.includes("CONTRIBUTING.md"), true);
    await assert.rejects(readFile(outsideTarget, "utf8"), /ENOENT/);
    assert.equal((await lstat(path.join(repo, "CONTRIBUTING.md"))).isSymbolicLink(), true);
  } finally {
    await rm(repo, { recursive: true, force: true });
    await rm(outsideTarget, { force: true });
  }
});

test("force replaces a symlink with a regular scaffold file", async () => {
  const repo = await makeTempRepo();
  const outsideTarget = path.join(repo, "..", "outside-contributing.md");

  try {
    await symlink(outsideTarget, path.join(repo, "CONTRIBUTING.md"));

    const result = await applyFixes({
      repoPath: repo,
      dryRun: false,
      force: true,
      yes: true,
    });

    assert.equal(result.wrote.includes("CONTRIBUTING.md"), true);
    assert.equal((await lstat(path.join(repo, "CONTRIBUTING.md"))).isSymbolicLink(), false);
    assert.match(await readFile(path.join(repo, "CONTRIBUTING.md"), "utf8"), /Contributing/);
    await assert.rejects(readFile(outsideTarget, "utf8"), /ENOENT/);
  } finally {
    await rm(repo, { recursive: true, force: true });
    await rm(outsideTarget, { force: true });
  }
});

test("scaffolded workflow uses npx now that npm publishing is enabled", async () => {
  const repo = await makeTempRepo();

  try {
    await applyFixes({
      repoPath: repo,
      dryRun: false,
      force: false,
      yes: true,
    });

    const workflow = await readFile(
      path.join(repo, ".github/workflows/oss-launch-lint.yml"),
      "utf8",
    );
    assert.match(workflow, /npx oss-launch-lint@latest/);
    assert.match(workflow, /\$GITHUB_WORKSPACE/);
    assert.doesNotMatch(workflow, /RUNNER_TEMP\/oss-launch-lint/);
    assert.doesNotMatch(workflow, /npm ci --prefix/);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});
