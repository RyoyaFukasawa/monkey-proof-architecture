/**
 * E2E: ビルド済み dist/cli.js を「npx と同じ symlink 経由」で起動して、
 * 実際に MPA 一式が展開されることを検証する。
 *
 * 背景（重要）:
 *   npx / グローバル install は node_modules/.bin/<name> という symlink 経由で
 *   bin を起動する。このとき process.argv[1] は symlink のパスになり、
 *   import.meta.url（実体 dist/cli.js）と単純比較すると一致せず、
 *   エントリポイント（main）が呼ばれず「無言で終了する」バグが起きた。
 *
 *   src/cli.ts を import して run() を直接呼ぶテストではこの経路を通らないため、
 *   このバグを検出できなかった。ここでは必ず symlink 経由で起動して再現を防ぐ。
 *
 * 前提: pretest で npm run build 済み（dist/cli.js が存在する）。
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, mkdir, symlink, chmod } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);

const here = dirname(fileURLToPath(import.meta.url));
const CLI = resolve(here, "..", "dist", "cli.js"); // ビルド成果物

test("E2E: symlink(.bin)経由で起動しても MPA が展開される（npx経路の再現）", async () => {
  assert.ok(existsSync(CLI), `dist/cli.js が無い。先に npm run build が必要: ${CLI}`);

  const work = await mkdtemp(join(tmpdir(), "mpa-e2e-"));
  try {
    // npx の node_modules/.bin/<name> -> ../<pkg>/dist/cli.js という symlink を模す
    const binDir = join(work, "node_modules", ".bin");
    await mkdir(binDir, { recursive: true });
    const binLink = join(binDir, "create-monkey-proof");
    await symlink(CLI, binLink);
    await chmod(CLI, 0o755);

    const dest = join(work, "project");
    await mkdir(dest, { recursive: true });

    // symlink を実行（= npx と同じく argv[1] が symlink になる）
    const { stdout } = await execFileAsync(process.execPath, [
      binLink,
      "--tools=claude",
      `--dir=${dest}`,
    ]);

    // 無言終了していないこと（バグ時はここが空だった）
    assert.match(stdout, /MPA を導入します/, "エントリポイントが起動していない（無言終了）");
    assert.match(stdout, /配置:/);

    // 実ファイルが展開されていること
    for (const rel of [
      "docs/concepts/mpa.md",
      "docs/spec/_template.md",
      ".github/workflows/spec-lint.yml",
      ".claude/skills/mpa-spec/SKILL.md",
    ]) {
      assert.ok(existsSync(join(dest, rel)), `展開されていない: ${rel}`);
    }
  } finally {
    await rm(work, { recursive: true, force: true });
  }
});

test("E2E: --help が exit 0 で usage を出す", async () => {
  const { stdout } = await execFileAsync(process.execPath, [CLI, "--help"]);
  assert.match(stdout, /使い方:/);
});

test("E2E: 不正な引数は exit 2 で終わる", async () => {
  await assert.rejects(
    () => execFileAsync(process.execPath, [CLI, "--tools=foobar"]),
    (err: NodeJS.ErrnoException & { code?: number }) => {
      assert.equal((err as unknown as { code: number }).code, 2);
      return true;
    },
  );
});
