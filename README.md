# oss-launch-lint

[![CI](https://github.com/sjh9714/oss-launch-lint/actions/workflows/ci.yml/badge.svg)](https://github.com/sjh9714/oss-launch-lint/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Find the launch gaps that make people leave your GitHub repo in the first 20 seconds.

`oss-launch-lint` is a tiny CLI for maintainers, indie developers, students, and AI-assisted builders who have working code but want the repository to feel ready before sharing it.

## Why it is useful

Many useful repos lose visitors because the README, install path, license, CI status, or contribution path is unclear. This tool checks the boring-but-important launch details, generates concrete next actions, suggests GitHub topics, and can scaffold missing community files without overwriting your work.

## What you get

```text
Score: 72/100

Fail:
- No LICENSE file
- No issue templates
- README missing install instructions

Warn:
- CI exists but does not run tests
- package.json missing useful keywords

Next actions:
1. Add LICENSE
2. Add .github/ISSUE_TEMPLATE/bug_report.md
3. Add a copy-paste quickstart command
```

## Installation

This package is not published to npm yet. From a checkout:

```bash
git clone https://github.com/sjh9714/oss-launch-lint.git
cd oss-launch-lint
npm install
npm run build
```

Then run the CLI with Node:

```bash
node bin/oss-launch-lint --help
```

After npm publishing is approved and completed, the intended one-command path will be:

```bash
npx oss-launch-lint@latest .
```

## Quickstart

Audit the current repository and write launch assets:

```bash
node bin/oss-launch-lint . --output launch-report.md --promotion-output promotion-copy.md
```

Print JSON for automation:

```bash
node bin/oss-launch-lint . --json --no-promotion
```

Preview missing launch-readiness files without writing anything:

```bash
node bin/oss-launch-lint . --fix --dry-run --no-promotion
```

Create missing scaffold files after confirmation:

```bash
node bin/oss-launch-lint . --fix --no-promotion
```

Use in CI-style checks:

```bash
node bin/oss-launch-lint . --fail-under 80 --github-step-summary --no-promotion
```

Try the included demo fixture:

```bash
node bin/oss-launch-lint tests/fixtures/demo-repo --output tmp/demo-report.md --promotion-output tmp/demo-promotion.md
```

## Example output

Terminal summary:

```text
Launch report written to launch-report.md
Promotion copy written to promotion-copy.md
Score: 95/100 (9 pass, 1 warn, 0 fail)
```

Generated report excerpt:

```markdown
# Launch Readiness Report

## Score: 95/100

Pass: 9 | Warn: 1 | Fail: 0

## Suggested GitHub topics

open-source, github, developer-tools, cli, typescript, nodejs
```

## What it checks

- README presence and launch-critical sections
- License, contributing guide, code of conduct, security policy, and changelog
- GitHub Actions workflow
- Issue templates
- Package metadata and test script
- Topic suggestions from files, README text, and package keywords
- Release checklist and ethical launch note

## Safe scaffolding

`--fix` can scaffold practical launch-readiness files:

- `CONTRIBUTING.md`
- `SECURITY.md`
- `CODE_OF_CONDUCT.md`
- `CHANGELOG.md`
- `.github/ISSUE_TEMPLATE/bug_report.md`
- `.github/ISSUE_TEMPLATE/feature_request.md`
- `.github/workflows/oss-launch-lint.yml`

Safety rules:

- `--fix --dry-run` prints what would be created and writes nothing.
- `--fix` asks for confirmation before writing.
- `--fix --yes` skips the prompt for automation.
- Existing files are never overwritten unless `--force` is explicitly provided.

The workflow scaffold installs `oss-launch-lint` from the GitHub source repository so it remains truthful before npm publishing. After npm publishing is approved and completed, you can simplify it to `npx oss-launch-lint@latest`.

## GitHub Actions

`oss-launch-lint` can act as a launch-readiness quality gate:

```bash
node bin/oss-launch-lint . --fail-under 80 --github-step-summary --no-promotion
```

See [docs/github-actions.md](docs/github-actions.md) for the package-published `npx` workflow template and the current source-checkout alternative.

## CLI options

```text
oss-launch-lint [repoPath] [options]

Options:
  --output <file>             Markdown report path (default: launch-report.md)
                              Use - to print the Markdown report to stdout
  --promotion-output <file>   Promotion copy path (default: promotion-copy.md)
  --json                      Print documented JSON to stdout
  --no-promotion              Do not write promotion-copy.md
  --fix                       Scaffold missing launch-readiness files
  --dry-run                   With --fix, preview scaffold actions without writing files
  --yes                       With --fix, skip the interactive confirmation prompt
  --force                     With --fix, overwrite scaffold targets that already exist
  --fail-under <score>        Exit non-zero if the readiness score is below score
  --github-step-summary       Append the Markdown report to $GITHUB_STEP_SUMMARY
  --version, -v               Print version
  --help, -h                  Show help
```

## JSON shape

```ts
{
  score: number;
  summary: { pass: number; warn: number; fail: number };
  checks: Array<{
    id: string;
    title: string;
    status: "pass" | "warn" | "fail";
    message: string;
    recommendation?: string;
  }>;
  topics: string[];
  nextActions: string[];
}
```

## Demo and screenshots

For a quick text demo, run the fixture command above and open `tmp/demo-report.md`. For a visual demo, record the same command with your terminal recorder of choice and show the generated report scrolling below the command output.

## Development

```bash
npm install
npm test
npm run lint
npm run build
npm run format:check
```

## Roadmap

- Publish an npm-enabled `v0.1.1` so strangers can run `npx oss-launch-lint@latest .`.
- Expand `--fix` with language-specific templates and more before/after guidance.
- Package the GitHub Actions mode as the default quality-gate path after npm publish.
- Add more language-specific package metadata checks.
- Add a terminal GIF or screenshot asset for the README.

## Contributing

Issues and pull requests are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md), run the verification commands above, and keep promotion-related features ethical and non-spammy.

## Support

Open a GitHub issue with the repo type you audited, the command you ran, and the confusing output. Please do not share secrets, private tokens, or unreleased security details in public issues.

Maintained by [@sjh9714](https://github.com/sjh9714).

## License

MIT. See [LICENSE](LICENSE).
