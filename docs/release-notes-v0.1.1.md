# v0.1.1 release notes

Release notes for the npm-enabled `v0.1.1` release.

Package dry-runs for `oss-launch-lint@0.1.1` passed before publishing.

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

Run without installing:

```bash
npx oss-launch-lint@latest .
```

Or install globally:

```bash
npm install -g oss-launch-lint
oss-launch-lint .
```

## Suggested release note

```text
Adds npm/npx availability, safer launch-readiness scaffolding, post-fix report refreshes, weighted scoring, stronger README/CI detection, GitHub Actions documentation, and repository formatting.
```
