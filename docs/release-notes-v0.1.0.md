# v0.1.0 release notes

Initial public MVP of `oss-launch-lint`.

## Highlights

- Audit a repository for launch-readiness basics.
- Generate `launch-report.md` with score, checks, next actions, suggested topics, and release checklist.
- Generate ethical `promotion-copy.md` drafts for owned channels and allowed communities.
- Print documented JSON with `--json` for automation.
- Includes tests, CI, community files, and a demo fixture.

## Install

This release is prepared for source usage:

```bash
git clone https://github.com/sjh9714/oss-launch-lint.git
cd oss-launch-lint
npm install
npm run build
node bin/oss-launch-lint . --output launch-report.md
```

## Notes

- No GitHub token or paid API is required.
- The tool does not automate stars, posts, DMs, comments, or follows.
- External posting and package publishing should happen only after explicit maintainer approval.
