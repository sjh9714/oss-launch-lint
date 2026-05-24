# oss-launch-lint

[![CI](https://github.com/sjh9714/oss-launch-lint/actions/workflows/ci.yml/badge.svg)](https://github.com/sjh9714/oss-launch-lint/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Audit whether your GitHub repo is ready to share.

`oss-launch-lint` is a tiny CLI for maintainers, indie developers, students, and AI-assisted builders who want a practical launch-readiness report before they publish or promote a repository.

## Why it is useful

Many useful repos lose visitors in the first 20 seconds because the README, license, CI status, or contribution path is unclear. This tool checks the boring-but-important launch details and generates concrete next actions plus ethical promotion copy.

## Installation

This repository is not published to npm yet. From a checkout:

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

## Quickstart

Audit the current repository and write launch assets:

```bash
node bin/oss-launch-lint . --output launch-report.md --promotion-output promotion-copy.md
```

Print JSON for automation:

```bash
node bin/oss-launch-lint . --json --no-promotion
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

## CLI options

```text
oss-launch-lint [repoPath] [options]

Options:
  --output <file>             Markdown report path (default: launch-report.md)
  --promotion-output <file>   Promotion copy path (default: promotion-copy.md)
  --json                      Print documented JSON to stdout
  --no-promotion              Do not write promotion-copy.md
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
```

## Roadmap

- Add `--fix` mode that creates missing community files after confirmation.
- Add a GitHub Actions example for running `oss-launch-lint` in another repo.
- Add more language-specific package metadata checks.
- Add a terminal GIF or screenshot asset for the README.

## Contributing

Issues and pull requests are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md), run the verification commands above, and keep promotion-related features ethical and non-spammy.

## Support

Open a GitHub issue with the repo type you audited, the command you ran, and the confusing output. Please do not share secrets, private tokens, or unreleased security details in public issues.

Maintained by [@sjh9714](https://github.com/sjh9714).

## License

MIT. See [LICENSE](LICENSE).
