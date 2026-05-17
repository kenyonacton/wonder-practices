import test from "node:test";
import assert from "node:assert/strict";

import {
  CATEGORIES,
  initialState,
  reduce,
  panelToShow,
} from "../src/assets/js/mountain-scape.js";

test("CATEGORIES lists the four valid flags in DOM back-to-front order", () => {
  assert.deepEqual(CATEGORIES, ["quiet", "active", "body-intense", "tender"]);
});

test("initial state has no selection", () => {
  assert.equal(initialState.selected, null);
});

test("selecting from no selection sets the category", () => {
  const next = reduce(initialState, { type: "SELECT", category: "quiet" });
  assert.equal(next.selected, "quiet");
});

test("selecting a different category switches the selection", () => {
  const next = reduce({ selected: "quiet" }, { type: "SELECT", category: "active" });
  assert.equal(next.selected, "active");
});

test("re-selecting the same category returns to no selection", () => {
  const next = reduce({ selected: "quiet" }, { type: "SELECT", category: "quiet" });
  assert.equal(next.selected, null);
});

test("selecting an unknown category leaves state unchanged", () => {
  const state = { selected: "quiet" };
  const next = reduce(state, { type: "SELECT", category: "not-a-flag" });
  assert.deepEqual(next, state);
});

test("an unknown action type leaves state unchanged", () => {
  const state = { selected: "tender" };
  const next = reduce(state, { type: "WHATEVER" });
  assert.deepEqual(next, state);
});

test("panelToShow returns 'all' when nothing is selected", () => {
  assert.equal(panelToShow({ selected: null }), "all");
});

test("panelToShow returns the selected category when one is chosen", () => {
  assert.equal(panelToShow({ selected: "body-intense" }), "body-intense");
});

test("the reducer does not mutate the input state", () => {
  const state = { selected: "quiet" };
  reduce(state, { type: "SELECT", category: "active" });
  assert.equal(state.selected, "quiet");
});
