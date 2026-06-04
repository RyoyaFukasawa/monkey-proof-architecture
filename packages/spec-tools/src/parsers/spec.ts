/**
 * spec.md パーサー
 *
 * front-matter + 本文を分解し、AC（受け入れ基準）を抽出する。
 * 規約は templates/spec/_template.md と templates/spec/README.md を参照。
 */

import { promises as fs } from "node:fs";
import matter from "gray-matter";
import type {
  AcceptanceCriterion,
  Spec,
  SpecFrontMatter,
  SpecStatus,
} from "../types.js";

const VALID_STATUSES: SpecStatus[] = ["draft", "review", "accepted", "obsolete"];

const REQUIRED_FRONTMATTER_KEYS = [
  "spec-id",
  "title",
  "status",
  "owner",
  "capability",
] as const;

/**
 * spec.md ファイルを読み込んでパースする。
 *
 * front-matter が無い・必須項目が無い・status が不正な場合は例外を投げず、
 * できる限りの情報を Spec として返す（lint 側で違反として扱う）。
 */
export async function parseSpecFile(filePath: string): Promise<Spec> {
  const raw = await fs.readFile(filePath, "utf-8");
  return parseSpecContent(filePath, raw);
}

export function parseSpecContent(filePath: string, raw: string): Spec {
  const parsed = matter(raw);
  const data = parsed.data as Partial<Record<string, unknown>>;

  const frontMatter: SpecFrontMatter = {
    "spec-id": stringOrEmpty(data["spec-id"]),
    title: stringOrEmpty(data.title),
    status: parseStatus(data.status),
    owner: stringOrEmpty(data.owner),
    capability: stringOrEmpty(data.capability),
    created: optionalString(data.created),
    updated: optionalString(data.updated),
  };

  const acceptanceCriteria = extractAcceptanceCriteria(parsed.content);

  return {
    filePath,
    frontMatter,
    acceptanceCriteria,
    body: parsed.content,
  };
}

/**
 * 本文から AC ブロックを抽出する。
 *
 * 形式：
 *   ### AC-1: <一行要約>
 *   <本文>
 *   ### AC-2: ...
 *
 * `[保留]` マーカーが summary に含まれていれば isPending: true。
 */
function extractAcceptanceCriteria(body: string): AcceptanceCriterion[] {
  const lines = body.split(/\r?\n/);
  const acHeaderPattern = /^###\s+(AC-\d+):\s*(.+?)\s*$/;

  const items: AcceptanceCriterion[] = [];
  let current: AcceptanceCriterion | null = null;
  const buffer: string[] = [];

  const flush = () => {
    if (current) {
      current.body = buffer.join("\n").trim();
      items.push(current);
      buffer.length = 0;
    }
  };

  for (const line of lines) {
    const match = line.match(acHeaderPattern);
    if (match) {
      flush();
      const id = match[1] ?? "";
      const summary = match[2] ?? "";
      const isPending = summary.startsWith("[保留]");
      const cleanedSummary = isPending
        ? summary.replace(/^\[保留\]\s*/, "").trim()
        : summary;
      current = {
        id,
        summary: cleanedSummary,
        isPending,
        body: "",
      };
      continue;
    }

    // 次の "## " レベルセクションが来たら AC ブロックを閉じる
    if (current && /^##\s+/.test(line)) {
      flush();
      current = null;
      continue;
    }

    if (current) {
      buffer.push(line);
    }
  }
  flush();
  return items;
}

function parseStatus(value: unknown): SpecStatus {
  const str = stringOrEmpty(value);
  // コメント付き（例: "draft  # 説明"）を許す
  const head = str.split(/\s+/)[0] ?? "";
  return VALID_STATUSES.includes(head as SpecStatus)
    ? (head as SpecStatus)
    : ("" as SpecStatus);
}

function stringOrEmpty(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function optionalString(value: unknown): string | undefined {
  const s = stringOrEmpty(value);
  return s.length > 0 ? s : undefined;
}

export { REQUIRED_FRONTMATTER_KEYS, VALID_STATUSES };
