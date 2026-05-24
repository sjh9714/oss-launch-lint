# Ethical 7-day launch plan

## Principle

The goal is to ship a useful maintainer tool, put it in front of the right people, ask for feedback, and make it easy for people to star only if they find it useful.

## Day 0 - Build the shareable MVP

- Run `npm test`, `npm run lint`, and `npm run build`.
- Run the CLI against this repo and the demo fixture.
- Confirm README install, quickstart, example output, roadmap, support, and contribution sections.
- Confirm community files, issue templates, changelog, and CI workflow exist.

## Day 1 - Polish the repository page

- Set repository description: `Audit whether your GitHub repo is ready to share: README gaps, community files, CI checks, topics, checklist, and launch copy.`
- Add topics: `open-source`, `cli`, `github`, `maintainer-tools`, `developer-tools`, `readme`, `ci`, `launch`, `typescript`, `nodejs`, `docs`, `productivity`.
- Pin the repo on the owner profile if it is useful to profile visitors.
- Create v0.1.0 release from `docs/release-notes-v0.1.0.md` after approval.

## Day 2 - Soft launch

- Share privately with 3-5 developers who maintain or publish small repos.
- Ask what check is missing or noisy.
- Fix the clearest issue before wider posting.

## Day 3 - Public launch wave 1

- Post to one owned social account.
- Publish a short blog/dev.to post if the user wants a longer explanation.
- Record post URLs and baseline metrics in `docs/metrics-tracker.md`.

## Day 4 - Community launch wave 2

- Post only in communities where project feedback posts are allowed.
- Tailor the message to the community.
- Ask for feedback and use cases rather than stars.

## Day 5 - Iterate

- Fix reported bugs.
- Add one high-signal improvement.
- Update README if repeated questions appear.

## Day 6 - Follow-up

- Share a meaningful update only if something changed.
- Example: added JSON output, improved README checks, or shipped a GitHub Action example.

## Day 7 - Measure

- Record stars, visitors, clones, referrers, comments, issues, and PRs.
- Identify the highest-signal channel.
- Decide whether to keep investing, write a technical deep dive, or pivot the checks.

## Realistic 16-star path

- 5-8 from warm developers who inspect the repo.
- 3-5 from one relevant community post.
- 3-5 from social or article visibility.
- 1-3 from GitHub discovery, profile pinning, or follow-up improvements.

This is not guaranteed. Stars are an outcome metric, not something to manipulate.
