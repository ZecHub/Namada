import assert from "node:assert/strict";
import test from "node:test";

import { normalizeSupplyData } from "../node_modules/.cache/namada-tests/supply-normalization.js";

function row(date, nativeSupply, totalSupply, extras = []) {
  return {
    Date: date,
    Native_Supply_NAM: nativeSupply,
    Total_Supply: [
      {
        id: "Namada",
        totalSupply,
        shieldedSupply: "20",
        transparentSupply: "80",
      },
      ...extras,
    ],
  };
}

test("sorts valid snapshots chronologically and derives latest from the end", () => {
  const result = normalizeSupplyData([
    row("05/03/2025", "30", "300"),
    row("05/01/2025", "10", "100"),
    row("05/02/2025", "20", "200"),
  ]);
  assert.deepEqual(result.records.map((item) => item.Date), [
    "05/01/2025",
    "05/02/2025",
    "05/03/2025",
  ]);
  assert.equal(result.records.at(-1).Native_Supply_NAM, "30");
});

test("resolves duplicate dates deterministically and is input-order independent", () => {
  const lowerCompleteness = row("05/01/2025", "1", "10");
  const moreComplete = row("05/01/2025", "2", "20", [
    { id: "Atom", totalSupply: "5", shieldedSupply: "2", transparentSupply: "3" },
  ]);
  const later = row("05/02/2025", "3", "30");
  const forward = normalizeSupplyData([lowerCompleteness, moreComplete, later]);
  const reversed = normalizeSupplyData([later, moreComplete, lowerCompleteness]);
  assert.deepEqual(forward, reversed);
  assert.equal(forward.duplicateDatesResolved, 1);
  assert.equal(forward.records.length, 2);
  assert.equal(forward.records[0].Native_Supply_NAM, "2");

  const tiedA = row("05/03/2025", "10", "100");
  const tiedB = row("05/03/2025", "20", "200");
  const tiedResult = normalizeSupplyData([tiedB, tiedA]);
  assert.equal(tiedResult.records[0].Native_Supply_NAM, "10");
});

test("rejects malformed dates and critical numeric values", () => {
  const result = normalizeSupplyData([
    row("02/30/2025", "10", "100"),
    row("05/01/2025", "Infinity", "100"),
    row("05/02/2025", "-1", "100"),
    row("05/03/2025", "10", "NaN"),
    { Date: "05/04/2025", Native_Supply_NAM: "10", Total_Supply: [] },
  ]);
  assert.equal(result.records.length, 0);
  assert.equal(result.rejectedRecords, 5);
});

test("drops malformed asset values without fabricating zeroes", () => {
  const result = normalizeSupplyData([
    row("05/01/2025", "10", "100", [
      { id: "Penumbra", totalSupply: "", shieldedSupply: "0", transparentSupply: "0" },
    ]),
  ]);
  assert.equal(result.records.length, 1);
  assert.equal(result.rejectedAssets, 1);
  assert.deepEqual(result.records[0].Total_Supply.map((asset) => asset.id), ["Namada"]);
});

test("handles empty and malformed top-level datasets", () => {
  assert.deepEqual(normalizeSupplyData([]), {
    records: [],
    rejectedRecords: 0,
    rejectedAssets: 0,
    duplicateDatesResolved: 0,
  });
  assert.deepEqual(normalizeSupplyData(null), {
    records: [],
    rejectedRecords: 1,
    rejectedAssets: 0,
    duplicateDatesResolved: 0,
  });
});
