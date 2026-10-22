import assert from "node:assert/strict";
import test from "node:test";

import {
  getTimeRemaining,
  calculateEpochTarget,
} from "../node_modules/.cache/namada-tests/countdown.js";

test("getTimeRemaining calculates correct days, hours, minutes, seconds for future target", () => {
  const now = new Date("2026-10-15T12:00:00Z");
  // 2 days, 3 hours, 4 minutes, 5 seconds in future
  const target = new Date("2026-10-17T15:04:05Z");

  const remaining = getTimeRemaining(target, now);

  assert.equal(remaining.days, 2);
  assert.equal(remaining.hours, 3);
  assert.equal(remaining.mins, 4);
  assert.equal(remaining.secs, 5);
  assert.equal(remaining.isExpired, false);
});

test("getTimeRemaining returns isExpired: true and zeros when milestone has elapsed", () => {
  const now = new Date("2026-10-15T12:00:00Z");
  const pastTarget = new Date("2026-10-14T12:00:00Z");

  const remaining = getTimeRemaining(pastTarget, now);

  assert.equal(remaining.days, 0);
  assert.equal(remaining.hours, 0);
  assert.equal(remaining.mins, 0);
  assert.equal(remaining.secs, 0);
  assert.equal(remaining.isExpired, true);
});

test("getTimeRemaining safely handles invalid date strings", () => {
  const remaining = getTimeRemaining("invalid-date-string");

  assert.equal(remaining.days, 0);
  assert.equal(remaining.hours, 0);
  assert.equal(remaining.mins, 0);
  assert.equal(remaining.secs, 0);
  assert.equal(remaining.isExpired, true);
});

test("calculateEpochTarget returns a future epoch boundary aligned to interval", () => {
  const epochDurationSeconds = 21600; // 6 hours
  const currentTimeMs = 1700000000000;
  const targetDate = calculateEpochTarget(epochDurationSeconds, currentTimeMs);

  assert.ok(targetDate.getTime() >= currentTimeMs);
  assert.equal(targetDate.getTime() % (epochDurationSeconds * 1000), 0);
});
