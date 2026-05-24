export interface PromotionInput {
  repoName: string;
  repoUrl: string;
  topics: string[];
}

export function renderPromotionCopy(input: PromotionInput): string {
  const repoName = input.repoName || "oss-launch-lint";
  const repoUrl = input.repoUrl || "Add your repository URL before posting.";
  const topics = input.topics.length > 0 ? input.topics.join(", ") : "open-source, cli, github";

  return [
    "# Ethical Promotion Copy",
    "",
    "Use only on accounts you own or in communities where project feedback posts are allowed. Tailor the wording before posting.",
    "",
    "## One-line value proposition",
    "",
    `${repoName} is a tiny CLI that checks whether a GitHub repo is ready to share and generates a practical launch-readiness report.`,
    "",
    "## GitHub repository description",
    "",
    "Audit whether your GitHub repo is ready to share: README gaps, community files, CI checks, topics, checklist, and launch copy.",
    "",
    "## Suggested GitHub topics",
    "",
    topics,
    "",
    "## X / Mastodon / Bluesky",
    "",
    `I made a tiny tool for people launching GitHub repos: ${repoName}.`,
    "",
    "It checks README gaps, missing community files, CI/test setup, topic suggestions, and release readiness.",
    "",
    `Feedback welcome from OSS maintainers: ${repoUrl}`,
    "",
    "## LinkedIn",
    "",
    `I shipped a small open-source tool: ${repoName}.`,
    "",
    "It audits a GitHub repository before launch and generates a practical report covering README clarity, community files, CI/test setup, topic suggestions, and release readiness.",
    "",
    "The motivation: useful repos often lose visitors in the first 20 seconds because the onboarding path is unclear.",
    "",
    `Feedback welcome, especially from maintainers and dev-tool builders: ${repoUrl}`,
    "",
    "## Hacker News",
    "",
    `Title: Show HN: ${repoName} - check whether your GitHub repo is ready to share`,
    "",
    `I built ${repoName}, a small CLI that audits a repo before you share it publicly.`,
    "",
    "It checks README clarity, missing community files, CI/test setup, topic suggestions, and generates a launch-readiness report. I made it because many small repos have useful code but unclear onboarding.",
    "",
    `Example output and install instructions are in the README: ${repoUrl}`,
    "",
    "I would appreciate feedback on which checks are useful or noisy.",
    "",
    "## Reddit / Discord / Slack",
    "",
    `Hi all - I built ${repoName}, a small tool for maintainers preparing a GitHub repo for launch.`,
    "",
    "It audits README gaps, missing community files, CI/test checks, topic suggestions, and a release checklist.",
    "",
    `I am looking for feedback from people who publish small OSS projects: ${repoUrl}`,
    "",
    "Only post this in communities where project feedback posts are allowed. If the rules are unclear, ask moderators first or do not post.",
    ""
  ].join("\n");
}
