# Changelog

## 0.1.1 - Unreleased

### Added

- Markdown fix summaries that show score before fix, score after fix, and scaffold counts.
- Weighted readiness scoring so launch-critical gaps count more than smaller launch polish gaps.
- README heading-based section checks, CI `run:` command detection, and broader generated-directory ignores.

### Changed

- `--fix` now re-audits after scaffolding so reports, final score, step summaries, promotion copy, and `--fail-under` use post-fix results.
- Promotion copy now infers repository URLs from `package.json` metadata or `git remote origin` before falling back to a placeholder.
- `--fail-under` now validates scores from 0 to 100, and `--json --github-step-summary` is rejected as an unclear combination.

## 0.1.0 - 2026-05-24

### Added

- Initial TypeScript CLI.
- Repository launch-readiness checks for README, community files, CI, issue templates, package metadata, and test scripts.
- Markdown report generation.
- JSON output for automation.
- Ethical promotion copy generation.
- Demo fixture, tests, and GitHub Actions CI.
