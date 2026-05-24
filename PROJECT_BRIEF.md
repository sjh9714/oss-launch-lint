# Project brief for Codex

## Goal
Create a small, polished open-source GitHub repository that has a realistic chance of earning 16+ legitimate stars after launch.

## Default project
**oss-launch-lint** — a CLI that audits a repo for open-source launch readiness and generates a practical Markdown report.

## Target users
- Indie developers launching small GitHub projects
- Open-source maintainers polishing a new repo
- AI-assisted developers using Codex/Copilot/Cursor who want a final quality pass before publishing
- Students or hackathon teams preparing project repositories

## User problem
Many small GitHub repos fail to get attention because visitors cannot quickly tell what the project does, how to install it, whether it works, or whether it is maintained. This tool gives maintainers a concrete checklist and generates launch-ready assets.

## Core value proposition
Run one command in a repo and get a launch-readiness report plus tailored next steps.

Example positioning:
> A tiny CLI that tells you whether your GitHub repo is ready to share — README gaps, missing community files, CI checks, topic suggestions, release checklist, and ethical promotion copy.

## MVP features
- Detect current repo root.
- Check for README, license, contribution guide, code of conduct, security policy, changelog, CI workflow, issue templates, and basic package metadata.
- Score launch readiness with clear, non-gimmicky categories.
- Generate `launch-report.md` with concrete fixes.
- Suggest GitHub topics based on language, files, and README content.
- Generate `promotion-copy.md` with ethical, channel-specific copy.
- Include `--json` output for automation.
- Include a demo fixture repo for tests.

## Nice-to-have features after MVP
- `--fix` mode to create missing community files from templates after user confirmation.
- GitHub Actions workflow example that runs the audit.
- README badge for “launch checked”.
- Browser screenshot or terminal GIF demo.

## Constraints
- Keep the MVP small and shippable.
- Use a language/ecosystem that supports simple installation and testing. TypeScript/Node is preferred if a simple `npx` flow is feasible; Python is acceptable if faster.
- Do not use paid APIs.
- Do not require GitHub tokens for the default audit.
- No star manipulation features.

## Success criteria
- A stranger can understand the repo in 20 seconds.
- A stranger can run the tool in 2 minutes.
- The repo has enough polish to be shared in public without embarrassment.
- Promotion copy asks for feedback, not artificial stars.
- The launch plan targets real users and communities.
