/**
 * spec ディレクトリの走査ユーティリティ。
 *
 * - docs/spec/ または examples/spec/ のような正本ディレクトリを受け取る
 * - そこから spec ファイル / TODO ファイルを列挙する
 */

import path from "node:path";
import { promises as fs } from "node:fs";

const SKIP_DIR_NAMES = new Set(["node_modules", ".git"]);
const TEMPLATE_PREFIX = "_template";

/**
 * `_` プレフィックスのファイルは横断資料（_glossary.md など）。
 * spec ファイルとしては扱わない。
 */
const RESERVED_UNDERSCORE_FILES = new Set([
  "_glossary.md",
  "_errors.md",
  "_capabilities.md",
]);

export interface SpecFiles {
  /** spec.md（.todo.md でないもの）の絶対パス */
  specFiles: string[];
  /** *.todo.md の絶対パス */
  todoFiles: string[];
  /** _capabilities.md の絶対パス（無ければ null） */
  capabilitiesFile: string | null;
  /** _glossary.md の絶対パス（無ければ null） */
  glossaryFile: string | null;
  /** _errors.md の絶対パス（無ければ null） */
  errorsFile: string | null;
}

export async function collectSpecFiles(root: string): Promise<SpecFiles> {
  const absoluteRoot = path.resolve(root);
  const result: SpecFiles = {
    specFiles: [],
    todoFiles: [],
    capabilitiesFile: null,
    glossaryFile: null,
    errorsFile: null,
  };

  await walk(absoluteRoot, async (filePath, base) => {
    // 横断資料（_glossary.md / _errors.md / _capabilities.md）は spec ではない
    if (RESERVED_UNDERSCORE_FILES.has(base)) {
      if (base === "_capabilities.md") result.capabilitiesFile = filePath;
      if (base === "_glossary.md") result.glossaryFile = filePath;
      if (base === "_errors.md") result.errorsFile = filePath;
      return;
    }

    // 雛形は対象外
    if (base.startsWith(TEMPLATE_PREFIX)) return;

    if (base.endsWith(".todo.md")) {
      result.todoFiles.push(filePath);
      return;
    }

    if (base.endsWith(".md") && !base.startsWith("README")) {
      result.specFiles.push(filePath);
    }
  });

  return result;
}

async function walk(
  dir: string,
  visit: (filePath: string, baseName: string) => Promise<void>,
): Promise<void> {
  let entries: import("node:fs").Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return;
    throw err;
  }

  for (const entry of entries) {
    if (SKIP_DIR_NAMES.has(entry.name)) continue;
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(entryPath, visit);
    } else if (entry.isFile()) {
      await visit(entryPath, entry.name);
    }
  }
}
