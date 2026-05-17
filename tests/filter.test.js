import test from "node:test";
import assert from "node:assert/strict";

import { filterPractices } from "../src/assets/js/filter.js";

test("returns all practices when no flags are hidden", () => {
  const all = [
    { slug: "a", accessibility_flag: "quiet" },
    { slug: "b", accessibility_flag: "active" },
    { slug: "c", accessibility_flag: "tender" },
  ];
  assert.equal(filterPractices(all, []).length, 3);
});

test("hides practices whose flag is in the hidden set", () => {
  const all = [
    { slug: "a", accessibility_flag: "quiet" },
    { slug: "b", accessibility_flag: "tender" },
  ];
  const visible = filterPractices(all, ["tender"]);
  assert.equal(visible.length, 1);
  assert.equal(visible[0].slug, "a");
});

test("treats null practices input as empty", () => {
  assert.deepEqual(filterPractices(null, ["tender"]), []);
});
