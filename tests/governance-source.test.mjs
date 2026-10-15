import assert from "node:assert/strict";
import test from "node:test";

import {
  loadGovernanceData,
  LOCAL_GOVERNANCE_UPDATED_URL,
  NAMADA_INDEXER_BASE,
} from "../node_modules/.cache/namada-tests/governance-source.js";

function response(body, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => body,
  };
}

test("loads every live proposal page and uses the live chain epoch", async () => {
  const calls = [];
  const fetcher = async (url) => {
    calls.push(String(url));
    if (String(url).endsWith("/chain/epoch/latest")) {
      return response({ epoch: "2665" });
    }
    if (String(url).endsWith("page=1")) {
      return response({
        results: [
          {
            id: 42,
            content: JSON.stringify({ title: "Proposal 42" }),
            type: "default",
            author: "tnam-author",
            startEpoch: 1827,
            endEpoch: 1867,
            activationEpoch: 1868,
            status: "executedRejected",
          },
        ],
        pagination: { page: 1, totalPages: 2 },
      });
    }
    if (String(url).endsWith("page=2")) {
      return response({
        results: [
          {
            id: 41,
            content: JSON.stringify({ title: "Proposal 41" }),
            type: "defaultWithWasm",
            startEpoch: 1508,
            endEpoch: 1520,
            activationEpoch: 1521,
            status: "executedPassed",
          },
        ],
        pagination: { page: 2, totalPages: 2 },
      });
    }
    throw new Error("Unexpected URL " + url);
  };

  const result = await loadGovernanceData(fetcher);

  assert.equal(result.source, "live");
  assert.equal(result.sourceLabel, "Live Namada indexer");
  assert.equal(result.epoch, 2665);
  assert.deepEqual(result.proposals.map(({ id }) => id), [42, 41]);
  assert.equal(result.proposals[0].Content.title, "Proposal 42");
  assert.equal(result.proposals[0].End_Epoch, "1867");
  assert.ok(calls.includes(`${NAMADA_INDEXER_BASE}/gov/proposal?page=2`));
});

test("falls back to an explicitly historical snapshot when live data fails", async () => {
  const fetcher = async (url) => {
    const value = String(url);
    if (value.startsWith(NAMADA_INDEXER_BASE)) {
      return response({}, false, 503);
    }
    if (value === "/data/props.json") {
      return response([
        {
          Last_committed_epoch: 1503,
          Proposal: [{ id: 40, Type: "Default" }],
        },
      ]);
    }
    if (value === "/data/proposals/propsDetails.json") {
      return response([
        {
          Last_committed_epoch: 1503,
          Proposal: [
            {
              Id: 42,
              Type: "Default",
              Content: { title: "Historical proposal" },
            },
          ],
        },
      ]);
    }
    if (value === LOCAL_GOVERNANCE_UPDATED_URL) {
      return response([
        {
          commit: {
            committer: { date: "2026-10-14T23:02:35Z" },
          },
        },
      ]);
    }
    throw new Error("Unexpected URL " + url);
  };

  const result = await loadGovernanceData(fetcher);

  assert.equal(result.source, "snapshot");
  assert.equal(
    result.sourceLabel,
    "Historical snapshot · updated 2026-10-14 · live indexer unavailable",
  );
  assert.equal(result.epoch, 1503);
  assert.deepEqual(result.proposals.map(({ id }) => id), [42, 40]);
});

test("a reachable live source always wins over an older local snapshot", async () => {
  let localRequested = false;
  const fetcher = async (url) => {
    const value = String(url);
    if (value.endsWith("/chain/epoch/latest")) {
      return response({ epoch: "2700" });
    }
    if (value.endsWith("page=1")) {
      return response({
        results: [{ id: 43, type: "default", status: "pending" }],
        pagination: { page: 1, totalPages: 1 },
      });
    }
    if (value.startsWith("/data/")) {
      localRequested = true;
      return response([]);
    }
    throw new Error("Unexpected URL " + url);
  };

  const result = await loadGovernanceData(fetcher);

  assert.equal(result.source, "live");
  assert.equal(result.epoch, 2700);
  assert.deepEqual(result.proposals.map(({ id }) => id), [43]);
  assert.equal(localRequested, false);
});
