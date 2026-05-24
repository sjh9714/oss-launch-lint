# Copy-paste prompt for Codex Goal mode

Use this as the `/goal` text. Replace placeholders in brackets before running.

```text
/goal
Build, polish, and ethically launch a public GitHub repository with a credible path to earning at least 16 legitimate stars within 7 days.

Repository context:
- GitHub owner/account: [YOUR_GITHUB_USERNAME_OR_ORG]
- Intended repo name: [REPO_NAME or let Codex propose 3 names]
- Default idea if no better idea exists: oss-launch-lint, a CLI that audits a repo for open-source launch readiness and generates a Markdown report with README gaps, community-file checks, CI/test checks, topic suggestions, release checklist, and ethical promotion copy.
- Target users: indie developers, OSS maintainers, AI-assisted developers, students, and hackathon teams.
- Tech preference: [TypeScript Node CLI / Python CLI / choose the fastest robust option]
- Allowed package publishing: [yes/no]
- Allowed external posting: [yes/no; require my approval before each post]
- Allowed channels: [my GitHub profile README, X/Twitter, LinkedIn, Mastodon/Bluesky, dev.to, Hacker News Show HN, relevant Discord/Slack/Reddit communities where self-promotion is allowed]

Hard rules:
- Never fabricate, buy, automate, exchange, or incentivize GitHub stars.
- Never use fake accounts, bots, automated starring/following, mass DMs, scraped contact lists, unsolicited GitHub issue/PR comments, or spam.
- Ask for explicit approval before logging in, posting externally, tagging anyone, creating a release, or publishing a package.
- Do not commit secrets or tokens.
- Do not claim adoption, benchmarks, or security properties that are not verified.

Definition of done:
1. Build the smallest useful MVP and make all tests pass.
2. Add README.md with a clear value proposition, install, quickstart, example output, screenshots or demo instructions, roadmap, support, and contribution info.
3. Add LICENSE, CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md, CHANGELOG.md, .gitignore, issue templates, and GitHub Actions CI.
4. Add docs/launch-plan.md, docs/promotion-copy.md, and docs/metrics-tracker.md.
5. Add repository description and 8-12 suggested GitHub topics in a final setup checklist.
6. Prepare v0.1.0 release notes and, if approved, create the release.
7. Prepare ethical promotion posts tailored to each allowed channel. If approved and browser/account access is available, post them and record URLs. If not, give exact manual posting instructions.
8. Update docs/metrics-tracker.md with a launch log and a 7-day follow-up plan for improving the repo based on traffic, stars, issues, and comments.
9. Produce a final report with files changed, commands run, verification results, promotion actions completed, manual actions remaining, and realistic odds/blockers for reaching 16 stars.

Work method:
- First read AGENTS.md, PROJECT_BRIEF.md, LAUNCH_PLAN.md, PROMOTION_COPY.md, REPO_QUALITY_CHECKLIST.md, and METRICS_TRACKER.md if present.
- Start by making a short plan and then implement without waiting unless a required permission, credential, account login, or external post is needed.
- Prefer a polished, tiny, working tool over a broad unfinished one.
- Keep iterating until the definition of done is met or a blocker requires my decision.
```
