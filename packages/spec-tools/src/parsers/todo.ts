/**
 * .todo.md パーサー
 *
 * 形式は templates/spec/_template.todo.md を参照。
 *   ## TD-1: <要約>
 *   <質問本文>
 *   - 担当: @user / （未定）
 *   - 期限: YYYY-MM-DD
 *   - issue: #42 / （CI が自動追記）
 */

import path from "node:path";
import { promises as fs } from "node:fs";
import type { TodoFile, TodoItem } from "../types.js";

const TD_HEADER = /^##\s+(TD-\d+):\s*(.+?)\s*$/;
const FIELD_PATTERN = /^-\s+(担当|期限|issue):\s*(.*)$/;

export async function parseTodoFile(filePath: string): Promise<TodoFile> {
  const raw = await fs.readFile(filePath, "utf-8");
  return parseTodoContent(filePath, raw);
}

export function parseTodoContent(filePath: string, raw: string): TodoFile {
  const specId = extractSpecIdFromFilename(filePath);
  const lines = raw.split(/\r?\n/);
  const items: TodoItem[] = [];

  let current: TodoItem | null = null;
  let questionBuffer: string[] = [];
  let inFields = false;

  const flush = () => {
    if (current) {
      current.question = questionBuffer.join("\n").trim();
      items.push(current);
    }
  };

  for (const line of lines) {
    const headerMatch = line.match(TD_HEADER);
    if (headerMatch) {
      flush();
      const id = headerMatch[1] ?? "";
      const summary = headerMatch[2] ?? "";
      current = {
        id,
        summary,
        question: "",
        owner: null,
        dueDate: null,
        issueNumber: null,
      };
      questionBuffer = [];
      inFields = false;
      continue;
    }

    if (!current) continue;

    // セクション区切り線
    if (/^---\s*$/.test(line)) {
      flush();
      current = null;
      questionBuffer = [];
      inFields = false;
      continue;
    }

    // フィールド行
    const fieldMatch = line.match(FIELD_PATTERN);
    if (fieldMatch) {
      inFields = true;
      const key = fieldMatch[1];
      const value = (fieldMatch[2] ?? "").trim();
      if (key === "担当") {
        current.owner = parseOwner(value);
      } else if (key === "期限") {
        current.dueDate = parseDueDate(value);
      } else if (key === "issue") {
        current.issueNumber = parseIssueNumber(value);
      }
      continue;
    }

    // 質問本文はフィールド行が始まる前まで
    if (!inFields) {
      questionBuffer.push(line);
    }
  }
  flush();

  return {
    filePath,
    specId,
    items: items.filter((it) => it.id.length > 0),
  };
}

function parseOwner(value: string): string | null {
  // 「未定」「（未定）」「-」「(unset)」などは null
  if (!value || /^[（(]?未定[)）]?$/.test(value) || value === "-") {
    return null;
  }
  return value;
}

function parseDueDate(value: string): string | null {
  if (!value || /^[（(]?未定[)）]?$/.test(value)) {
    return null;
  }
  // YYYY-MM-DD だけ受け付ける
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? (match[1] ?? null) : null;
}

function parseIssueNumber(value: string): number | null {
  if (!value || /CI/.test(value) || /未/.test(value)) {
    return null;
  }
  const match = value.match(/#?(\d+)/);
  return match ? Number(match[1]) : null;
}

/**
 * ファイル名 `<spec-id>-<summary>.todo.md` から spec-id を取り出す。
 */
export function extractSpecIdFromFilename(filePath: string): string {
  const base = path.basename(filePath);
  const match = base.match(/^(spec-\d{3,})-.+\.todo\.md$/);
  return match ? (match[1] ?? "") : "";
}
