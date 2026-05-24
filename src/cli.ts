import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { auditRepository } from "./audit.js";
import { renderPromotionCopy } from "./promotion.js";
import { renderJson, renderMarkdownReport } from "./report.js";

interface CliOptions {
  repoPath: string;
  output: string;
  promotionOutput: string;
  json: boolean;
  promotion: boolean;
}

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

    const result = await auditRepository(options.repoPath);

    if (options.json) {
      process.stdout.write(renderJson(result));
      return 0;
    }

    await writeTextFile(options.output, renderMarkdownReport(result));
    process.stdout.write(`Launch report written to ${options.output}\n`);

    if (options.promotion) {
      await writeTextFile(options.promotionOutput, renderPromotionCopy({
        repoName: inferRepoName(result.repoPath),
        repoUrl: "Add your repository URL before posting.",
        topics: result.topics
      }));
      process.stdout.write(`Promotion copy written to ${options.promotionOutput}\n`);
    }

    process.stdout.write(`Score: ${result.score}/100 (${result.summary.pass} pass, ${result.summary.warn} warn, ${result.summary.fail} fail)\n`);
    return 0;
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
    promotion: true
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

  return options;
}

function requireValue(flag: string, value: string | undefined): string {
  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${flag}`);
  }

  return value;
}

async function writeTextFile(filePath: string, contents: string): Promise<void> {
  await mkdir(path.dirname(path.resolve(filePath)), { recursive: true });
  await writeFile(filePath, contents, "utf8");
}

function inferRepoName(repoPath: string): string {
  return path.basename(path.resolve(repoPath)) || "oss-launch-lint";
}

function helpText(): string {
  return [
    "oss-launch-lint [repoPath] [options]",
    "",
    "Audit whether a GitHub repo is ready to share and generate launch assets.",
    "",
    "Options:",
    "  --output <file>             Markdown report path (default: launch-report.md)",
    "  --promotion-output <file>   Promotion copy path (default: promotion-copy.md)",
    "  --json                      Print documented JSON to stdout",
    "  --no-promotion              Do not write promotion-copy.md",
    "  --version, -v               Print version",
    "  --help, -h                  Show help",
    ""
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
