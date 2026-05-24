import assert from "node:assert/strict";
import { test } from "node:test";

import { renderPromotionCopy } from "../src/promotion.js";

test("renders ethical channel-specific promotion copy", () => {
  const copy = renderPromotionCopy({
    repoName: "oss-launch-lint",
    repoUrl: "https://github.com/example/oss-launch-lint",
    topics: ["open-source", "cli", "github"]
  });

  assert.match(copy, /Feedback welcome/);
  assert.match(copy, /Show HN: oss-launch-lint/);
  assert.match(copy, /Star it if useful/);
  assert.doesNotMatch(copy, /guaranteed/i);
  assert.doesNotMatch(copy, /exchange stars/i);
});
