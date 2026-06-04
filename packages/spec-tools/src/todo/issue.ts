/**
 * TODO → GitHub Issue 起票ロジック。
 *
 * - .todo.md を全て走査
 * - issueNumber: null の TD を見つけたら Issue を起票
 * - 起票後、.todo.md の該当 TD の "issue:" 行に番号を書き込む
 *
 * 注意: 自動 commit までの責務はワークフロー側（GitHub Actions）が持つ。
 *      このコマンドは「ファイルを書き換える」「起票する」までやる。
 */

import path from "node:path";
import { promises as fs } from "node:fs";
import { collectSpecFiles } from "../utils/files.js";
import { parseTodoFile } from "../parsers/todo.js";
import { parseSpecFile } from "../parsers/spec.js";
import { createRepoContext, type RepoContext } from "../utils/github.js";
import type { Spec, TodoFile, TodoItem } from "../types.js";

const ISSUE_LABEL = "spec-todo";

export interface IssueRunResult {
  /** 起票した Issue の数 */
  created: number;
  /** ファイル単位の変更（書き換え後の path 一覧） */
  modifiedFiles: string[];
}

export async function runTodoIssue(specRoot: string): Promise<IssueRunResult> {
  const ctx = createRepoContext();
  const collected = await collectSpecFiles(specRoot);

  const specs = new Map<string, Spec>();
  for (const f of collected.specFiles) {
    const s = await parseSpecFile(f);
    specs.set(s.frontMatter["spec-id"], s);
  }

  let created = 0;
  const modifiedFiles: string[] = [];

  for (const todoPath of collected.todoFiles) {
    const todo = await parseTodoFile(todoPath);
    const spec = specs.get(todo.specId);
    if (!spec) continue; // 対応 spec が無いものは lint で落とす

    let mutated = false;
    for (const item of todo.items) {
      if (item.issueNumber !== null) continue;
      const issueNumber = await createIssue(ctx, spec, todo, item);
      item.issueNumber = issueNumber;
      created += 1;
      mutated = true;
    }

    if (mutated) {
      await writeIssueNumbersBack(todoPath, todo);
      modifiedFiles.push(todoPath);
    }
  }

  return { created, modifiedFiles };
}

async function createIssue(
  ctx: RepoContext,
  spec: Spec,
  todo: TodoFile,
  item: TodoItem,
): Promise<number> {
  const title = `[${spec.frontMatter["spec-id"]}] ${item.id}: ${item.summary}`;
  const specRelPath = path.relative(process.cwd(), spec.filePath);
  const todoRelPath = path.relative(process.cwd(), todo.filePath);

  const body = [
    item.question,
    "",
    "---",
    "",
    `- spec: \`${specRelPath}\``,
    `- todo file: \`${todoRelPath}\``,
    `- spec id: ${spec.frontMatter["spec-id"]}`,
    `- todo id: ${item.id}`,
    item.dueDate ? `- 期限: ${item.dueDate}` : "",
    "",
    "_この issue は `mpa-spec-todo-issue` によって自動起票されました。クローズすると対応する TODO エントリが `.todo.md` から自動削除されます。_",
  ]
    .filter((line) => line !== null && line !== undefined)
    .join("\n");

  const labels = [
    ISSUE_LABEL,
    `capability/${spec.frontMatter.capability}`,
    `spec/${spec.frontMatter["spec-id"]}`,
  ];

  const assignees: string[] = [];
  if (item.owner && item.owner.startsWith("@")) {
    assignees.push(item.owner.slice(1));
  } else if (item.owner) {
    assignees.push(item.owner);
  }

  const res = await ctx.octokit.issues.create({
    owner: ctx.owner,
    repo: ctx.repo,
    title,
    body,
    labels,
    assignees: assignees.length > 0 ? assignees : undefined,
  });

  return res.data.number;
}

/**
 * todo ファイルの該当 TD の "issue:" 行に番号を書き戻す。
 *
 * 既存の "- issue:" 行を全件置換する（既存値が「(CI が自動追記)」のような placeholder のとき）。
 * 行が無ければ末尾に追加。
 */
async function writeIssueNumbersBack(
  filePath: string,
  todo: TodoFile,
): Promise<void> {
  const raw = await fs.readFile(filePath, "utf-8");
  const lines = raw.split(/\r?\n/);

  // TD ごとの「セクション範囲」を特定して書き換える
  const headerPattern = /^##\s+(TD-\d+):/;

  // セクション境界を抽出: 各 TD の開始行 index
  const sections: { id: string; start: number; end: number }[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    const m = line.match(headerPattern);
    if (m) {
      if (sections.length > 0) {
        const last = sections[sections.length - 1];
        if (last) last.end = i;
      }
      sections.push({ id: m[1] ?? "", start: i, end: lines.length });
    }
  }

  for (const section of sections) {
    const targetItem = todo.items.find((i) => i.id === section.id);
    if (!targetItem || targetItem.issueNumber === null) continue;

    let issueLineIdx = -1;
    for (let i = section.start; i < section.end; i += 1) {
      const line = lines[i] ?? "";
      if (/^-\s+issue:/.test(line)) {
        issueLineIdx = i;
        break;
      }
    }

    const newLine = `- issue: #${targetItem.issueNumber}`;
    if (issueLineIdx >= 0) {
      lines[issueLineIdx] = newLine;
    } else {
      // 末尾の最後の非空行の後ろに挿入
      let insertAt = section.end;
      for (let i = section.end - 1; i > section.start; i -= 1) {
        if ((lines[i] ?? "").trim().length > 0) {
          insertAt = i + 1;
          break;
        }
      }
      lines.splice(insertAt, 0, newLine);
    }
  }

  await fs.writeFile(filePath, lines.join("\n"), "utf-8");
}

export { ISSUE_LABEL };
