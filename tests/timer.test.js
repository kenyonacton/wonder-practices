import test from "node:test";
import assert from "node:assert/strict";

import {
  STATUS,
  initialState,
  reduce,
  getCurrentPhase,
  getTotalSecondsRemaining,
} from "../src/assets/js/timer.js";

const phases = [
  { name: "Inhale", seconds: 4 },
  { name: "Exhale", seconds: 6 },
];
const config = { phases, cycles: 12 };

test("initial state is idle with phase 0 and cycle 1", () => {
  assert.equal(initialState.status, STATUS.idle);
  assert.equal(initialState.phaseIndex, 0);
  assert.equal(initialState.cycleNumber, 1);
  assert.equal(initialState.timeRemaining, 0);
  assert.equal(initialState.elapsedTotal, 0);
});

test("START from idle sets running with first phase seconds", () => {
  const s = reduce(initialState, { type: "START" }, config);
  assert.equal(s.status, STATUS.running);
  assert.equal(s.phaseIndex, 0);
  assert.equal(s.cycleNumber, 1);
  assert.equal(s.timeRemaining, 4);
  assert.equal(s.elapsedTotal, 0);
});

test("START when already running is a no-op", () => {
  const running = reduce(initialState, { type: "START" }, config);
  const again = reduce(running, { type: "START" }, config);
  assert.deepEqual(again, running);
});

test("PAUSE during running sets paused, time preserved", () => {
  const running = reduce(initialState, { type: "START" }, config);
  const paused = reduce(running, { type: "PAUSE" }, config);
  assert.equal(paused.status, STATUS.paused);
  assert.equal(paused.timeRemaining, 4);
});

test("PAUSE when not running is a no-op", () => {
  assert.deepEqual(reduce(initialState, { type: "PAUSE" }, config), initialState);
});

test("RESUME from paused returns to running", () => {
  let s = reduce(initialState, { type: "START" }, config);
  s = reduce(s, { type: "PAUSE" }, config);
  s = reduce(s, { type: "RESUME" }, config);
  assert.equal(s.status, STATUS.running);
});

test("RESUME when not paused is a no-op", () => {
  assert.deepEqual(reduce(initialState, { type: "RESUME" }, config), initialState);
});

test("TICK decrements timeRemaining when above 1", () => {
  let s = reduce(initialState, { type: "START" }, config);
  s = reduce(s, { type: "TICK" }, config);
  assert.equal(s.timeRemaining, 3);
  assert.equal(s.phaseIndex, 0);
  assert.equal(s.elapsedTotal, 1);
});

test("TICK at timeRemaining=1 advances to next phase", () => {
  let s = { status: STATUS.running, phaseIndex: 0, cycleNumber: 1, timeRemaining: 1, elapsedTotal: 3 };
  s = reduce(s, { type: "TICK" }, config);
  assert.equal(s.phaseIndex, 1);
  assert.equal(s.timeRemaining, 6);
  assert.equal(s.elapsedTotal, 4);
});

test("TICK at end of last phase advances to next cycle, phase 0", () => {
  let s = { status: STATUS.running, phaseIndex: 1, cycleNumber: 1, timeRemaining: 1, elapsedTotal: 9 };
  s = reduce(s, { type: "TICK" }, config);
  assert.equal(s.phaseIndex, 0);
  assert.equal(s.cycleNumber, 2);
  assert.equal(s.timeRemaining, 4);
});

test("TICK at end of last phase of last cycle transitions to complete", () => {
  let s = { status: STATUS.running, phaseIndex: 1, cycleNumber: 12, timeRemaining: 1, elapsedTotal: 119 };
  s = reduce(s, { type: "TICK" }, config);
  assert.equal(s.status, STATUS.complete);
  assert.equal(s.timeRemaining, 0);
});

test("TICK when paused is a no-op", () => {
  const paused = { status: STATUS.paused, phaseIndex: 0, cycleNumber: 1, timeRemaining: 4, elapsedTotal: 0 };
  assert.deepEqual(reduce(paused, { type: "TICK" }, config), paused);
});

test("TICK when idle is a no-op", () => {
  assert.deepEqual(reduce(initialState, { type: "TICK" }, config), initialState);
});

test("SKIP advances to next phase", () => {
  let s = reduce(initialState, { type: "START" }, config);
  s = reduce(s, { type: "SKIP" }, config);
  assert.equal(s.phaseIndex, 1);
  assert.equal(s.timeRemaining, 6);
});

test("SKIP at last phase of last cycle completes", () => {
  let s = { status: STATUS.running, phaseIndex: 1, cycleNumber: 12, timeRemaining: 6, elapsedTotal: 114 };
  s = reduce(s, { type: "SKIP" }, config);
  assert.equal(s.status, STATUS.complete);
});

test("BACK goes to previous phase within the same cycle", () => {
  let s = { status: STATUS.running, phaseIndex: 1, cycleNumber: 2, timeRemaining: 3, elapsedTotal: 17 };
  s = reduce(s, { type: "BACK" }, config);
  assert.equal(s.phaseIndex, 0);
  assert.equal(s.cycleNumber, 2);
  assert.equal(s.timeRemaining, 4);
});

test("BACK at phase 0 of cycle 2 goes to last phase of cycle 1", () => {
  let s = { status: STATUS.running, phaseIndex: 0, cycleNumber: 2, timeRemaining: 4, elapsedTotal: 10 };
  s = reduce(s, { type: "BACK" }, config);
  assert.equal(s.phaseIndex, 1);
  assert.equal(s.cycleNumber, 1);
  assert.equal(s.timeRemaining, 6);
});

test("BACK at the very start resets the current phase timer", () => {
  let s = { status: STATUS.running, phaseIndex: 0, cycleNumber: 1, timeRemaining: 2, elapsedTotal: 2 };
  s = reduce(s, { type: "BACK" }, config);
  assert.equal(s.phaseIndex, 0);
  assert.equal(s.cycleNumber, 1);
  assert.equal(s.timeRemaining, 4);
});

test("RESET returns to initial state", () => {
  let s = reduce(initialState, { type: "START" }, config);
  s = reduce(s, { type: "TICK" }, config);
  s = reduce(s, { type: "RESET" }, config);
  assert.deepEqual(s, initialState);
});

test("unknown action leaves state unchanged", () => {
  const s = reduce(initialState, { type: "WHATEVER" }, config);
  assert.deepEqual(s, initialState);
});

test("getCurrentPhase returns the phase at phaseIndex", () => {
  const s = { status: STATUS.running, phaseIndex: 1, cycleNumber: 1, timeRemaining: 5, elapsedTotal: 5 };
  assert.equal(getCurrentPhase(s, config).name, "Exhale");
  assert.equal(getCurrentPhase(s, config).seconds, 6);
});

test("getTotalSecondsRemaining at start equals total duration", () => {
  const s = reduce(initialState, { type: "START" }, config);
  assert.equal(getTotalSecondsRemaining(s, config), 4 + 6 + 11 * (4 + 6));
});

test("getTotalSecondsRemaining mid-practice subtracts elapsed phases", () => {
  // Cycle 3, phase 1 (Exhale), 2 seconds remaining
  const s = { status: STATUS.running, phaseIndex: 1, cycleNumber: 3, timeRemaining: 2, elapsedTotal: 28 };
  // Remaining: 2s of this phase + 9 full cycles to go (10s each) = 2 + 90 = 92
  assert.equal(getTotalSecondsRemaining(s, config), 92);
});

test("getTotalSecondsRemaining is 0 when complete", () => {
  const s = { status: STATUS.complete, phaseIndex: 0, cycleNumber: 12, timeRemaining: 0, elapsedTotal: 120 };
  assert.equal(getTotalSecondsRemaining(s, config), 0);
});

test("reducer does not mutate the input state", () => {
  const start = reduce(initialState, { type: "START" }, config);
  const snapshot = { ...start };
  reduce(start, { type: "TICK" }, config);
  assert.deepEqual(start, snapshot);
});
