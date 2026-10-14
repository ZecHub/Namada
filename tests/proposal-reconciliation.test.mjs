import assert from "node:assert/strict";
import test from "node:test";

import { reconcileProposals } from "../node_modules/.cache/namada-tests/proposal-reconciliation.js";

const summaryProposal = {
  id: 23,
  Type: "Default",
  Author: "tnam-summary",
  Start_Epoch: "740",
  End_Epoch: "754",
  Activation_Epoch: "755",
};

const detailedProposal = {
  Id: 23,
  Type: "Default with Wasm",
  Author: "tnam-details",
  Start_Epoch: "740",
  End_Epoch: "754",
  Activation_Epoch: "755",
  Status: "ended",
  Content: { title: "A detailed proposal" },
};

function source(name, authority, epoch, proposals) {
  return {
    name,
    authority,
    snapshots: [{ Last_committed_epoch: epoch, Proposal: proposals }],
  };
}

test("returns one canonical record per proposal ID", () => {
  const result = reconcileProposals([
    source("summary", 1, 1283, [summaryProposal]),
    source("details", 2, 1503, [detailedProposal]),
  ]);

  assert.equal(result.proposals.length, 1);
  assert.equal(result.proposals[0].id, 23);
  assert.equal(result.proposals[0].Type, "Default with Wasm");
  assert.equal(result.proposals[0].Content.title, "A detailed proposal");
});

test("source ordering does not change reconciled output", () => {
  const summary = source("summary", 1, 1283, [summaryProposal]);
  const details = source("details", 2, 1503, [detailedProposal]);

  const forward = reconcileProposals([summary, details]);
  const reversed = reconcileProposals([details, summary]);

  assert.deepEqual(reversed, forward);
});

test("an incomplete authoritative record does not erase useful metadata", () => {
  const result = reconcileProposals([
    source("summary", 1, 1283, [
      { ...summaryProposal, Result: "9 yay | 1 nay" },
    ]),
    source("details", 2, 1503, [{ Id: 23, Status: "ended" }]),
  ]);

  assert.equal(result.proposals[0].Status, "ended");
  assert.equal(result.proposals[0].Author, "tnam-summary");
  assert.equal(result.proposals[0].Result, "9 yay | 1 nay");
});

test("newer snapshots win within the same source authority", () => {
  const result = reconcileProposals([
    source("details-old", 2, 1500, [{ ...detailedProposal, Status: "pending" }]),
    source("details-new", 2, 1503, [{ ...detailedProposal, Status: "ended" }]),
  ]);

  assert.equal(result.proposals[0].Status, "ended");
  assert.equal(result.provenance[23].Status.epoch, 1503);
});

test("reports contradictory populated fields and their selected value", () => {
  const result = reconcileProposals([
    source("summary", 1, 1283, [summaryProposal]),
    source("details", 2, 1503, [detailedProposal]),
  ]);
  const authorConflict = result.conflicts.find(({ field }) => field === "Author");

  assert.equal(authorConflict.chosen, "tnam-details");
  assert.deepEqual(
    authorConflict.values.map(({ source }) => source).sort(),
    ["details", "summary"],
  );
});

test("keeps proposals that only exist in one dataset", () => {
  const result = reconcileProposals([
    source("summary", 1, 1283, [summaryProposal]),
    source("details", 2, 1503, [{ ...detailedProposal, Id: 24 }]),
  ]);

  assert.deepEqual(
    result.proposals.map(({ id }) => id),
    [24, 23],
  );
});
