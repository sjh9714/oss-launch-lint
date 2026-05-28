import { lstat, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export type FixActionStatus = "create" | "skip-existing" | "overwrite";

export interface FixAction {
  path: string;
  status: FixActionStatus;
  contents: string;
}

export interface FixOptions {
  repoPath: string;
  dryRun: boolean;
  yes: boolean;
  force: boolean;
}

export interface FixResult {
  actions: FixAction[];
  wrote: string[];
  skipped: string[];
}

interface ScaffoldTemplate {
  path: string;
  contents: string;
}

const TEMPLATES: ScaffoldTemplate[] = [
  {
    path: "CONTRIBUTING.md",
    contents: `# Contributing

Thanks for considering a contribution.

## Setup

1. Fork and clone the repository.
2. Install dependencies using the documented package manager.
3. Run the test, lint, and build commands before opening a pull request.

## Pull requests

- Keep changes focused and easy to review.
- Include tests or a clear manual verification note.
- Do not include secrets, tokens, or private user data.
`,
  },
  {
    path: "SECURITY.md",
    contents: `# Security Policy

Please do not report security issues in public issues.

If you find a vulnerability, contact the maintainer privately with:

- A clear description of the issue.
- Steps to reproduce.
- The affected version or commit when known.

The maintainer will review the report and coordinate a fix when appropriate.
`,
  },
  {
    path: "CODE_OF_CONDUCT.md",
    contents: `# Code of Conduct

This project expects respectful, constructive participation.

## Expected behavior

- Be kind and professional.
- Assume good intent while staying clear about problems.
- Keep feedback focused on the work.

## Unacceptable behavior

- Harassment, threats, or personal attacks.
- Publishing private information.
- Spam or repeated off-topic promotion.

Maintainers may remove comments, issues, or pull requests that violate these expectations.
`,
  },
  {
    path: "CHANGELOG.md",
    contents: `# Changelog

All notable changes to this project will be documented here.

## Unreleased

- Initial launch-readiness work.
`,
  },
  {
    path: ".github/ISSUE_TEMPLATE/bug_report.md",
    contents: `---
name: Bug report
about: Report something that is broken or confusing
title: "[Bug]: "
labels: bug
assignees: ""
---

## What happened?

## Steps to reproduce

1.
2.
3.

## Expected behavior

## Environment

- OS:
- Node/runtime version:
- Command you ran:

## Additional context
`,
  },
  {
    path: ".github/ISSUE_TEMPLATE/feature_request.md",
    contents: `---
name: Feature request
about: Suggest a practical improvement
title: "[Feature]: "
labels: enhancement
assignees: ""
---

## Problem

What launch or maintainer workflow would this improve?

## Proposed solution

## Alternatives considered

## Additional context
`,
  },
  {
    path: ".github/workflows/oss-launch-lint.yml",
    contents: `name: Launch readiness

on:
  pull_request:
  push:
    branches: [main]

jobs:
  launch-readiness:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: 24
      - run: npx oss-launch-lint@latest "$GITHUB_WORKSPACE" --fail-under 80 --github-step-summary --no-promotion
`,
  },
];

export async function planFixes(
  options: Pick<FixOptions, "repoPath" | "force">,
): Promise<FixAction[]> {
  const repoPath = path.resolve(options.repoPath);

  return Promise.all(
    TEMPLATES.map(async (template) => {
      const exists = await fileExists(path.join(repoPath, template.path));
      const status: FixActionStatus = exists
        ? options.force
          ? "overwrite"
          : "skip-existing"
        : "create";

      return {
        path: template.path,
        status,
        contents: template.contents,
      };
    }),
  );
}

export async function applyFixes(options: FixOptions): Promise<FixResult> {
  const repoPath = path.resolve(options.repoPath);
  const actions = await planFixes({ repoPath, force: options.force });
  const wrote: string[] = [];
  const skipped: string[] = [];

  if (options.dryRun) {
    return { actions, wrote, skipped };
  }

  for (const action of actions) {
    if (action.status === "skip-existing") {
      skipped.push(action.path);
      continue;
    }

    const absolutePath = path.join(repoPath, action.path);
    await mkdir(path.dirname(absolutePath), { recursive: true });

    if (action.status === "overwrite") {
      await rm(absolutePath, { force: true });
    }

    try {
      await writeFile(absolutePath, action.contents, { encoding: "utf8", flag: "wx" });
    } catch (error) {
      if (isAlreadyExistsError(error)) {
        skipped.push(action.path);
        continue;
      }

      throw error;
    }

    wrote.push(action.path);
  }

  return { actions, wrote, skipped };
}

export function renderFixPlan(actions: FixAction[], dryRun: boolean): string {
  const heading = dryRun ? "Scaffold plan (--dry-run; no files written)" : "Scaffold plan";
  const lines = actions.map((action) => `- ${action.status}: ${action.path}`);

  return [heading, "", ...lines, ""].join("\n");
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await lstat(filePath);
    return true;
  } catch (error) {
    if (isNotFoundError(error)) {
      return false;
    }

    throw error;
  }
}

function isNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "ENOENT"
  );
}

function isAlreadyExistsError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "EEXIST"
  );
}
