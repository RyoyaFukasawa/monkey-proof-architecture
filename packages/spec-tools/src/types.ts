/**
 * spec / TODO / capabilities の型定義
 *
 * 規約は templates/spec/README.md と templates/spec/_template.md を原本とする。
 * ここはその構造を TypeScript で表現したミラー。
 */

export type SpecStatus = "draft" | "review" | "accepted" | "obsolete";

export interface SpecFrontMatter {
  "spec-id": string;
  title: string;
  status: SpecStatus;
  owner: string;
  capability: string;
  created?: string;
  updated?: string;
}

export interface AcceptanceCriterion {
  /** "AC-1" などの ID */
  id: string;
  /** AC-1 行の summary */
  summary: string;
  /** [保留] マーカーが付いているか */
  isPending: boolean;
  /** AC 本文（前提・操作・期待結果）の生テキスト */
  body: string;
}

export interface Spec {
  /** 絶対パス */
  filePath: string;
  frontMatter: SpecFrontMatter;
  acceptanceCriteria: AcceptanceCriterion[];
  /** 本文全体（front-matter を除く） */
  body: string;
}

export interface TodoItem {
  /** "TD-1" などの ID */
  id: string;
  /** TD-1 行の summary */
  summary: string;
  /** 質問本文 */
  question: string;
  /** 担当（@username）。未定なら null */
  owner: string | null;
  /** 期限（YYYY-MM-DD）。未定なら null */
  dueDate: string | null;
  /** GitHub Issue 番号。未起票なら null */
  issueNumber: number | null;
}

export interface TodoFile {
  /** 絶対パス */
  filePath: string;
  /** 対応する spec-id */
  specId: string;
  /** TODO エントリ */
  items: TodoItem[];
}

export interface Capability {
  name: string;
  description?: string;
}

export interface LintIssue {
  severity: "error" | "warning";
  /** 違反のあったファイル（絶対パス） */
  filePath: string;
  /** 何のルールに違反したか（README §ルール の番号やキー） */
  rule: string;
  /** 人間向けメッセージ */
  message: string;
}
