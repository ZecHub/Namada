import assert from "node:assert/strict";
import test from "node:test";
import {
  formatFractionAsPercent,
  parameterLabel,
} from "../node_modules/.cache/namada-tests/display-format.js";

test("shows validator commission strings as percentages", () => {
  assert.equal(formatFractionAsPercent("0.1"), "10%");
  assert.equal(formatFractionAsPercent("1"), "100%");
  assert.equal(formatFractionAsPercent("0.05"), "5%");
});

test("rounds away floating-point noise", () => {
  assert.equal(formatFractionAsPercent(0.07), "7%");
  assert.equal(formatFractionAsPercent(0.035), "3.5%");
  assert.equal(formatFractionAsPercent(0.0275), "2.75%");
  assert.equal(formatFractionAsPercent(0), "0%");
});

test("falls back for missing or non-numeric values", () => {
  assert.equal(formatFractionAsPercent(undefined), "—");
  assert.equal(formatFractionAsPercent(""), "—");
  assert.equal(formatFractionAsPercent("n/a"), "—");
  assert.equal(formatFractionAsPercent(null, "N/A"), "N/A");
});

test("fixes misspelled parameter keys and humanizes the rest", () => {
  assert.equal(parameterLabel("Pipline_length"), "Pipeline length");
  assert.equal(parameterLabel("Unbonding_lenth"), "Unbonding length");
  assert.equal(parameterLabel("Min_epoch_duration"), "Min epoch duration");
});
