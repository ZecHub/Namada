import assert from "node:assert/strict";
import test from "node:test";

import { classifyProposalStatus } from "../node_modules/.cache/namada-tests/proposal-status.js";

test("maps documented Namada lifecycle statuses", () => {
  assert.deepEqual(classifyProposalStatus("pending"), {
    category: "pending",
    label: "Pending",
  });
  assert.deepEqual(classifyProposalStatus("on-going"), {
    category: "active",
    label: "Active",
  });
  assert.deepEqual(classifyProposalStatus("ended"), {
    category: "completed",
    label: "Completed",
  });
});

test("maps finalized indexer outcomes without marking rejection active", () => {
  assert.equal(classifyProposalStatus("executedPassed").category, "completed");
  assert.equal(classifyProposalStatus("executedRejected").category, "rejected");
  assert.equal(classifyProposalStatus("rejected").category, "rejected");
});

test("normalizes case and whitespace", () => {
  assert.equal(classifyProposalStatus("  PENDING ").category, "pending");
  assert.equal(classifyProposalStatus("ACTIVE").category, "active");
});

test("missing or unexpected statuses are explicitly unknown", () => {
  for (const status of [undefined, null, "", "queued", 1]) {
    assert.deepEqual(classifyProposalStatus(status), {
      category: "unknown",
      label: "Unknown",
    });
  }
});
