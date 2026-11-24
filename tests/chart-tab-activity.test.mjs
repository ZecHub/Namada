import assert from "node:assert/strict";
import test from "node:test";
import { isChartTabActive } from "../node_modules/.cache/namada-tests/chart-tab-activity.js";

test("outside chart tabs, panels remain active", () => {
  assert.equal(isChartTabActive(null), true);
});

test("inside chart tabs, only the selected panel is active", () => {
  assert.equal(isChartTabActive(true), true);
  assert.equal(isChartTabActive(false), false);
});
