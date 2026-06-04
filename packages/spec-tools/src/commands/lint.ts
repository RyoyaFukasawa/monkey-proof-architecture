#!/usr/bin/env node
/**
 * mpa-spec-lint
 *
 * 使い方:
 *   mpa-spec-lint <spec ディレクトリ>
 *
 * 例:
 *   mpa-spec-lint docs/spec
 *   mpa-spec-lint examples/spec
 *
 * 違反があれば非ゼロで終了する（CI で落とせる）。
 */

import process from "node:process";
import { formatLintIssues, hasErrors, runLint } from "../lint/runner.js";

async function main(): Promise<void> {
  const target = process.argv[2];
  if (!target) {
    console.error("usage: mpa-spec-lint <spec ディレクトリ>");
    process.exit(2);
  }

  const issues = await runLint(target);
  console.log(formatLintIssues(issues));

  process.exit(hasErrors(issues) ? 1 : 0);
}

main().catch((err) => {
  console.error("mpa-spec-lint failed:", err);
  process.exit(2);
});
