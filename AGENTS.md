# AGENTS.md — Codex working instructions

## Mission
Build, polish, and ethically launch a public GitHub repository with a credible path to earning at least 16 legitimate GitHub stars within 7 days.

Stars must come from real users who find the project useful. Do not fabricate, buy, automate, exchange, or incentivize stars. Do not spam GitHub, social networks, forums, issues, PRs, DMs, or comments.

## Preferred default project idea
Unless the user provides a different idea, build **oss-launch-lint**: a small CLI that audits an open-source repo for launch-readiness and generates a Markdown report with:

- README quality gaps
- license / contribution / security file checks
- CI and test command checks
- suggested GitHub topics
- release checklist
- ethical promotion copy templates
- next actions to make the repo easier to understand, install, and share

Position it as a useful tool for maintainers, not as a star-manipulation tool.

## Definition of done
The task is complete only when all of these are true, or a blocker is reported clearly:

1. The repository has working code, tests, and passing local verification.
2. The repository has a clear README with a one-sentence value proposition, install instructions, quickstart, example output, screenshots or demo instructions, roadmap, support instructions, and contribution instructions.
3. The repository includes at least: `LICENSE`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `CHANGELOG.md`, `.gitignore`, issue templates, and a GitHub Actions CI workflow.
4. The repository description, topics, badges, and release notes are prepared.
5. A first release tag is prepared or created if permitted.
6. `docs/launch-plan.md`, `docs/promotion-copy.md`, and `docs/metrics-tracker.md` exist.
7. Promotion drafts are ready for the user’s own accounts and for communities where posting is allowed by that community’s rules.
8. If browser/account access and explicit user approval are available, perform the approved posts and record URLs in `docs/metrics-tracker.md`. If posting is not possible, provide exact manual posting instructions and copy.
9. The final report includes what was built, verification results, promotion actions taken, remaining manual actions, and realistic expectations for reaching 16 stars.

## Hard safety and ethics rules
- Do not ask anyone to star unless the wording is natural and secondary, such as “Star it if useful.”
- Do not use automated starring, fake accounts, paid stars, reciprocal star exchanges, giveaways, airdrops, bots, scraped contact lists, mass DMs, or unsolicited bulk comments.
- Do not post promotional content in other people’s GitHub issues, PRs, or discussions unless the project is directly relevant and the community rules allow it.
- Do not misrepresent the project’s maturity, benchmarks, license, authorship, security properties, or user adoption.
- Never commit secrets, access tokens, cookies, personal data, or API keys.
- Ask for explicit approval before installing major dependencies, logging in, posting externally, tagging people, or publishing packages.

## Quality bar
- A new user should understand the project in 20 seconds and run the first useful command within 2 minutes.
- Prefer a tiny, complete, reliable MVP over a broad unfinished project.
- Prefer boring, maintainable implementation choices.
- Every public claim in README should be true and reproducible.
- Add tests for core behavior.
- Include meaningful examples rather than vague marketing copy.
- Keep the tool useful even if it never receives stars.

## Work loop
1. Read this file, `README.md`, `docs/launch-plan.md`, `docs/promotion-copy.md`, `docs/metrics-tracker.md`, and any existing repository files.
2. Propose a short plan and select the smallest shippable MVP.
3. Implement in focused increments.
4. Run tests, linting, and any relevant build commands.
5. Inspect README and onboarding from a new user’s perspective.
6. Prepare release and promotion assets.
7. If permitted, launch ethically and update metrics.
8. Summarize results and next steps.

## Review guidelines
When reviewing your own changes, check:

- Does the README answer: what it does, why it is useful, how to start, where to get help, and who maintains it?
- Can a user copy-paste a command and see a useful result?
- Are installation commands accurate?
- Do tests pass from a clean checkout?
- Are promotion drafts useful, non-spammy, and tailored to each channel?
- Is there any hidden dependency on local state or secrets?
