import { access, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

import type { AuditCheck, AuditResult, AuditSummary, CheckStatus } from "./types.js";

interface CiWorkflowInfo {
  files: string[];
  runCommands: string[];
}

const REQUIRED_FILES = [
  {
    id: "license",
    title: "License",
    files: ["LICENSE", "LICENSE.md", "COPYING"],
    missing: "LICENSE is missing.",
    recommendation: "Add LICENSE before launch so visitors know how they can use the project.",
  },
  {
    id: "contributing",
    title: "Contributing guide",
    files: ["CONTRIBUTING.md", ".github/CONTRIBUTING.md"],
    missing: "CONTRIBUTING.md is missing.",
    recommendation: "Add CONTRIBUTING.md with setup, test, and pull request guidance.",
  },
  {
    id: "code-of-conduct",
    title: "Code of conduct",
    files: ["CODE_OF_CONDUCT.md", ".github/CODE_OF_CONDUCT.md"],
    missing: "CODE_OF_CONDUCT.md is missing.",
    recommendation: "Add CODE_OF_CONDUCT.md to set participation expectations.",
  },
  {
    id: "security",
    title: "Security policy",
    files: ["SECURITY.md", ".github/SECURITY.md"],
    missing: "SECURITY.md is missing.",
    recommendation: "Add SECURITY.md with private vulnerability reporting instructions.",
  },
  {
    id: "changelog",
    title: "Changelog",
    files: ["CHANGELOG.md", "HISTORY.md", "RELEASES.md"],
    missing: "CHANGELOG.md is missing.",
    recommendation: "Add CHANGELOG.md and start it with the first public release.",
  },
];

const README_SECTIONS = [
  { label: "installation", headingPattern: /\b(install|installation|setup)\b/i },
  { label: "quickstart", headingPattern: /\b(quickstart|usage|getting started)\b/i },
  { label: "example output", headingPattern: /\b(example|output|demo)\b/i },
  { label: "roadmap", headingPattern: /\broadmap\b/i },
  { label: "contributing", headingPattern: /\bcontribut/i },
  { label: "support", headingPattern: /\b(support|help|questions)\b/i },
];

const CHECK_WEIGHTS: Record<string, number> = {
  readme: 20,
  license: 15,
  ci: 15,
  "test-script": 10,
  "package-metadata": 10,
  contributing: 8,
  "code-of-conduct": 6,
  security: 6,
  changelog: 5,
  "issue-template": 5,
};

const DEFAULT_IGNORED_DIRECTORIES = new Set([
  ".cache",
  ".git",
  ".next",
  ".nuxt",
  ".parcel-cache",
  ".turbo",
  ".venv",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "out",
  "target",
  "tmp",
  "vendor",
  "venv",
]);

const TOPIC_LIMIT = 12;

export async function auditRepository(repoPath: string): Promise<AuditResult> {
  const absoluteRepoPath = path.resolve(repoPath);
  await assertReadableDirectory(absoluteRepoPath);

  const files = await listRelativeFiles(absoluteRepoPath);
  const fileMap = new Map(files.map((file) => [normalizePath(file).toLowerCase(), file]));
  const lowerFiles = new Set(fileMap.keys());
  const readmePath = findFirst(fileMap, ["readme.md", "readme.markdown", "readme"]);
  const readme = readmePath ? await readTextIfPresent(absoluteRepoPath, readmePath) : "";
  const packageJson = await readPackageJson(absoluteRepoPath);
  const ciWorkflowInfo = await readCiWorkflowInfo(absoluteRepoPath, files);

  const checks: AuditCheck[] = [
    checkReadme(readmePath, readme),
    ...REQUIRED_FILES.map((item) => checkRequiredFile(fileMap, item)),
    checkCi(ciWorkflowInfo),
    checkIssueTemplates(lowerFiles),
    checkPackageMetadata(packageJson),
    checkTestScript(packageJson),
  ];

  const summary = summarize(checks);
  const score = scoreChecks(checks);
  const topics = suggestTopics(files, readme, packageJson);
  const nextActions = buildNextActions(checks);

  return {
    repoPath: absoluteRepoPath,
    generatedAt: new Date().toISOString(),
    score,
    summary,
    checks,
    topics,
    nextActions,
  };
}

async function assertReadableDirectory(repoPath: string): Promise<void> {
  try {
    const info = await stat(repoPath);
    if (!info.isDirectory()) {
      throw new Error("not-directory");
    }
    await access(repoPath);
  } catch {
    throw new Error(`Cannot read repository path: ${repoPath}`);
  }
}

async function listRelativeFiles(root: string): Promise<string[]> {
  const results: string[] = [];
  const ignoreRules = await readGitignoreRules(root);

  async function walk(current: string): Promise<void> {
    const entries = await readdir(current, { withFileTypes: true });

    for (const entry of entries) {
      const absolutePath = path.join(current, entry.name);
      const relativePath = normalizePath(path.relative(root, absolutePath));

      if (shouldIgnoreEntry(entry.name, relativePath, entry.isDirectory(), ignoreRules)) {
        continue;
      }

      if (entry.isDirectory()) {
        await walk(absolutePath);
      } else if (entry.isFile()) {
        results.push(relativePath);
      }
    }
  }

  await walk(root);
  return results;
}

function checkReadme(readmePath: string | undefined, readme: string): AuditCheck {
  if (!readmePath) {
    return {
      id: "readme",
      title: "README",
      status: "fail",
      message: "README.md is missing.",
      recommendation:
        "Add README.md with the project value proposition, install command, quickstart, example output, roadmap, support, and contribution notes.",
    };
  }

  const headings = extractMarkdownHeadings(readme);
  const missingSections = README_SECTIONS.filter(
    (section) => !headings.some((heading) => section.headingPattern.test(heading)),
  ).map((section) => section.label);

  if (readme.trim().length < 250 || missingSections.length >= 3) {
    return {
      id: "readme",
      title: "README",
      status: "warn",
      message: `README exists but is missing launch-critical sections: ${missingSections.join(", ") || "more detail"}.`,
      recommendation:
        "Make the first screen answer what it does, who it helps, how to install it, and what output to expect.",
    };
  }

  if (missingSections.length > 0) {
    return {
      id: "readme",
      title: "README",
      status: "warn",
      message: `README is present but could be clearer. Missing: ${missingSections.join(", ")}.`,
      recommendation: "Add the missing README sections before a public launch.",
    };
  }

  return {
    id: "readme",
    title: "README",
    status: "pass",
    message: "README includes the main onboarding sections.",
    recommendation: "Keep the first screen concrete and copy-paste friendly.",
  };
}

function checkRequiredFile(
  fileMap: Map<string, string>,
  item: {
    id: string;
    title: string;
    files: string[];
    missing: string;
    recommendation: string;
  },
): AuditCheck {
  const found = findFirst(fileMap, item.files);

  if (!found) {
    return {
      id: item.id,
      title: item.title,
      status: "fail",
      message: item.missing,
      recommendation: item.recommendation,
    };
  }

  return {
    id: item.id,
    title: item.title,
    status: "pass",
    message: `${item.title} found at ${found}.`,
  };
}

function checkCi(workflowInfo: CiWorkflowInfo): AuditCheck {
  if (workflowInfo.files.length === 0) {
    return {
      id: "ci",
      title: "Continuous integration",
      status: "fail",
      message: "No GitHub Actions workflow found.",
      recommendation:
        "Add .github/workflows/ci.yml that runs lint, tests, and build on pull requests.",
    };
  }

  if (!hasMeaningfulCiCommand(workflowInfo.runCommands)) {
    return {
      id: "ci",
      title: "Continuous integration",
      status: "warn",
      message:
        "A GitHub Actions workflow exists but does not appear to run tests, lint, build, or a comparable check.",
      recommendation:
        "Add at least one meaningful CI command such as npm test, npm run lint, npm run build, pytest, cargo test, go test, or dotnet test.",
    };
  }

  return {
    id: "ci",
    title: "Continuous integration",
    status: "pass",
    message: "GitHub Actions workflow found with a meaningful verification command.",
  };
}

function checkIssueTemplates(lowerFiles: Set<string>): AuditCheck {
  const hasTemplate = [...lowerFiles].some((file) => file.startsWith(".github/issue_template/"));

  return hasTemplate
    ? {
        id: "issue-template",
        title: "Issue templates",
        status: "pass",
        message: "Issue template found.",
      }
    : {
        id: "issue-template",
        title: "Issue templates",
        status: "fail",
        message: "No issue templates found.",
        recommendation:
          "Add .github/ISSUE_TEMPLATE/bug_report.md and feature_request.md to make feedback easier.",
      };
}

function checkPackageMetadata(packageJson: Record<string, unknown> | undefined): AuditCheck {
  if (!packageJson) {
    return {
      id: "package-metadata",
      title: "Package metadata",
      status: "warn",
      message: "No package.json found.",
      recommendation:
        "If this repo is publishable, add package metadata with name, description, keywords, license, and scripts.",
    };
  }

  const missing = ["name", "description", "license"].filter(
    (field) => !hasString(packageJson[field]),
  );
  const keywords = packageJson.keywords;
  if (!Array.isArray(keywords) || keywords.length === 0) {
    missing.push("keywords");
  }

  if (missing.length > 0) {
    return {
      id: "package-metadata",
      title: "Package metadata",
      status: "warn",
      message: `package.json is missing useful launch metadata: ${missing.join(", ")}.`,
      recommendation:
        "Fill in package name, description, license, and keywords so npm/GitHub previews are useful.",
    };
  }

  return {
    id: "package-metadata",
    title: "Package metadata",
    status: "pass",
    message: "package.json includes launch metadata.",
  };
}

function checkTestScript(packageJson: Record<string, unknown> | undefined): AuditCheck {
  const scripts = packageJson?.scripts;
  const testScript = isRecord(scripts) && hasString(scripts.test) ? scripts.test : "";

  if (!testScript) {
    return {
      id: "test-script",
      title: "Test command",
      status: "fail",
      message: "No package test script found.",
      recommendation: "Add a test command and document it in README.",
    };
  }

  return {
    id: "test-script",
    title: "Test command",
    status: "pass",
    message: `Test script found: ${testScript}`,
  };
}

function summarize(checks: AuditCheck[]): AuditSummary {
  return checks.reduce<AuditSummary>(
    (summary, check) => {
      summary[check.status] += 1;
      return summary;
    },
    { pass: 0, warn: 0, fail: 0 },
  );
}

function scoreChecks(checks: AuditCheck[]): number {
  const totalWeight = checks.reduce((total, check) => total + weightForCheck(check.id), 0);
  const points = checks.reduce((total, check) => {
    const weight = weightForCheck(check.id);

    if (check.status === "pass") {
      return total + weight;
    }

    if (check.status === "warn") {
      return total + weight * 0.5;
    }

    return total;
  }, 0);

  return Math.round((points / totalWeight) * 100);
}

function buildNextActions(checks: AuditCheck[]): string[] {
  const actions = checks
    .filter((check) => check.status !== "pass")
    .map((check) => check.recommendation)
    .filter((action): action is string => Boolean(action));

  if (actions.length === 0) {
    return [
      "Create release notes and share the project with a small group of relevant maintainers for feedback.",
    ];
  }

  return actions.slice(0, 8);
}

function suggestTopics(
  files: string[],
  readme: string,
  packageJson: Record<string, unknown> | undefined,
): string[] {
  const topics = new Set<string>(["open-source", "github", "developer-tools"]);
  const lowerReadme = readme.toLowerCase();
  const packageKeywords = packageJson?.keywords;

  if (Array.isArray(packageKeywords)) {
    for (const keyword of packageKeywords) {
      if (typeof keyword === "string" && keyword.trim()) {
        topics.add(slugTopic(keyword));
      }
    }
  }

  if (files.some((file) => file.endsWith(".ts") || file.endsWith(".tsx"))) {
    topics.add("typescript");
    topics.add("cli");
  }

  if (
    files.some((file) => file.endsWith(".js") || file.endsWith(".mjs") || file.endsWith(".cjs"))
  ) {
    topics.add("javascript");
  }

  if (files.some((file) => file.endsWith(".py"))) {
    topics.add("python");
  }

  if (files.some((file) => file.toLowerCase() === "package.json")) {
    topics.add("nodejs");
  }

  if (lowerReadme.includes("readme")) {
    topics.add("readme");
  }

  if (lowerReadme.includes("ci") || lowerReadme.includes("github actions")) {
    topics.add("ci");
  }

  if (lowerReadme.includes("maintainer")) {
    topics.add("maintainer-tools");
  }

  if (lowerReadme.includes("launch")) {
    topics.add("launch");
  }

  return [...topics].filter(Boolean).slice(0, TOPIC_LIMIT);
}

async function readPackageJson(root: string): Promise<Record<string, unknown> | undefined> {
  const contents = await readTextIfPresent(root, "package.json");
  if (!contents) {
    return undefined;
  }

  try {
    const parsed: unknown = JSON.parse(contents);
    return isRecord(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

async function readCiWorkflowInfo(root: string, files: string[]): Promise<CiWorkflowInfo> {
  const workflowFiles = files.filter((file) => {
    const lower = file.toLowerCase();
    return (
      lower.startsWith(".github/workflows/") && (lower.endsWith(".yml") || lower.endsWith(".yaml"))
    );
  });

  const contents = await Promise.all(workflowFiles.map((file) => readTextIfPresent(root, file)));
  return {
    files: workflowFiles,
    runCommands: contents.flatMap(extractWorkflowRunCommands),
  };
}

async function readTextIfPresent(root: string, relativePath: string): Promise<string> {
  try {
    return await readFile(path.join(root, relativePath), "utf8");
  } catch {
    return "";
  }
}

function findFirst(fileMap: Map<string, string>, candidates: string[]): string | undefined {
  const key = candidates
    .map((candidate) => normalizePath(candidate).toLowerCase())
    .find((candidate) => fileMap.has(candidate));
  return key ? fileMap.get(key) : undefined;
}

function normalizePath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

function hasString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function slugTopic(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function weightForCheck(id: string): number {
  return CHECK_WEIGHTS[id] ?? 1;
}

function extractMarkdownHeadings(markdown: string): string[] {
  const headings: string[] = [];
  let inFence = false;

  for (const line of markdown.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }

    if (inFence) {
      continue;
    }

    const match = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line.trim());
    if (match) {
      headings.push(match[2].trim());
    }
  }

  return headings;
}

function extractWorkflowRunCommands(contents: string): string[] {
  const commands: string[] = [];
  const lines = contents.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const inlineMatch = /^(\s*)(?:-\s*)?run:\s*(.+?)\s*$/.exec(line);
    if (!inlineMatch) {
      continue;
    }

    const runIndent = inlineMatch[1].length;
    const value = inlineMatch[2].trim();
    if (value === "|" || value === ">") {
      const blockLines: string[] = [];
      for (index += 1; index < lines.length; index += 1) {
        const blockLine = lines[index];
        if (blockLine.trim() && leadingSpaces(blockLine) <= runIndent) {
          index -= 1;
          break;
        }
        blockLines.push(blockLine.slice(Math.min(blockLine.length, runIndent + 2)));
      }
      commands.push(blockLines.join("\n"));
      continue;
    }

    commands.push(stripYamlQuotes(value));
  }

  return commands;
}

function hasMeaningfulCiCommand(commands: string[]): boolean {
  return commands.some((command) => command.split(/\r?\n/).some(isMeaningfulCiLine));
}

function isMeaningfulCiLine(line: string): boolean {
  const command = line.trim();
  if (!command || command.startsWith("#") || /^(echo|printf)\b/i.test(command)) {
    return false;
  }

  return (
    /\b(npm|pnpm|yarn)\s+(run\s+)?(test|lint|build)\b/i.test(command) ||
    /\bbun\s+(test|run\s+(test|lint|build))\b/i.test(command) ||
    /\b(pnpm|npm|yarn|bun)\s+exec\s+(vitest|jest|eslint|tsc|prettier|biome)\b/i.test(command) ||
    /\b(make|just)\s+(test|lint|build|check)\b/i.test(command) ||
    /\b(uv\s+run\s+pytest|pytest|cargo\s+test|go\s+test|dotnet\s+test|bundle\s+exec\s+rspec|mix\s+test)\b/i.test(
      command,
    )
  );
}

function leadingSpaces(value: string): number {
  return value.length - value.trimStart().length;
}

function stripYamlQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

async function readGitignoreRules(root: string): Promise<string[]> {
  const contents = await readTextIfPresent(root, ".gitignore");
  return contents
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && !line.startsWith("!"));
}

function shouldIgnoreEntry(
  name: string,
  relativePath: string,
  isDirectory: boolean,
  ignoreRules: string[],
): boolean {
  if (isDirectory && DEFAULT_IGNORED_DIRECTORIES.has(name)) {
    return true;
  }

  return ignoreRules.some((rule) => matchesIgnoreRule(rule, relativePath, name, isDirectory));
}

function matchesIgnoreRule(
  rawRule: string,
  relativePath: string,
  name: string,
  isDirectory: boolean,
): boolean {
  const directoryOnly = rawRule.endsWith("/");
  const anchored = rawRule.startsWith("/");
  const rule = rawRule.replace(/^\/+/, "").replace(/\/+$/, "");

  if (!rule || (directoryOnly && !isDirectory)) {
    return false;
  }

  if (!rule.includes("*")) {
    if (anchored || rule.includes("/")) {
      return relativePath === rule || relativePath.startsWith(`${rule}/`);
    }

    return name === rule || relativePath.split("/").includes(rule);
  }

  const pattern = wildcardPattern(rule);
  if (anchored || rule.includes("/")) {
    return pattern.test(relativePath);
  }

  return pattern.test(name);
}

function wildcardPattern(rule: string): RegExp {
  const escaped = rule.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`);
}
