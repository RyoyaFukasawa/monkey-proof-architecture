/**
 * create-monkey-proof の回帰テスト（node:test）。
 *
 * 実行: npm test（tsx で .ts を直接走らせる）
 * テストは src/cli.ts を import するだけで CLI 本体は走らない（main ガード済み）。
 * assets/ が必要なので、事前に npm run build しておくこと（pretest で担保）。
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { parseArgs, run } from "../src/cli.ts";

// run() は進捗を console.log するので、テスト中は黙らせる。
function silence<T>(fn: () => Promise<T>): Promise<T> {
  const origLog = console.log;
  const origErr = console.error;
  console.log = () => {};
  console.error = () => {};
  return fn().finally(() => {
    console.log = origLog;
    console.error = origErr;
  });
}

// ---- parseArgs ----

test("parseArgs: 既定は new / claude", () => {
  const opts = parseArgs([]);
  assert.notEqual(opts, "help");
  if (opts === "help") return;
  assert.equal(opts.target, "new");
  assert.deepEqual(opts.tools, ["claude"]);
});

test("parseArgs: --help は 'help' を返す", () => {
  assert.equal(parseArgs(["--help"]), "help");
  assert.equal(parseArgs(["-h"]), "help");
});

test("parseArgs: --tools=all は全ツール", () => {
  const opts = parseArgs(["--tools=all"]);
  if (opts === "help") throw new Error("unexpected help");
  assert.deepEqual(opts.tools, ["claude", "gemini", "codex", "generic"]);
});

test("parseArgs: --tools の重複は除去・順序保持", () => {
  const opts = parseArgs(["--tools=codex,claude,codex"]);
  if (opts === "help") throw new Error("unexpected help");
  assert.deepEqual(opts.tools, ["codex", "claude"]);
});

test("parseArgs: 未知のツールは例外", () => {
  assert.throws(() => parseArgs(["--tools=foobar"]), /未知のツール/);
});

test("parseArgs: 不正な target は例外", () => {
  assert.throws(() => parseArgs(["--target=xxx"]), /new \| existing/);
});

test("parseArgs: 未知の引数は例外", () => {
  assert.throws(() => parseArgs(["--nope"]), /未知の引数/);
});

// ---- run（統合：実際に /tmp へ展開）----

test("run: claude を展開し、思想・spec 雛形・workflow・mpa-spec スキルが揃う", async () => {
  const dir = await mkdtemp(join(tmpdir(), "mpa-test-"));
  try {
    await silence(() =>
      run({ target: "new", tools: ["claude"], cwd: dir }),
    );

    const expected = [
      // 思想
      "docs/concepts/mpa.md",
      "docs/concepts/workflow.md",
      "docs/concepts/phases/1-spec.md",
      // spec 雛形
      "docs/spec/README.md",
      "docs/spec/_template.md",
      "docs/spec/_template.todo.md",
      // workflow
      ".github/workflows/spec-lint.yml",
      ".github/workflows/spec-todo-issue.yml",
      ".github/workflows/spec-todo-cleanup.yml",
      // claude 向けスキル
      ".claude/skills/mpa-spec/SKILL.md",
      ".claude/skills/mpa-spec/agents/gap-finder.md",
    ];
    for (const rel of expected) {
      assert.ok(existsSync(join(dir, rel)), `missing: ${rel}`);
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("run: codex で .agents/skills/mpa-spec が配置される", async () => {
  const dir = await mkdtemp(join(tmpdir(), "mpa-test-"));
  try {
    await silence(() =>
      run({ target: "new", tools: ["codex"], cwd: dir }),
    );

    assert.ok(existsSync(join(dir, ".agents/skills/mpa-spec/SKILL.md")));
    assert.ok(
      existsSync(join(dir, ".agents/skills/mpa-spec/agents/gap-finder.md")),
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("run: 既存ファイルは上書きせずスキップ（冪等・再実行で破壊しない）", async () => {
  const dir = await mkdtemp(join(tmpdir(), "mpa-test-"));
  try {
    // 1回目: claude
    await silence(() => run({ target: "new", tools: ["claude"], cwd: dir }));

    // SKILL.md を手で書き換える → 2回目で上書きされないことを確認
    const skillPath = join(dir, ".claude/skills/mpa-spec/SKILL.md");
    const marker = "<!-- user-edited -->";
    const before = await readFile(skillPath, "utf8");
    await writeFile(skillPath, before + marker);

    // 2回目: claude + codex（codex 分は新規、claude 分は既存スキップ）
    await silence(() =>
      run({ target: "new", tools: ["claude", "codex"], cwd: dir }),
    );

    const after = await readFile(skillPath, "utf8");
    assert.ok(after.includes(marker), "既存 SKILL.md が上書きされてしまった");
    assert.ok(
      existsSync(join(dir, ".agents/skills/mpa-spec/SKILL.md")),
      "codex 分のスキルが作られていない",
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
