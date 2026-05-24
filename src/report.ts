import type { AuditResult, PublicAuditJson } from "./types.js";

export function renderMarkdownReport(result: AuditResult): string {
  const checks = result.checks
    .map((check) => {
      const recommendation = check.recommendation ? `\n  - Recommendation: ${check.recommendation}` : "";
      return `- ${statusIcon(check.status)} **${check.title}** (${check.status}): ${check.message}${recommendation}`;
    })
    .join("\n");

  const nextActions = result.nextActions.map((action) => `- [ ] ${action}`).join("\n");

  return [
    "# Launch Readiness Report",
    "",
    `Generated: ${result.generatedAt}`,
    `Repository: \`${result.repoPath}\``,
    "",
    `## Score: ${result.score}/100`,
    "",
    `Pass: ${result.summary.pass} | Warn: ${result.summary.warn} | Fail: ${result.summary.fail}`,
    "",
    "## Checks",
    "",
    checks,
    "",
    "## Suggested GitHub topics",
    "",
    result.topics.length > 0 ? result.topics.join(", ") : "No topics suggested yet.",
    "",
    "## Next actions",
    "",
    nextActions,
    "",
    "## Release checklist",
    "",
    "- [ ] Confirm README install and quickstart commands from a clean checkout.",
    "- [ ] Confirm license, security policy, and contribution expectations are accurate.",
    "- [ ] Create v0.1.0 release notes from the changelog.",
    "- [ ] Add the repository description and topics in GitHub settings.",
    "- [ ] Share only in owned channels or communities where project feedback posts are allowed.",
    "",
    "## Ethical launch note",
    "",
    "Ask for feedback first. A secondary line such as \"Star it if useful\" is acceptable, but do not buy, automate, exchange, or incentivize stars.",
    ""
  ].join("\n");
}

export function renderJson(result: AuditResult): string {
  const publicResult: PublicAuditJson = {
    score: result.score,
    summary: result.summary,
    checks: result.checks,
    topics: result.topics,
    nextActions: result.nextActions
  };

  return `${JSON.stringify(publicResult, null, 2)}\n`;
}

function statusIcon(status: AuditResult["checks"][number]["status"]): string {
  if (status === "pass") {
    return "[pass]";
  }

  if (status === "warn") {
    return "[warn]";
  }

  return "[fail]";
}
