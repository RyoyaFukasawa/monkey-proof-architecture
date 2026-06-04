/**
 * lint ルールをまとめて実行するランナー。
 *
 * - collectSpecFiles で対象を集める
 * - パーサーで Spec / TodoFile / Capability[] に変換
 * - ルールを実行して LintIssue[] を集約
 */

import type { LintIssue } from "../types.js";
import { collectSpecFiles } from "../utils/files.js";
import { parseSpecFile } from "../parsers/spec.js";
import { parseTodoFile } from "../parsers/todo.js";
import { parseCapabilitiesFile } from "../parsers/capabilities.js";
import {
  lintAcceptanceCriteria,
  lintAcceptedHasNoOpenTodo,
  lintAcceptedHasNoPendingAc,
  lintCapability,
  lintFrontMatter,
  lintInternalLinks,
  lintTodoHasMatchingSpec,
  lintTodoItems,
} from "./rules.js";

export async function runLint(specRoot: string): Promise<LintIssue[]> {
  const collected = await collectSpecFiles(specRoot);

  const specs = await Promise.all(
    collected.specFiles.map((f) => parseSpecFile(f)),
  );
  const todos = await Promise.all(
    collected.todoFiles.map((f) => parseTodoFile(f)),
  );
  const capabilities = collected.capabilitiesFile
    ? await parseCapabilitiesFile(collected.capabilitiesFile)
    : [];

  const issues: LintIssue[] = [];

  for (const spec of specs) {
    issues.push(...lintFrontMatter(spec));
    issues.push(...lintCapability(spec, capabilities));
    issues.push(...lintAcceptanceCriteria(spec));
    issues.push(...lintAcceptedHasNoPendingAc(spec));
    issues.push(...lintAcceptedHasNoOpenTodo(spec, todos));
    issues.push(...(await lintInternalLinks(spec)));
  }

  for (const todo of todos) {
    issues.push(...(await lintTodoHasMatchingSpec(todo, specs)));
    issues.push(...lintTodoItems(todo));
  }

  return issues;
}

export function formatLintIssues(issues: LintIssue[]): string {
  if (issues.length === 0) {
    return "✅ spec lint: 違反なし";
  }

  const sorted = [...issues].sort((a, b) => {
    if (a.filePath !== b.filePath) return a.filePath.localeCompare(b.filePath);
    return a.rule.localeCompare(b.rule);
  });

  const lines: string[] = [];
  let currentFile = "";
  for (const issue of sorted) {
    if (issue.filePath !== currentFile) {
      currentFile = issue.filePath;
      lines.push("");
      lines.push(currentFile);
    }
    const tag = issue.severity === "error" ? "ERROR" : "WARN ";
    lines.push(`  ${tag} [${issue.rule}] ${issue.message}`);
  }

  const errors = issues.filter((i) => i.severity === "error").length;
  const warnings = issues.filter((i) => i.severity === "warning").length;
  lines.push("");
  lines.push(`Summary: ${errors} error(s), ${warnings} warning(s)`);
  return lines.join("\n");
}

export function hasErrors(issues: LintIssue[]): boolean {
  return issues.some((i) => i.severity === "error");
}
