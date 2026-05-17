import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRACTICES_DIR = path.join(__dirname, "..", "src", "practices");
const VALID_FLAGS = new Set(["quiet", "active", "body-intense", "tender"]);

function parseFrontmatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const out = {};
  for (const line of match[1].split("\n")) {
    const kv = line.match(/^([\w-]+):\s*(.*)$/);
    if (kv) out[kv[1]] = kv[2].trim();
  }
  return out;
}

function listPractices() {
  if (!fs.existsSync(PRACTICES_DIR)) return [];
  return fs
    .readdirSync(PRACTICES_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => ({
      file: f,
      source: fs.readFileSync(path.join(PRACTICES_DIR, f), "utf8"),
    }));
}

test("every practice has a recognized accessibility_flag", () => {
  for (const { file, source } of listPractices()) {
    const fm = parseFrontmatter(source);
    assert.ok(fm, `${file} is missing YAML frontmatter`);
    assert.ok(
      VALID_FLAGS.has(fm.accessibility_flag),
      `${file} has invalid accessibility_flag: ${fm.accessibility_flag}`,
    );
  }
});

test("body-intense and tender practices carry a content_note", () => {
  for (const { file, source } of listPractices()) {
    const fm = parseFrontmatter(source);
    if (!fm) continue;
    if (fm.accessibility_flag === "body-intense" || fm.accessibility_flag === "tender") {
      assert.ok(
        fm.content_note && fm.content_note !== "null" && fm.content_note !== "~",
        `${file} is tagged ${fm.accessibility_flag} but has no content_note`,
      );
    }
  }
});
