# v0.1.1 release notes draft

Draft only. Do not create a GitHub release or publish to npm until explicitly approved.

Package dry-runs for `oss-launch-lint@0.1.1` pass. The real npm publish and GitHub release are still approval-gated.

## Highlights

- Re-audits after `--fix`, so generated reports and final CLI status now reflect the repaired repository state.
- Adds a Markdown fix summary with before/after score and scaffold counts.
- Uses weighted scoring so missing README/license/CI/test setup carries more weight than smaller launch polish gaps.
- Improves detection quality by checking README headings, GitHub Actions `run:` commands, and ignored/generated directories.
- Infers the repository URL for promotion copy from `package.json.repository` or `git remote origin`.
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
Adds safer launch-readiness scaffolding, post-fix report refreshes, weighted scoring, stronger README/CI detection, GitHub Actions documentation, and repository formatting. npm/npx availability should be announced only after the package is actually published.
```
