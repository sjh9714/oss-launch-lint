# Repository setup checklist

After creating the GitHub repository, apply these settings manually.

## Description

```text
Audit whether your GitHub repo is ready to share: README gaps, community files, CI checks, topics, checklist, and launch copy.
```

## Topics

```text
open-source, cli, github, maintainer-tools, developer-tools, readme, ci, launch, typescript, nodejs, docs, productivity
```

## Before release

- [ ] Confirm the repository URL is `https://github.com/sjh9714/oss-launch-lint`.
- [ ] Confirm CI passes on GitHub.
- [ ] Confirm `npm test`, `npm run lint`, and `npm run build` pass locally.
- [ ] Create a v0.1.0 tag/release only after approval.
- [ ] Do not publish to npm until package ownership and name are confirmed.

## Badges prepared for README after GitHub CI exists

```md
[![CI](https://github.com/sjh9714/oss-launch-lint/actions/workflows/ci.yml/badge.svg)](https://github.com/sjh9714/oss-launch-lint/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
```

## Manual GitHub repo commands

Run only after approving public repo creation:

```bash
gh repo create oss-launch-lint \
  --public \
  --source=. \
  --remote=origin \
  --push \
  --description "Audit whether a GitHub repo is ready for an ethical open-source launch."

gh repo edit sjh9714/oss-launch-lint \
  --description "Audit whether your GitHub repo is ready to share: README gaps, community files, CI checks, topics, checklist, and launch copy." \
  --homepage "https://github.com/sjh9714/oss-launch-lint" \
  --enable-issues=true \
  --enable-wiki=false \
  --add-topic open-source \
  --add-topic cli \
  --add-topic github \
  --add-topic maintainer-tools \
  --add-topic developer-tools \
  --add-topic readme \
  --add-topic ci \
  --add-topic launch \
  --add-topic typescript \
  --add-topic nodejs \
  --add-topic docs \
  --add-topic productivity
```

## Manual v0.1.0 release commands

Run only after approving release creation and confirming GitHub CI passes:

```bash
git tag -a v0.1.0 -m "v0.1.0"
git push origin v0.1.0

gh release create v0.1.0 \
  --title "oss-launch-lint v0.1.0" \
  --notes-file docs/release-notes-v0.1.0.md
```

## Manual posting

- [ ] Use `docs/promotion-copy.md` as the source.
- [ ] Tailor each post to the channel.
- [ ] Ask for feedback first.
- [ ] Ask for feedback without pressuring people for engagement.
- [ ] Record URLs and metrics in `docs/metrics-tracker.md`.
