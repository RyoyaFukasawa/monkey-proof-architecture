/**
 * 仕様 lint のルール本体。
 *
 * 各ルールは Spec / TodoFile / Capability[] を受け取り、違反があれば LintIssue を返す。
 * ルール番号は templates/spec/README.md §ルール に対応する。
 */

import path from "node:path";
import { promises as fs } from "node:fs";
import type {
  Capability,
  LintIssue,
  Spec,
  TodoFile,
} from "../types.js";
import {
  REQUIRED_FRONTMATTER_KEYS,
  VALID_STATUSES,
} from "../parsers/spec.js";

export function lintFrontMatter(spec: Spec): LintIssue[] {
  const issues: LintIssue[] = [];
  const fm = spec.frontMatter;

  for (const key of REQUIRED_FRONTMATTER_KEYS) {
    const value = fm[key];
    if (!value || (typeof value === "string" && value.length === 0)) {
      issues.push({
        severity: "error",
        filePath: spec.filePath,
        rule: "frontmatter.required",
        message: `front-matter の必須項目 "${key}" が空または欠落しています。`,
      });
    }
  }

  if (!VALID_STATUSES.includes(fm.status)) {
    issues.push({
      severity: "error",
      filePath: spec.filePath,
      rule: "frontmatter.status",
      message: `front-matter の "status" が不正です（受け付ける値: ${VALID_STATUSES.join(", ")}）。`,
    });
  }

  return issues;
}

export function lintCapability(
  spec: Spec,
  capabilities: Capability[],
): LintIssue[] {
  const issues: LintIssue[] = [];
  if (!spec.frontMatter.capability) return issues;

  const known = new Set(capabilities.map((c) => c.name));
  if (capabilities.length === 0) {
    // _capabilities.md が存在しないなら検証しない（warning だけ）
    issues.push({
      severity: "warning",
      filePath: spec.filePath,
      rule: "capability.no-definition",
      message: `_capabilities.md が見つからないため、capability "${spec.frontMatter.capability}" の存在確認をスキップしました。`,
    });
    return issues;
  }

  if (!known.has(spec.frontMatter.capability)) {
    issues.push({
      severity: "error",
      filePath: spec.filePath,
      rule: "capability.unknown",
      message: `front-matter の "capability" に未登録の値 "${spec.frontMatter.capability}" が指定されています。_capabilities.md に登録してください。`,
    });
  }

  return issues;
}

export function lintAcceptanceCriteria(spec: Spec): LintIssue[] {
  const issues: LintIssue[] = [];

  if (spec.acceptanceCriteria.length === 0) {
    issues.push({
      severity: "error",
      filePath: spec.filePath,
      rule: "ac.required",
      message: `受け入れ基準（AC-N）が1つも検出されませんでした。`,
    });
    return issues;
  }

  // ID の重複・順序チェック
  const seen = new Set<string>();
  for (const ac of spec.acceptanceCriteria) {
    if (seen.has(ac.id)) {
      issues.push({
        severity: "error",
        filePath: spec.filePath,
        rule: "ac.duplicate-id",
        message: `AC-id "${ac.id}" が重複しています。`,
      });
    }
    seen.add(ac.id);
  }

  return issues;
}

/**
 * status: accepted の spec に [保留] AC が残っていないか
 */
export function lintAcceptedHasNoPendingAc(spec: Spec): LintIssue[] {
  if (spec.frontMatter.status !== "accepted") return [];

  return spec.acceptanceCriteria
    .filter((ac) => ac.isPending)
    .map((ac) => ({
      severity: "error" as const,
      filePath: spec.filePath,
      rule: "accepted.no-pending",
      message: `status: accepted の spec に [保留] AC が残っています: ${ac.id}`,
    }));
}

/**
 * status: accepted の spec に対応する TODO ファイルが残っていないか
 */
export function lintAcceptedHasNoOpenTodo(
  spec: Spec,
  todoFiles: TodoFile[],
): LintIssue[] {
  if (spec.frontMatter.status !== "accepted") return [];

  const specId = spec.frontMatter["spec-id"];
  const related = todoFiles.find(
    (t) => t.specId === specId && t.items.length > 0,
  );
  if (!related) return [];

  return [
    {
      severity: "error",
      filePath: spec.filePath,
      rule: "accepted.no-open-todo",
      message: `status: accepted の spec ${specId} に未解決の TODO (${related.items.map((i) => i.id).join(", ")}) が残っています。TODO を解決してから accepted に上げてください。`,
    },
  ];
}

/**
 * TODO ファイルに対応する spec が存在するか
 */
export async function lintTodoHasMatchingSpec(
  todo: TodoFile,
  specs: Spec[],
): Promise<LintIssue[]> {
  if (!todo.specId) {
    return [
      {
        severity: "error",
        filePath: todo.filePath,
        rule: "todo.invalid-filename",
        message: `ファイル名が "<spec-id>-<summary>.todo.md" の形式ではありません。`,
      },
    ];
  }

  const match = specs.find((s) => s.frontMatter["spec-id"] === todo.specId);
  if (!match) {
    return [
      {
        severity: "error",
        filePath: todo.filePath,
        rule: "todo.spec-missing",
        message: `この TODO ファイルが指す spec ${todo.specId} が見つかりません。`,
      },
    ];
  }
  return [];
}

/**
 * TODO の各エントリの整合性
 */
export function lintTodoItems(todo: TodoFile): LintIssue[] {
  const issues: LintIssue[] = [];

  const seen = new Set<string>();
  for (const item of todo.items) {
    if (seen.has(item.id)) {
      issues.push({
        severity: "error",
        filePath: todo.filePath,
        rule: "todo.duplicate-id",
        message: `TD-id "${item.id}" が重複しています。`,
      });
    }
    seen.add(item.id);
  }
  return issues;
}

/**
 * spec 本体内のローカルリンクが壊れていないか
 *
 * 「絶対 URL は対象外」「アンカーのみ（#section）は対象外」「ファイル参照のみチェック」。
 */
export async function lintInternalLinks(spec: Spec): Promise<LintIssue[]> {
  const issues: LintIssue[] = [];
  const linkPattern = /\[[^\]]+\]\(([^)]+)\)/g;
  const dir = path.dirname(spec.filePath);

  for (const match of spec.body.matchAll(linkPattern)) {
    const href = match[1] ?? "";
    if (!href || href.startsWith("http://") || href.startsWith("https://")) {
      continue;
    }
    if (href.startsWith("#")) continue;

    const cleanedHref = href.split("#")[0]; // anchor は除外
    if (!cleanedHref) continue;

    const target = path.resolve(dir, cleanedHref);
    try {
      await fs.access(target);
    } catch {
      issues.push({
        severity: "error",
        filePath: spec.filePath,
        rule: "links.broken",
        message: `リンク切れ: ${href}`,
      });
    }
  }
  return issues;
}
