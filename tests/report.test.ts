import assert from "node:assert/strict";
import { test } from "node:test";

import { renderJson, renderMarkdownReport } from "../src/report.js";
import type { AuditResult } from "../src/types.js";

const result: AuditResult = {
  repoPath: "/tmp/demo",
  generatedAt: "2026-05-24T00:00:00.000Z",
  score: 82,
  summary: { pass: 8, warn: 2, fail: 1 },
  checks: [
    {
      id: "readme",
      title: "README",
      status: "pass",
      message: "README explains the project.",
      recommendation: "Keep the first screen concrete.",
    },
    {
      id: "license",
      title: "License",
      status: "fail",
      message: "LICENSE is missing.",
      recommendation: "Add an OSI-approved license.",
    },
  ],
  topics: ["open-source", "cli", "github"],
  nextActions: ["Add LICENSE before launch."],
};

test("renders a Markdown report with score, checks, topics, and release checklist", () => {
  const markdown = renderMarkdownReport(result);

  assert.match(markdown, /# Launch Readiness Report/);
  assert.match(markdown, /82\/100/);
  assert.match(markdown, /Add LICENSE before launch/);
  assert.match(markdown, /open-source, cli, github/);
  assert.match(markdown, /Release checklist/);
});

test("renders JSON matching the documented public shape", () => {
  const json = JSON.parse(renderJson(result));

  assert.deepEqual(Object.keys(json).sort(), [
    "checks",
    "nextActions",
    "score",
    "summary",
    "topics",
  ]);
  assert.equal(json.score, 82);
  assert.deepEqual(json.summary, { pass: 8, warn: 2, fail: 1 });
  assert.equal(json.checks[0].status, "pass");
});
