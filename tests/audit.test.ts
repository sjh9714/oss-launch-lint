import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import { auditRepository } from "../src/audit.js";

async function makeRepo(files: Record<string, string>): Promise<string> {
  const repo = await mkdtemp(path.join(tmpdir(), "oss-launch-lint-"));

  for (const [filePath, contents] of Object.entries(files)) {
    const absolutePath = path.join(repo, filePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, contents);
  }

  return repo;
}

test("detects missing community files and produces actionable next actions", async () => {
  const repo = await makeRepo({
    "README.md": "# Tiny Tool\n\nA small CLI for maintainers.\n\n## Install\n\nnpm install\n",
    "package.json": JSON.stringify({ name: "tiny-tool", scripts: {} }, null, 2),
  });

  try {
    const result = await auditRepository(repo);

    assert.equal(result.summary.fail > 0, true);
    assert.equal(result.checks.find((check) => check.id === "license")?.status, "fail");
    assert.equal(result.checks.find((check) => check.id === "ci")?.status, "fail");
    assert.equal(result.checks.find((check) => check.id === "test-script")?.status, "fail");
    assert.equal(
      result.nextActions.some((action) => action.includes("LICENSE")),
      true,
    );
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("scores a launch-ready fixture above 90 and suggests relevant topics", async () => {
  const repo = await makeRepo({
    "README.md": [
      "# Launch Helper",
      "",
      "Launch Helper audits open-source repositories before sharing.",
      "",
      "## Installation",
      "npm install -g launch-helper",
      "",
      "## Quickstart",
      "launch-helper .",
      "",
      "## Example output",
      "Score: 94/100",
      "",
      "## Roadmap",
      "- More repository checks",
      "",
      "## Contributing",
      "Issues and pull requests are welcome.",
      "",
      "## Support",
      "Open an issue for help.",
    ].join("\n"),
    LICENSE: "MIT License\n",
    "CONTRIBUTING.md": "# Contributing\n",
    "CODE_OF_CONDUCT.md": "# Code of Conduct\n",
    "SECURITY.md": "# Security\n",
    "CHANGELOG.md": "# Changelog\n",
    ".github/workflows/ci.yml": "name: CI\njobs:\n  test:\n    steps:\n      - run: npm test\n",
    ".github/ISSUE_TEMPLATE/bug_report.md": "---\nname: Bug report\n---\n",
    "package.json": JSON.stringify(
      {
        name: "launch-helper",
        keywords: ["open-source", "cli", "github"],
        scripts: { test: "node --test" },
      },
      null,
      2,
    ),
    "src/index.ts": "export const ok = true;\n",
  });

  try {
    const result = await auditRepository(repo);

    assert.equal(result.score >= 90, true);
    assert.equal(result.summary.fail, 0);
    assert.equal(
      result.checks.every((check) => check.status !== "fail"),
      true,
    );
    assert.equal(result.topics.includes("open-source"), true);
    assert.equal(result.topics.includes("cli"), true);
    assert.equal(result.topics.includes("typescript"), true);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("warns when a CI workflow exists but does not run a meaningful check", async () => {
  const repo = await makeRepo({
    "README.md": [
      "# Launch Helper",
      "",
      "Launch Helper audits open-source repositories before sharing.",
      "",
      "## Installation",
      "npm install -g launch-helper",
      "",
      "## Quickstart",
      "launch-helper .",
      "",
      "## Example output",
      "Score: 94/100",
      "",
      "## Roadmap",
      "- More repository checks",
      "",
      "## Contributing",
      "Issues and pull requests are welcome.",
      "",
      "## Support",
      "Open an issue for help.",
    ].join("\n"),
    LICENSE: "MIT License\n",
    "CONTRIBUTING.md": "# Contributing\n",
    "CODE_OF_CONDUCT.md": "# Code of Conduct\n",
    "SECURITY.md": "# Security\n",
    "CHANGELOG.md": "# Changelog\n",
    ".github/workflows/ci.yml": "name: CI\n",
    ".github/ISSUE_TEMPLATE/bug_report.md": "---\nname: Bug report\n---\n",
    "package.json": JSON.stringify(
      {
        name: "launch-helper",
        keywords: ["open-source", "cli", "github"],
        scripts: { test: "node --test" },
      },
      null,
      2,
    ),
  });

  try {
    const result = await auditRepository(repo);
    const ciCheck = result.checks.find((check) => check.id === "ci");

    assert.equal(ciCheck?.status, "warn");
    assert.match(ciCheck?.message ?? "", /does not appear to run tests/);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("weights launch-critical checks more heavily than nice-to-have checks", async () => {
  const baseFiles: Record<string, string> = {
    "README.md": [
      "# Launch Helper",
      "",
      "Launch Helper audits open-source repositories before sharing.",
      "",
      "## Installation",
      "npm install -g launch-helper",
      "",
      "## Quickstart",
      "launch-helper .",
      "",
      "## Example output",
      "Score: 94/100",
      "",
      "## Roadmap",
      "- More repository checks",
      "",
      "## Contributing",
      "Issues and pull requests are welcome.",
      "",
      "## Support",
      "Open an issue for help.",
    ].join("\n"),
    LICENSE: "MIT License\n",
    "CONTRIBUTING.md": "# Contributing\n",
    "CODE_OF_CONDUCT.md": "# Code of Conduct\n",
    "SECURITY.md": "# Security\n",
    "CHANGELOG.md": "# Changelog\n",
    ".github/workflows/ci.yml": "name: CI\njobs:\n  test:\n    steps:\n      - run: npm test\n",
    ".github/ISSUE_TEMPLATE/bug_report.md": "---\nname: Bug report\n---\n",
    "package.json": JSON.stringify(
      {
        name: "launch-helper",
        description: "Launch readiness checks.",
        license: "MIT",
        keywords: ["open-source", "cli", "github"],
        scripts: { test: "node --test" },
      },
      null,
      2,
    ),
  };

  const withoutLicense = { ...baseFiles };
  delete withoutLicense.LICENSE;

  const withoutChangelog = { ...baseFiles };
  delete withoutChangelog["CHANGELOG.md"];

  const licenseRepo = await makeRepo(withoutLicense);
  const changelogRepo = await makeRepo(withoutChangelog);

  try {
    const licenseResult = await auditRepository(licenseRepo);
    const changelogResult = await auditRepository(changelogRepo);

    assert.equal(licenseResult.checks.find((check) => check.id === "license")?.status, "fail");
    assert.equal(changelogResult.checks.find((check) => check.id === "changelog")?.status, "fail");
    assert.equal(licenseResult.score < changelogResult.score, true);
  } finally {
    await rm(licenseRepo, { recursive: true, force: true });
    await rm(changelogRepo, { recursive: true, force: true });
  }
});

test("README section checks require matching headings instead of incidental words", async () => {
  const repo = await makeRepo({
    "README.md": [
      "# Launch Helper",
      "",
      "Launch Helper audits open-source repositories before sharing. No roadmap yet.",
      "",
      "## Installation",
      "npm install -g launch-helper",
      "",
      "## Quickstart",
      "launch-helper .",
      "",
      "## Example output",
      "Score: 94/100",
      "",
      "## Contributing",
      "Issues and pull requests are welcome.",
      "",
      "## Support",
      "Open an issue for help.",
    ].join("\n"),
    LICENSE: "MIT License\n",
    "CONTRIBUTING.md": "# Contributing\n",
    "CODE_OF_CONDUCT.md": "# Code of Conduct\n",
    "SECURITY.md": "# Security\n",
    "CHANGELOG.md": "# Changelog\n",
    ".github/workflows/ci.yml": "name: CI\njobs:\n  test:\n    steps:\n      - run: npm test\n",
    ".github/ISSUE_TEMPLATE/bug_report.md": "---\nname: Bug report\n---\n",
    "package.json": JSON.stringify(
      {
        name: "launch-helper",
        description: "Launch readiness checks.",
        license: "MIT",
        keywords: ["open-source", "cli", "github"],
        scripts: { test: "node --test" },
      },
      null,
      2,
    ),
  });

  try {
    const result = await auditRepository(repo);
    const readmeCheck = result.checks.find((check) => check.id === "readme");

    assert.equal(readmeCheck?.status, "warn");
    assert.match(readmeCheck?.message ?? "", /roadmap/);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("CI command checks inspect run commands and ignore echoed examples", async () => {
  const repo = await makeRepo({
    "README.md": [
      "# Launch Helper",
      "",
      "Launch Helper audits open-source repositories before sharing.",
      "",
      "## Installation",
      "npm install -g launch-helper",
      "",
      "## Quickstart",
      "launch-helper .",
      "",
      "## Example output",
      "Score: 94/100",
      "",
      "## Roadmap",
      "- More repository checks",
      "",
      "## Contributing",
      "Issues and pull requests are welcome.",
      "",
      "## Support",
      "Open an issue for help.",
    ].join("\n"),
    LICENSE: "MIT License\n",
    "CONTRIBUTING.md": "# Contributing\n",
    "CODE_OF_CONDUCT.md": "# Code of Conduct\n",
    "SECURITY.md": "# Security\n",
    "CHANGELOG.md": "# Changelog\n",
    ".github/workflows/ci.yml":
      'name: CI\njobs:\n  test:\n    steps:\n      - run: echo "npm test"\n',
    ".github/ISSUE_TEMPLATE/bug_report.md": "---\nname: Bug report\n---\n",
    "package.json": JSON.stringify(
      {
        name: "launch-helper",
        description: "Launch readiness checks.",
        license: "MIT",
        keywords: ["open-source", "cli", "github"],
        scripts: { test: "node --test" },
      },
      null,
      2,
    ),
  });

  try {
    const result = await auditRepository(repo);
    const ciCheck = result.checks.find((check) => check.id === "ci");

    assert.equal(ciCheck?.status, "warn");
    assert.match(ciCheck?.message ?? "", /does not appear to run tests/);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("CI command checks recognize common non-npm test runners", async () => {
  const repo = await makeRepo({
    "README.md": [
      "# Launch Helper",
      "",
      "Launch Helper audits open-source repositories before sharing.",
      "",
      "## Installation",
      "npm install -g launch-helper",
      "",
      "## Quickstart",
      "launch-helper .",
      "",
      "## Example output",
      "Score: 94/100",
      "",
      "## Roadmap",
      "- More repository checks",
      "",
      "## Contributing",
      "Issues and pull requests are welcome.",
      "",
      "## Support",
      "Open an issue for help.",
    ].join("\n"),
    LICENSE: "MIT License\n",
    "CONTRIBUTING.md": "# Contributing\n",
    "CODE_OF_CONDUCT.md": "# Code of Conduct\n",
    "SECURITY.md": "# Security\n",
    "CHANGELOG.md": "# Changelog\n",
    ".github/workflows/ci.yml":
      "name: CI\njobs:\n  test:\n    steps:\n      - run: pnpm exec vitest run\n",
    ".github/ISSUE_TEMPLATE/bug_report.md": "---\nname: Bug report\n---\n",
    "package.json": JSON.stringify(
      {
        name: "launch-helper",
        description: "Launch readiness checks.",
        license: "MIT",
        keywords: ["open-source", "cli", "github"],
        scripts: { test: "node --test" },
      },
      null,
      2,
    ),
  });

  try {
    const result = await auditRepository(repo);
    const ciCheck = result.checks.find((check) => check.id === "ci");

    assert.equal(ciCheck?.status, "pass");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("topic suggestions ignore generated directories and gitignored files", async () => {
  const repo = await makeRepo({
    "README.md": [
      "# Launch Helper",
      "",
      "Launch Helper audits repositories before sharing.",
      "",
      "## Installation",
      "npm install -g launch-helper",
      "",
      "## Quickstart",
      "launch-helper .",
      "",
      "## Example output",
      "Score: 94/100",
      "",
      "## Roadmap",
      "- More repository checks",
      "",
      "## Contributing",
      "Issues and pull requests are welcome.",
      "",
      "## Support",
      "Open an issue for help.",
    ].join("\n"),
    ".gitignore": "generated/\n",
    "coverage/covered.ts": "export const covered = true;\n",
    "generated/ignored.ts": "export const ignored = true;\n",
  });

  try {
    const result = await auditRepository(repo);

    assert.equal(result.topics.includes("typescript"), false);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});
