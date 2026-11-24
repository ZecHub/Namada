import assert from "node:assert/strict";
import test from "node:test";
import { pollSequentially } from "../node_modules/.cache/namada-tests/polling.js";

const wait = (duration) => new Promise((resolve) => setTimeout(resolve, duration));

test("polling waits for each request before scheduling the next", async () => {
  let inFlight = 0;
  let maxInFlight = 0;
  let calls = 0;
  const stop = pollSequentially(async () => {
    calls += 1;
    inFlight += 1;
    maxInFlight = Math.max(maxInFlight, inFlight);
    await wait(8);
    inFlight -= 1;
  }, 1);

  await wait(28);
  stop();
  assert.ok(calls > 1);
  assert.equal(maxInFlight, 1);
});

test("stopping polling aborts the in-flight request", async () => {
  let observedSignal;
  let started;
  const didStart = new Promise((resolve) => { started = resolve; });
  const stop = pollSequentially((signal) => {
    observedSignal = signal;
    started();
    return new Promise((resolve) => signal.addEventListener("abort", resolve, { once: true }));
  }, 1000);

  await didStart;
  stop();
  assert.equal(observedSignal.aborted, true);
});
