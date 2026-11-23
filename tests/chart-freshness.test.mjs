import assert from "node:assert/strict";
import test from "node:test";
import {
  commitUrlForChartTab,
  latestCommitDate,
} from "../node_modules/.cache/namada-tests/chart-freshness.js";

const commits = (path) =>
  `https://api.github.com/repos/ZecHub/Namada/commits?path=${path}&per_page=1`;

test("each chart tab dates its own data file", () => {
  const supply = commits("public/data/namada_supply.json");
  // NamadaChart passes the lower-cased tab label.
  assert.equal(commitUrlForChartTab("total supply"), supply);
  assert.equal(commitUrlForChartTab("shielded supply"), supply);
  assert.equal(commitUrlForChartTab("transparent supply"), supply);
  assert.equal(
    commitUrlForChartTab("rewards"),
    commits("public/data/namada_rewards_rate.json"),
  );
  // The Proposals chart reads propAddressesCounts.json, not the supply file.
  assert.equal(
    commitUrlForChartTab("proposals"),
    commits("public/data/proposals/propAddressesCounts.json"),
  );
});

test("tab lookup ignores case and surrounding spaces", () => {
  assert.equal(commitUrlForChartTab(" Proposals "), commitUrlForChartTab("proposals"));
  assert.equal(commitUrlForChartTab("Shielded Supply"), commitUrlForChartTab("shielded supply"));
});

test("an unknown tab gets no date instead of another file's date", () => {
  assert.equal(commitUrlForChartTab("validators"), null);
  assert.equal(commitUrlForChartTab(""), null);
});

test("reads the newest committer date", () => {
  const date = latestCommitDate([
    { commit: { committer: { date: "2026-10-14T23:20:27Z" } } },
    { commit: { committer: { date: "2026-10-01T00:00:00Z" } } },
  ]);
  assert.equal(date?.toISOString(), "2026-10-14T23:20:27.000Z");
});

test("no date for empty, rate-limited or malformed responses", () => {
  assert.equal(latestCommitDate([]), null);
  assert.equal(latestCommitDate(null), null);
  // GitHub's rate-limit body is an object, not an array.
  assert.equal(latestCommitDate({ message: "API rate limit exceeded" }), null);
  assert.equal(latestCommitDate([{ commit: {} }]), null);
  assert.equal(latestCommitDate([{ commit: { committer: { date: "N/A" } } }]), null);
});
