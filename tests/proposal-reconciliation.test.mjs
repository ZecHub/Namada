import assert from "node:assert/strict";
import test from "node:test";

import {
  buildLiveGovernanceSnapshot,
  fetchCurrentGovernance,
  normalizeIndexerProposal,
  reconcileProposals,
} from "../node_modules/.cache/namada-tests/proposal-reconciliation.js";

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

test("normalizes current indexer proposals into the dashboard shape", () => {
  const proposal = normalizeIndexerProposal({
    id: 42,
    content: JSON.stringify({
      title: "Signalling - Knowable is leaving Namada",
      "discussions-to": "https://forum.namada.net/t/example",
    }),
    type: "default",
    author: "tnam-author",
    startEpoch: 1827,
    endEpoch: 1867,
    activationEpoch: 1868,
    status: "executedRejected",
  });

  assert.equal(proposal.id, 42);
  assert.equal(proposal.Type, "default");
  assert.equal(proposal.Start_Epoch, "1827");
  assert.equal(proposal.Content.title, "Signalling - Knowable is leaving Namada");
});

test("builds a current snapshot only when every indexer page is present", () => {
  const current = buildLiveGovernanceSnapshot(
    { epoch: "2665" },
    [
      {
        results: [
          { id: 2, type: "default", startEpoch: 20 },
          { id: 1, type: "default", startEpoch: 10 },
        ],
        pagination: { page: 1, totalPages: 2, totalItems: 3 },
      },
      {
        results: [{ id: 0, type: "default", startEpoch: 1 }],
        pagination: { page: 2, totalPages: 2, totalItems: 3 },
      },
    ],
  );

  assert.equal(current.snapshot.Last_committed_epoch, 2665);
  assert.equal(current.latestProposalId, 2);
  assert.equal(current.totalItems, 3);
  assert.deepEqual(
    current.snapshot.Proposal.map(({ id }) => id),
    [2, 1, 0],
  );

  assert.throws(
    () =>
      buildLiveGovernanceSnapshot(
        { epoch: "2665" },
        [
          {
            results: [{ id: 2 }],
            pagination: { page: 1, totalPages: 2, totalItems: 3 },
          },
        ],
      ),
    /pagination is incomplete/,
  );
});

test("fetches every proposal page and the live epoch from the Namada indexer", async () => {
  const calls = [];
  const payloads = new Map([
    [
      "https://indexer.test/api/v1/chain/epoch/latest",
      { epoch: "2665" },
    ],
    [
      "https://indexer.test/api/v1/gov/proposal",
      {
        results: [{ id: 2, content: "{\"title\":\"Latest\"}" }, { id: 1 }],
        pagination: { page: 1, totalPages: 2, totalItems: 3 },
      },
    ],
    [
      "https://indexer.test/api/v1/gov/proposal?page=2",
      {
        results: [{ id: 0 }],
        pagination: { page: 2, totalPages: 2, totalItems: 3 },
      },
    ],
  ]);

  const fetcher = async (url) => {
    calls.push(String(url));
    const payload = payloads.get(String(url));
    return {
      ok: Boolean(payload),
      status: payload ? 200 : 404,
      async json() {
        return payload;
      },
    };
  };

  const current = await fetchCurrentGovernance(
    fetcher,
    "https://indexer.test",
  );

  assert.deepEqual(calls.sort(), [...payloads.keys()].sort());
  assert.equal(current.snapshot.Last_committed_epoch, 2665);
  assert.equal(current.latestProposalId, 2);
  assert.equal(current.snapshot.Proposal[0].Content.title, "Latest");
});
