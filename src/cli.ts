import { execFile } from "node:child_process";
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

import { auditRepository } from "./audit.js";
import { applyFixes, type FixResult, planFixes, renderFixPlan } from "./fix.js";
import { renderPromotionCopy } from "./promotion.js";
import { renderJson, renderMarkdownReport } from "./report.js";
import type { AuditResult } from "./types.js";

interface CliOptions {
  repoPath: string;
  output: string;
  promotionOutput: string;
  json: boolean;
  promotion: boolean;
  fix: boolean;
  dryRun: boolean;
  yes: boolean;
  force: boolean;
  failUnder: number | undefined;
  githubStepSummary: boolean;
}

const execFileAsync = promisify(execFile);
const REPO_URL_PLACEHOLDER = "Add your repository URL before posting.";

export async function main(argv = process.argv.slice(2)): Promise<number> {
  try {
    const options = parseArgs(argv);

    if (options === "help") {
      process.stdout.write(helpText());
      return 0;
    }

    if (options === "version") {
      process.stdout.write(`${await getPackageVersion()}\n`);
      return 0;
    }

    let result = await auditRepository(options.repoPath);
    const beforeFixResult = result;
    let fixResult: FixResult | undefined;
    const reportToStdout = options.output === "-";

    if (options.fix) {
      if (options.dryRun) {
        const actions = await planFixes({ repoPath: options.repoPath, force: options.force });
        process.stdout.write(renderFixPlan(actions, true));
      } else {
        const actions = await planFixes({ repoPath: options.repoPath, force: options.force });
        const writableActionCount = actions.filter(
          (action) => action.status !== "skip-existing",
        ).length;
        if (writableActionCount > 0 && !options.yes && !(await confirmFixes(writableActionCount))) {
          process.stderr.write("Scaffold cancelled.\n");
          return 1;
        }

        fixResult = await applyFixes(options);
        process.stdout.write(renderFixPlan(fixResult.actions, false));
        process.stdout.write(
          `Scaffold complete: ${fixResult.wrote.length} written, ${fixResult.skipped.length} skipped.\n`,
        );
        result = await auditRepository(options.repoPath);
      }
    }

    if (options.json) {
      process.stdout.write(renderJson(result));
      return exitForThreshold(result.score, options.failUnder);
    }

    const markdown = fixResult
      ? addFixSummary(renderMarkdownReport(result), beforeFixResult, result, fixResult)
      : renderMarkdownReport(result);

    if (!options.dryRun) {
      if (reportToStdout) {
        process.stdout.write(markdown);
      } else {
        await writeTextFile(options.output, markdown);
        process.stdout.write(`Launch report written to ${options.output}\n`);
      }

      if (options.promotion) {
        await writeTextFile(
          options.promotionOutput,
          renderPromotionCopy({
            repoName: inferRepoName(result.repoPath),
            repoUrl: await inferRepoUrl(result.repoPath),
            topics: result.topics,
          }),
        );
        writeInfo(`Promotion copy written to ${options.promotionOutput}\n`, reportToStdout);
      }
    }

    if (options.githubStepSummary && !options.dryRun) {
      await writeGitHubStepSummary(markdown);
    }

    writeInfo(
      `Score: ${result.score}/100 (${result.summary.pass} pass, ${result.summary.warn} warn, ${result.summary.fail} fail)\n`,
      reportToStdout,
    );

    return exitForThreshold(result.score, options.failUnder);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    return 1;
  }
}

function parseArgs(argv: string[]): CliOptions | "help" | "version" {
  const args = [...argv];
  const options: CliOptions = {
    repoPath: ".",
    output: "launch-report.md",
    promotionOutput: "promotion-copy.md",
    json: false,
    promotion: true,
    fix: false,
    dryRun: false,
    yes: false,
    force: false,
    failUnder: undefined,
    githubStepSummary: false,
  };

  while (args.length > 0) {
    const arg = args.shift();
    if (!arg) {
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      return "help";
    }

    if (arg === "--version" || arg === "-v") {
      return "version";
    }

    if (arg === "--json") {
      options.json = true;
      continue;
    }

    if (arg === "--no-promotion") {
      options.promotion = false;
      continue;
    }

    if (arg === "--fix") {
      options.fix = true;
      continue;
    }

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--yes") {
      options.yes = true;
      continue;
    }

    if (arg === "--force") {
      options.force = true;
      continue;
    }

    if (arg === "--github-step-summary") {
      options.githubStepSummary = true;
      continue;
    }

    if (arg === "--fail-under") {
      options.failUnder = parseThreshold(requireValue(arg, args.shift()));
      continue;
    }

    if (arg === "--output") {
      options.output = requireValue(arg, args.shift());
      continue;
    }

    if (arg === "--promotion-output") {
      options.promotionOutput = requireValue(arg, args.shift());
      continue;
    }

    if (arg.startsWith("--")) {
      throw new Error(`Unknown option: ${arg}`);
    }

    options.repoPath = arg;
  }

  validateOptionCombinations(options);
  return options;
}

function requireValue(flag: string, value: string | undefined): string {
  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${flag}`);
  }

  return value;
}

function parseThreshold(value: string): number {
  const threshold = Number(value);
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 100) {
    throw new Error("--fail-under must be between 0 and 100.");
  }

  return threshold;
}

function validateOptionCombinations(options: CliOptions): void {
  if (options.dryRun && !options.fix) {
    throw new Error("--dry-run requires --fix.");
  }

  if (options.yes && !options.fix) {
    throw new Error("--yes requires --fix.");
  }

  if (options.force && !options.fix) {
    throw new Error("--force requires --fix.");
  }

  if (options.json && options.fix) {
    throw new Error("--json cannot be combined with --fix.");
  }

  if (options.json && options.githubStepSummary) {
    throw new Error("--json cannot be combined with --github-step-summary.");
  }
}

async function writeTextFile(filePath: string, contents: string): Promise<void> {
  await mkdir(path.dirname(path.resolve(filePath)), { recursive: true });
  await writeFile(filePath, contents, "utf8");
}

async function writeGitHubStepSummary(markdown: string): Promise<void> {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) {
    process.stderr.write(
      "Warning: GITHUB_STEP_SUMMARY is not set; skipping GitHub step summary.\n",
    );
    return;
  }

  await appendFile(summaryPath, `${markdown}\n`, "utf8");
}

async function confirmFixes(actionCount: number): Promise<boolean> {
  if (!process.stdin.isTTY) {
    throw new Error("Use --yes to run --fix in a non-interactive environment.");
  }

  const reader = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await reader.question(
      `Create or update ${actionCount} launch-readiness files? [y/N] `,
    );
    return answer.trim().toLowerCase() === "y" || answer.trim().toLowerCase() === "yes";
  } finally {
    reader.close();
  }
}

function writeInfo(message: string, stdoutIsReport: boolean): void {
  if (stdoutIsReport) {
    process.stderr.write(message);
    return;
  }

  process.stdout.write(message);
}

function exitForThreshold(score: number, threshold: number | undefined): number {
  if (threshold === undefined || score >= threshold) {
    return 0;
  }

  process.stderr.write(`Score ${score}/100 is below fail-under threshold ${threshold}.\n`);
  return 1;
}

function inferRepoName(repoPath: string): string {
  return path.basename(path.resolve(repoPath)) || "oss-launch-lint";
}

function addFixSummary(
  markdown: string,
  before: AuditResult,
  after: AuditResult,
  fixResult: FixResult,
): string {
  const summary = [
    "## Fix summary",
    "",
    `Score before fix: ${before.score}/100`,
    `Score after fix: ${after.score}/100`,
    `Scaffold: ${fixResult.wrote.length} written, ${fixResult.skipped.length} skipped`,
    "",
  ].join("\n");

  return markdown.replace("\n## Checks\n", `\n${summary}\n## Checks\n`);
}

async function inferRepoUrl(repoPath: string): Promise<string> {
  const packageUrl = await readPackageRepositoryUrl(repoPath);
  const normalizedPackageUrl = normalizeRepoUrl(packageUrl);
  if (normalizedPackageUrl) {
    return normalizedPackageUrl;
  }

  const remoteUrl = await readGitRemoteUrl(repoPath);
  return normalizeRepoUrl(remoteUrl) ?? REPO_URL_PLACEHOLDER;
}

async function readPackageRepositoryUrl(repoPath: string): Promise<string | undefined> {
  try {
    const contents = await readFile(path.join(path.resolve(repoPath), "package.json"), "utf8");
    const parsed: unknown = JSON.parse(contents);
    if (!isRecord(parsed)) {
      return undefined;
    }

    const repository = parsed.repository;
    if (typeof repository === "string") {
      return repository;
    }

    if (isRecord(repository) && typeof repository.url === "string") {
      return repository.url;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

async function readGitRemoteUrl(repoPath: string): Promise<string | undefined> {
  try {
    const { stdout } = await execFileAsync("git", [
      "-C",
      path.resolve(repoPath),
      "remote",
      "get-url",
      "origin",
    ]);
    return stdout.trim();
  } catch {
    return undefined;
  }
}

function normalizeRepoUrl(value: string | undefined): string | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  let url = value.trim();
  if (url.startsWith("git+")) {
    url = url.slice("git+".length);
  }

  const gitSshMatch = /^git@([^:]+):(.+)$/.exec(url);
  if (gitSshMatch) {
    url = `https://${gitSshMatch[1]}/${gitSshMatch[2]}`;
  }

  const sshUrlMatch = /^ssh:\/\/git@([^/]+)\/(.+)$/.exec(url);
  if (sshUrlMatch) {
    url = `https://${sshUrlMatch[1]}/${sshUrlMatch[2]}`;
  }

  return url.replace(/\.git$/, "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function helpText(): string {
  return [
    "oss-launch-lint [repoPath] [options]",
    "",
    "Audit whether a GitHub repo is ready to share and generate launch assets.",
    "",
    "Options:",
    "  --output <file>             Markdown report path (default: launch-report.md)",
    "                              Use - to print the Markdown report to stdout",
    "  --promotion-output <file>   Promotion copy path (default: promotion-copy.md)",
    "  --json                      Print documented JSON to stdout",
    "  --no-promotion              Do not write promotion-copy.md",
    "  --fix                       Scaffold missing launch-readiness files",
    "  --dry-run                   With --fix, preview scaffold actions without writing files",
    "  --yes                       With --fix, skip the interactive confirmation prompt",
    "  --force                     With --fix, overwrite scaffold targets that already exist",
    "  --fail-under <score>        Exit non-zero if the readiness score is below score",
    "  --github-step-summary       Append the Markdown report to $GITHUB_STEP_SUMMARY",
    "  --version, -v               Print version",
    "  --help, -h                  Show help",
    "",
  ].join("\n");
}

async function getPackageVersion(): Promise<string> {
  const packagePath = path.resolve(path.dirname(currentFile), "../package.json");
  const contents = await readFile(packagePath, "utf8");
  const packageJson = JSON.parse(contents) as { version?: unknown };

  if (typeof packageJson.version !== "string" || !packageJson.version.trim()) {
    throw new Error("Cannot read version from package.json");
  }

  return packageJson.version;
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : "";

if (currentFile === invokedFile) {
  process.exitCode = await main();
}
