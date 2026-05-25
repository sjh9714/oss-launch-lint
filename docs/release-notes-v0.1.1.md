# v0.1.1 release notes draft

Draft only. Do not create a GitHub release or publish to npm until explicitly approved.

## Highlights

- Adds repository formatting with Prettier and a `format:check` verification command.
- Improves the README first screen with a sharper value proposition, sample output, `--fix` examples, and CI usage.
- Adds safe `--fix` scaffolding for common launch-readiness files.
- Adds CI quality-gate options:
  - `--fail-under <score>`
  - `--github-step-summary`
  - `--output -`
- Adds GitHub Actions usage documentation.

## Install

Current source-checkout usage:

```bash
git clone https://github.com/sjh9714/oss-launch-lint.git
cd oss-launch-lint
npm install
npm run build
node bin/oss-launch-lint . --output launch-report.md --promotion-output promotion-copy.md
```

After npm publishing is approved and completed:

```bash
npx oss-launch-lint@latest .
```

## Suggested release note

```text
Adds safer launch-readiness scaffolding, CI quality-gate options, GitHub Actions documentation, and repository formatting. npm/npx availability should be announced only after the package is actually published.
```
