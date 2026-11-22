import assert from "node:assert/strict";
import test from "node:test";
import { formatSupplyAmount } from "../node_modules/.cache/namada-tests/supply-format.js";

test("formats non-Namada chart values in actual token units", () => {
  assert.equal(formatSupplyAmount(238.607448, "ATOM"), "238.6M");
  assert.equal(formatSupplyAmount(5_000, "ATOM"), "5B");
});

test("keeps Namada chart values in raw units", () => {
  assert.equal(formatSupplyAmount(1_148_000_000, "Namada"), "1.1B");
  assert.equal(formatSupplyAmount(1_234, "Namada"), "1.2K");
});

test("handles non-finite chart values", () => {
  assert.equal(formatSupplyAmount(Number.NaN, "ATOM"), "—");
  assert.equal(formatSupplyAmount(Number.POSITIVE_INFINITY, "Namada"), "—");
});
