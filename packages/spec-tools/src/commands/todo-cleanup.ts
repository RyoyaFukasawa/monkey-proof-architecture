#!/usr/bin/env node
/**
 * mpa-spec-todo-cleanup
 *
 * 使い方:
 *   mpa-spec-todo-cleanup <spec ディレクトリ> <issue 番号>
 *
 * 指定された Issue 番号に対応する TD を `.todo.md` から削除する。
 * 削除後、TD が1個も無くなったら `.todo.md` ファイル自体を削除する。
 */

import process from "node:process";
import { runTodoCleanup } from "../todo/cleanup.js";

async function main(): Promise<void> {
  const target = process.argv[2];
  const issueArg = process.argv[3];
  if (!target || !issueArg) {
    console.error("usage: mpa-spec-todo-cleanup <spec ディレクトリ> <issue 番号>");
    process.exit(2);
  }
  const issueNumber = Number(issueArg);
  if (!Number.isInteger(issueNumber) || issueNumber <= 0) {
    console.error(`issue 番号が不正です: ${issueArg}`);
    process.exit(2);
  }

  const result = await runTodoCleanup(target, issueNumber);
  console.log(
    `mpa-spec-todo-cleanup: ${result.removedItems} 件の TD を削除しました。`,
  );
  if (result.removedFiles.length > 0) {
    console.log("削除した TODO ファイル:");
    for (const f of result.removedFiles) console.log(`  ${f}`);
  }
  if (result.modifiedFiles.length > 0) {
    console.log("更新した TODO ファイル:");
    for (const f of result.modifiedFiles) console.log(`  ${f}`);
  }
}

main().catch((err) => {
  console.error("mpa-spec-todo-cleanup failed:", err);
  process.exit(1);
});
