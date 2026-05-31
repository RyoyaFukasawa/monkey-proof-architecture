/**
 * create-monkey-proof の回帰テスト（node:test）。
 *
 * 実行: npm test（tsx で .ts を直接走らせる）
 * テストは src/cli.ts を import するだけで CLI 本体は走らない（main ガード済み）。
 * assets/ が必要なので、事前に npm run build しておくこと（pretest で担保）。
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { parseArgs, mdToToml, run } from "../src/cli.ts";

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
  const opts = parseArgs(["--tools=gemini,claude,gemini"]);
  if (opts === "help") throw new Error("unexpected help");
  assert.deepEqual(opts.tools, ["gemini", "claude"]);
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

// ---- mdToToml ----

test("mdToToml: frontmatter の description を toml キーに、本文を prompt に", () => {
  const md = "---\ndescription: テスト用\n---\n# 本文\n\nここ。\n";
  const toml = mdToToml(md);
  assert.match(toml, /^description = "テスト用"/m);
  assert.match(toml, /prompt = """/);
  assert.match(toml, /# 本文/);
});

test("mdToToml: description の \" はエスケープされる", () => {
  const md = '---\ndescription: a"b\n---\nbody\n';
  const toml = mdToToml(md);
  assert.match(toml, /description = "a\\"b"/);
});

test("mdToToml: frontmatter が無くても本文は prompt に入る", () => {
  const toml = mdToToml("# no front\n");
  assert.doesNotMatch(toml, /^description =/m);
  assert.match(toml, /prompt = """[\s\S]*# no front/);
});

// ---- run（統合：実際に /tmp へ展開）----

test("run: claude+gemini を展開し、期待ファイルが揃う", async () => {
  const dir = await mkdtemp(join(tmpdir(), "mpa-test-"));
  try {
    await silence(() =>
      run({ target: "new", tools: ["claude", "gemini"], cwd: dir })
    );

    // 主要ファイルの実在
    const expected = [
      "constitution/00-principles.md",
      ".claude/skills/mpa/SKILL.md",
      ".claude/commands/mpa-check.md",
      "CLAUDE.md",
      ".claude/hooks/bin/mpa-pre-write.sh",
      ".claude/settings.example.json",
      ".gemini/commands/mpa.toml",
      "GEMINI.md",
    ];
    for (const rel of expected) {
      assert.ok(existsSync(join(dir, rel)), `missing: ${rel}`);
    }

    // hook の実行ビット
    const st = await stat(join(dir, ".claude/hooks/bin/mpa-pre-write.sh"));
    assert.ok(st.mode & 0o111, "hook に実行ビットが立っていない");

    // toml 変換結果
    const toml = await readFile(join(dir, ".gemini/commands/mpa-check.toml"), "utf8");
    assert.match(toml, /^description = ".+"/m);
    assert.match(toml, /prompt = """/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("run: 既存ファイルは上書きせずスキップ（冪等・再実行で破壊しない）", async () => {
  const dir = await mkdtemp(join(tmpdir(), "mpa-test-"));
  try {
    // 1回目: claude
    await silence(() => run({ target: "new", tools: ["claude"], cwd: dir }));

    // CLAUDE.md を手で書き換える → 2回目で上書きされないことを確認
    const claudeMd = join(dir, "CLAUDE.md");
    const marker = "<!-- user-edited -->";
    const before = await readFile(claudeMd, "utf8");
    await rm(claudeMd);
    await (await import("node:fs/promises")).writeFile(claudeMd, before + marker);

    // 2回目: codex 追加（AGENTS.md は新規、CLAUDE.md は既存スキップのはず）
    await silence(() => run({ target: "new", tools: ["claude", "codex"], cwd: dir }));

    const after = await readFile(claudeMd, "utf8");
    assert.ok(after.includes(marker), "既存 CLAUDE.md が上書きされてしまった");
    assert.ok(existsSync(join(dir, "AGENTS.md")), "codex 分の AGENTS.md が作られていない");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
