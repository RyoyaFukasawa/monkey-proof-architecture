/**
 * Issue クローズ → TODO 削除ロジック。
 *
 * 1つの Issue 番号を受け取り、それを含む TD セクションを `.todo.md` から削除する。
 *
 * - 該当ファイルが見つからなければ何もしない
 * - 削除後、ファイルから TD セクションが全部消えたらファイル自体を削除する
 */

import path from "node:path";
import { promises as fs } from "node:fs";
import { collectSpecFiles } from "../utils/files.js";
import { parseTodoFile } from "../parsers/todo.js";

export interface CleanupResult {
  /** 削除した TD の数 */
  removedItems: number;
  /** 物理削除した TODO ファイル */
  removedFiles: string[];
  /** 内容を書き換えた TODO ファイル */
  modifiedFiles: string[];
}

export async function runTodoCleanup(
  specRoot: string,
  issueNumber: number,
): Promise<CleanupResult> {
  const collected = await collectSpecFiles(specRoot);
  const result: CleanupResult = {
    removedItems: 0,
    removedFiles: [],
    modifiedFiles: [],
  };

  for (const filePath of collected.todoFiles) {
    const todo = await parseTodoFile(filePath);
    const target = todo.items.find((i) => i.issueNumber === issueNumber);
    if (!target) continue;

    const removed = await removeTdFromFile(filePath, target.id);
    if (!removed) continue;

    result.removedItems += 1;

    // 再度パースして TD が空ならファイル削除
    const after = await parseTodoFile(filePath);
    if (after.items.length === 0) {
      await fs.unlink(filePath);
      result.removedFiles.push(filePath);
    } else {
      result.modifiedFiles.push(filePath);
    }
  }

  return result;
}

/**
 * 1つの TD セクション（`## TD-N: ...` から次の `## ` or ファイル末尾まで）を削除する。
 * 直前後の区切り（`---` や空行の連続）は適度に整える。
 */
async function removeTdFromFile(
  filePath: string,
  tdId: string,
): Promise<boolean> {
  const raw = await fs.readFile(filePath, "utf-8");
  const lines = raw.split(/\r?\n/);

  const headerPattern = new RegExp(`^##\\s+${escapeRegex(tdId)}:`);
  let start = -1;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    if (headerPattern.test(line)) {
      start = i;
      break;
    }
  }
  if (start === -1) return false;

  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    if (/^##\s+TD-\d+:/.test(line)) {
      end = i;
      break;
    }
  }

  // 削除する範囲を広げる: 直前の "---" 区切り行を含めて削る
  let trimStart = start;
  for (let i = start - 1; i >= 0; i -= 1) {
    const line = (lines[i] ?? "").trim();
    if (line === "") {
      trimStart = i;
      continue;
    }
    if (line === "---") {
      trimStart = i;
      break;
    }
    break;
  }

  // 末尾側: 削除した後の最初の非空行までの空行を残す（1行だけ）
  lines.splice(trimStart, end - trimStart);

  // 連続する空行を1つに圧縮
  const compacted: string[] = [];
  let blankRun = 0;
  for (const line of lines) {
    if (line.trim() === "") {
      blankRun += 1;
      if (blankRun <= 1) compacted.push(line);
    } else {
      blankRun = 0;
      compacted.push(line);
    }
  }

  await fs.writeFile(filePath, compacted.join("\n"), "utf-8");
  return true;
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
