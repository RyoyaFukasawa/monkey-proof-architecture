import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runLint } from "../src/lint/runner.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const EXAMPLES_SPEC = path.resolve(here, "..", "..", "..", "examples", "spec");

test("runLint: examples/spec/ には致命的なエラーが無い（_capabilities.md 未整備の warning は許容）", async () => {
  const issues = await runLint(EXAMPLES_SPEC);

  // _capabilities.md がまだ整備されていない場合の warning は許す
  const errors = issues.filter((i) => i.severity === "error");
  const blockingErrors = errors.filter(
    // examples/spec/ で TODO 残しのまま accepted の spec が無いか等の重要ルール
    (i) =>
      i.rule.startsWith("frontmatter.") ||
      i.rule === "ac.required" ||
      i.rule === "accepted.no-pending" ||
      i.rule === "accepted.no-open-todo" ||
      i.rule === "todo.invalid-filename" ||
      i.rule === "todo.spec-missing",
  );

  assert.equal(
    blockingErrors.length,
    0,
    `致命的エラーがあります:\n${blockingErrors
      .map((i) => `  ${i.filePath}\n    [${i.rule}] ${i.message}`)
      .join("\n")}`,
  );
});
