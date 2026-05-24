# AGENTS.md — contributor agent instructions

This file gives coding-agent guidance for contributors working on this repository.

## Mission

Maintain `oss-launch-lint` as a small, practical CLI that helps maintainers check whether a GitHub repository is ready to share publicly.

The tool should stay useful, truthful, and non-spammy. It should help users improve README clarity, install instructions, community files, CI, package metadata, release preparation, and ethical launch copy.

## Hard rules

- Do not add features that automate GitHub stars, follows, posts, DMs, issue comments, PR comments, or community spam.
- Do not encourage fake accounts, paid engagement, reciprocal stars, giveaways for stars, or scraped outreach.
- Do not misrepresent adoption, maturity, security guarantees, benchmarks, license status, or authorship.
- Do not commit secrets, tokens, cookies, private data, or local machine paths.
- Keep all README install instructions truthful and reproducible.
- Ask for maintainer approval before publishing packages, creating releases, or posting externally.

## Quality bar

- A new user should understand the project in 20 seconds.
- A new user should be able to run the first useful command within 2 minutes.
- Prefer a tiny, complete, reliable MVP over a broad unfinished one.
- Add tests for core audit, report, CLI, and promotion-copy behavior.
- Keep generated promotion copy feedback-oriented and community-rule-aware.

## Verification

Before proposing public changes, run:

```bash
npm test
npm run lint
npm run build
npm run smoke
```

Also check:

- README install path is accurate.
- Package metadata is truthful.
- Generated reports do not claim unsupported capabilities.
- Promotion copy asks for feedback first and does not pressure people for engagement.
