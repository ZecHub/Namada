import assert from "node:assert/strict";
import test from "node:test";

import {
  fetchJson,
  isEmptyResult,
  sourceFailure,
  sourceSuccess,
} from "../node_modules/.cache/namada-tests/source-loader.js";

const isRows = (value) => Array.isArray(value);

test("keeps an empty array distinct from a failed request", async () => {
  globalThis.fetch = async () => new Response("[]", { status: 200 });
  const rows = await fetchJson("/rows", new AbortController().signal, isRows);
  assert.deepEqual(rows, []);
  assert.equal(sourceSuccess(rows).status, "empty");
  assert.equal(isEmptyResult([{ Last_committed_epoch: 1, Proposal: [] }]), true);
  assert.equal(isEmptyResult([{ Last_committed_epoch: 1, Proposal: [{ id: 1 }] }]), false);
});

test("rejects non-success HTTP responses", async () => {
  globalThis.fetch = async () => new Response("unavailable", { status: 503 });
  await assert.rejects(
    fetchJson("/rows", new AbortController().signal, isRows),
    /Request failed \(503\)/,
  );
});

test("rejects malformed JSON and unexpected payload shapes", async () => {
  globalThis.fetch = async () => new Response("not-json", { status: 200 });
  await assert.rejects(
    fetchJson("/rows", new AbortController().signal, isRows),
    /not valid JSON/,
  );
  globalThis.fetch = async () => new Response('{"rows":[]}', { status: 200 });
  await assert.rejects(
    fetchJson("/rows", new AbortController().signal, isRows),
    /unexpected shape/,
  );
});

test("retains successful data as stale when a refresh fails", () => {
  const previous = { ...sourceSuccess([{ id: 1 }]), updatedAt: 10 };
  const next = sourceFailure(previous, new Error("offline"));
  assert.equal(next.status, "stale");
  assert.deepEqual(next.data, [{ id: 1 }]);
  assert.equal(next.error, "offline");
});

