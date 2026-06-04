#!/usr/bin/env node
/**
 * mpa-spec-todo-issue
 *
 * 使い方:
 *   mpa-spec-todo-issue <spec ディレクトリ>
 *
 * spec ディレクトリ配下の `.todo.md` を全て走査し、issueNumber が未設定の TD を
 * GitHub Issue として起票する。起票後、issue 番号を `.todo.md` に書き戻す。
 *
 * 環境変数:
 *   GITHUB_TOKEN       — GitHub Actions の `secrets.GITHUB_TOKEN`
 *   GITHUB_REPOSITORY  — owner/repo（GitHub Actions が自動で渡す）
 */

import process from "node:process";
import { runTodoIssue } from "../todo/issue.js";

async function main(): Promise<void> {
  const target = process.argv[2];
  if (!target) {
    console.error("usage: mpa-spec-todo-issue <spec ディレクトリ>");
    process.exit(2);
  }

  const result = await runTodoIssue(target);
  console.log(`mpa-spec-todo-issue: ${result.created} 件の issue を起票しました。`);
  if (result.modifiedFiles.length > 0) {
    console.log("更新したファイル:");
    for (const f of result.modifiedFiles) console.log(`  ${f}`);
  }
}

main().catch((err) => {
  console.error("mpa-spec-todo-issue failed:", err);
  process.exit(1);
});
