#!/usr/bin/env node
/**
 * create-monkey-proof — MPA をプロジェクトに導入し、各 AI ツールへ仕様作成スキル一式を展開する。
 *
 * このパッケージは MPA を **プロジェクト進行のフレーム** として配るためのもの。
 * 配るのは「思想（docs/concepts/）」「進行フェーズの素材（templates/）」「機械検証の workflow」など。
 * AI に規約や思想を記憶から再生させず、同梱した正本のスナップショット（assets/）を実ファイルとして配る。
 * これ自体が原則 P1「原本は一つ・参照する・複製しない」の実践。
 *
 * 現時点のスコープ（最小化中）:
 *   - 引数フラグで target / tools / dir を指定（対話 UI は今後）
 *   - 思想（docs/concepts/）と spec 雛形・CI ワークフローを全プロジェクトに配置
 *   - Claude / Codex 向けに mpa-spec スキルを展開
 *   - Gemini / Generic 向けの入口は今後
 *   - 既存ファイルは上書きせずスキップして報告
 *   - 最後に sanity check して配置結果を報告
 */

import { cp, mkdir, stat, chmod, readFile, writeFile } from "node:fs/promises";
import { existsSync, realpathSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
// dist/cli.js から見た assets/。build 時に copy-assets.mjs が用意する。
const ASSETS_DIR = resolve(here, "..", "assets");

/** 導入先の種別 */
type Target = "new" | "existing";

/** 展開先の AI ツール */
type Tool = "claude" | "gemini" | "codex" | "generic";

const ALL_TOOLS: Tool[] = ["claude", "gemini", "codex", "generic"];

/**
 * 正本（assets/）→ 各ツールの正規パスへの展開マップ。
 *
 * MPA はプロジェクト進行のフレームとして配る。判断基準・思想は原本を読ませる。
 * 各ツール側のブリッジは原本を参照する薄い1枚にする（原則 P1）。
 *
 * 現時点では Claude / Codex 向けに mpa-spec を最小提供する。
 * Gemini / Generic 向けは新スコープに合わせて再設計予定。
 */
const BRIDGE_MAP: Record<Tool, { from: string; to: string }[]> = {
  claude: [
    { from: "templates/skills/mpa-spec/SKILL.md", to: ".claude/skills/mpa-spec/SKILL.md" },
    {
      from: "templates/skills/mpa-spec/agents/gap-finder.md",
      to: ".claude/skills/mpa-spec/agents/gap-finder.md",
    },
  ],
  gemini: [
    // 新スコープ向けに再設計予定
  ],
  codex: [
    { from: "templates/skills/mpa-spec/SKILL.md", to: ".agents/skills/mpa-spec/SKILL.md" },
    {
      from: "templates/skills/mpa-spec/agents/gap-finder.md",
      to: ".agents/skills/mpa-spec/agents/gap-finder.md",
    },
  ],
  generic: [
    // 新スコープ向けに再設計予定
  ],
};

/**
 * 全ツール共通で配るブリッジ。
 *
 * - templates/github/workflows/   spec lint / TODO 連携の CI ワークフロー。
 *                                 ロジック本体は npm 上の @monkey-proof/spec-tools を npx で参照する。
 * - templates/spec/               spec の雛形（README / _template.md / _template.todo.md）。
 */
const COMMON_BRIDGES: { from: string; to: string }[] = [
  { from: "templates/github/workflows/spec-lint.yml", to: ".github/workflows/spec-lint.yml" },
  { from: "templates/github/workflows/spec-todo-issue.yml", to: ".github/workflows/spec-todo-issue.yml" },
  { from: "templates/github/workflows/spec-todo-cleanup.yml", to: ".github/workflows/spec-todo-cleanup.yml" },
  { from: "templates/github/workflows/README.md", to: ".github/workflows/README.md" },
  { from: "templates/spec/README.md", to: "docs/spec/README.md" },
  { from: "templates/spec/_template.md", to: "docs/spec/_template.md" },
  { from: "templates/spec/_template.todo.md", to: "docs/spec/_template.todo.md" },
];

/**
 * 思想と進め方の原本（docs/concepts/）はディレクトリごと配布先の docs/concepts/ に置く。
 * 配布先でも本物を読ませる前提。
 */
const DOCS_CONCEPTS = { from: "docs/concepts", to: "docs/concepts" };

/** 実行ビット 0755 を保つべき配置先（to）の集合。現時点は空。将来 hook 復活時に使う。 */
const EXECUTABLE_TARGETS = new Set<string>([]);

interface Options {
  target: Target;
  tools: Tool[];
  cwd: string;
}

interface PlacementResult {
  /** 配置先（cwd からの相対 to） */
  to: string;
  status: "created" | "skipped-exists";
}

const HELP = `create-monkey-proof — MPA をプロジェクトに導入する

使い方:
  npx create-monkey-proof [options]

options:
  --tools=<list>   展開する AI ツール（カンマ区切り）。既定: claude
                   選択肢: ${ALL_TOOLS.join(", ")} / all
  --target=<t>     new | existing。既定: new
  --dir=<path>     導入先ディレクトリ。既定: カレント
  -h, --help       このヘルプを表示

例:
  npx create-monkey-proof --tools=claude
  npx create-monkey-proof --tools=claude,codex --dir=./my-app
  npx create-monkey-proof --tools=all
`;

/** 引数を Options に。不正値は例外。 */
function parseArgs(argv: string[]): Options | "help" {
  let target: Target = "new";
  let tools: Tool[] = ["claude"];
  let cwd = process.cwd();

  for (const arg of argv) {
    if (arg === "-h" || arg === "--help") return "help";

    const eq = arg.indexOf("=");
    const key = eq >= 0 ? arg.slice(0, eq) : arg;
    const val = eq >= 0 ? arg.slice(eq + 1) : "";

    switch (key) {
      case "--tools": {
        const requested = val.split(",").map((s) => s.trim()).filter(Boolean);
        if (requested.length === 1 && requested[0] === "all") {
          tools = [...ALL_TOOLS];
          break;
        }
        const invalid = requested.filter((t) => !ALL_TOOLS.includes(t as Tool));
        if (invalid.length > 0) {
          throw new Error(`未知のツール: ${invalid.join(", ")}（選択肢: ${ALL_TOOLS.join(", ")}, all）`);
        }
        // 重複除去しつつ順序保持
        tools = [...new Set(requested)] as Tool[];
        break;
      }
      case "--target": {
        if (val !== "new" && val !== "existing") {
          throw new Error(`--target は new | existing（受け取った値: "${val}"）`);
        }
        target = val;
        break;
      }
      case "--dir": {
        if (!val) throw new Error("--dir には path が必要です");
        cwd = resolve(process.cwd(), val);
        break;
      }
      default:
        throw new Error(`未知の引数: ${arg}\n\n${HELP}`);
    }
  }

  if (tools.length === 0) throw new Error("--tools に少なくとも1つ指定してください");
  return { target, tools, cwd };
}

/** assets/ が存在し、想定の中身があるか確認（ビルド漏れの早期検出） */
function assertAssets(): void {
  if (!existsSync(ASSETS_DIR)) {
    throw new Error(
      `assets/ が見つかりません: ${ASSETS_DIR}\n` +
        `配布物が壊れています。npm run build（copy-assets）を実行してから配布してください。`,
    );
  }
  for (const name of ["docs", "templates"]) {
    if (!existsSync(join(ASSETS_DIR, name))) {
      throw new Error(`assets/${name}/ がありません。配布物が不完全です。`);
    }
  }
}

/**
 * 1つのブリッジ（from→to）を配置する。
 * - 既存ファイルがあれば作らずスキップ（最小版は上書きしない）
 * - 実行ビット対象なら 0755 を付与
 */
async function placeOne(
  from: string,
  to: string,
  cwd: string,
): Promise<PlacementResult> {
  const src = join(ASSETS_DIR, from);
  const dest = join(cwd, to);

  if (existsSync(dest)) {
    return { to, status: "skipped-exists" };
  }

  await mkdir(dirname(dest), { recursive: true });
  await cp(src, dest);

  if (EXECUTABLE_TARGETS.has(to)) {
    await chmod(dest, 0o755);
  }

  return { to, status: "created" };
}

/** docs/concepts/ をディレクトリごと配置（既存ならスキップ） */
async function placeDocsConcepts(cwd: string): Promise<PlacementResult> {
  const dest = join(cwd, DOCS_CONCEPTS.to);
  if (existsSync(dest)) {
    return { to: DOCS_CONCEPTS.to + "/", status: "skipped-exists" };
  }
  await cp(join(ASSETS_DIR, DOCS_CONCEPTS.from), dest, { recursive: true });
  return { to: DOCS_CONCEPTS.to + "/", status: "created" };
}

/** 生成後の sanity check。期待した配置先が実在するか。 */
async function sanityCheck(
  cwd: string,
  results: PlacementResult[],
): Promise<string[]> {
  const problems: string[] = [];
  for (const r of results) {
    // ディレクトリ表記（末尾 /）は除いて存在確認
    const rel = r.to.endsWith("/") ? r.to.slice(0, -1) : r.to;
    const p = join(cwd, rel);
    if (!existsSync(p)) {
      problems.push(`配置されているはずのパスが見つかりません: ${r.to}`);
      continue;
    }
    if (EXECUTABLE_TARGETS.has(r.to)) {
      const st = await stat(p);
      if (!(st.mode & 0o111)) {
        problems.push(`実行ビットが立っていません: ${r.to}`);
      }
    }
  }
  return problems;
}

async function run(opts: Options): Promise<void> {
  assertAssets();

  if (!existsSync(opts.cwd)) {
    await mkdir(opts.cwd, { recursive: true });
  }

  console.log(`MPA を導入します`);
  console.log(`  導入先: ${opts.cwd}`);
  console.log(`  target: ${opts.target}`);
  console.log(`  tools:  ${opts.tools.join(", ")}`);
  console.log("");

  const results: PlacementResult[] = [];

  // 思想と進め方の原本（全プロジェクト共通）
  results.push(await placeDocsConcepts(opts.cwd));

  // 全ツール共通の workflow と spec 雛形
  for (const bridge of COMMON_BRIDGES) {
    results.push(await placeOne(bridge.from, bridge.to, opts.cwd));
  }

  // 選択ツールごとのブリッジ
  for (const tool of opts.tools) {
    for (const bridge of BRIDGE_MAP[tool]) {
      results.push(await placeOne(bridge.from, bridge.to, opts.cwd));
    }
  }

  // 結果報告
  const created = results.filter((r) => r.status === "created");
  const skipped = results.filter((r) => r.status === "skipped-exists");

  console.log(`配置: ${created.length} 件 / スキップ（既存）: ${skipped.length} 件`);
  for (const r of created) console.log(`  + ${r.to}`);
  for (const r of skipped) console.log(`  = ${r.to}（既存のため変更なし）`);
  console.log("");

  // sanity check
  const problems = await sanityCheck(opts.cwd, results);
  if (problems.length > 0) {
    console.error("sanity check で問題を検出しました:");
    for (const p of problems) console.error(`  ! ${p}`);
    process.exitCode = 1;
    return;
  }

  // 起動方法の案内
  console.log("導入が完了しました。次の手順:");
  console.log("  1. docs/concepts/mpa.md を読む（MPA の思想）");
  console.log("  2. docs/concepts/workflow.md を読む（進め方の骨格）");
  if (opts.tools.includes("claude")) {
    console.log("  3. Claude Code: /mpa-spec を叩いて仕様作成を開始");
  }
  if (opts.tools.includes("codex")) {
    console.log("  3. Codex: mpa-spec スキルを呼び出して仕様作成を開始");
  }
  if (opts.tools.includes("gemini") || opts.tools.includes("generic")) {
    console.log("  3. このツール向けの入口は再設計中です。docs/concepts/ を AI に読ませて作業してください。");
  }
}

/** CLI として直接実行されたときの入口。テストから import した場合は走らない。 */
function main(): void {
  const parsed = (() => {
    try {
      return parseArgs(process.argv.slice(2));
    } catch (err) {
      console.error((err as Error).message);
      process.exit(2);
    }
  })();

  if (parsed === "help") {
    console.log(HELP);
    process.exit(0);
  }

  run(parsed).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

/**
 * このファイルが「CLI として直接実行された」かを判定する。
 *
 * npx / グローバル install では node_modules/.bin/create-monkey-proof という
 * symlink 経由で起動され、process.argv[1] は symlink のパスになる。
 * 一方 import.meta.url は実体（dist/cli.js）を指す。
 * 単純比較だと両者が一致せず main() が呼ばれない（= 無言で終了するバグ）。
 * そこで argv[1] を realpath で解決してから比較する。
 */
function isMainModule(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  const self = fileURLToPath(import.meta.url);
  try {
    return self === realpathSync(entry);
  } catch {
    // entry が解決できない場合は素の resolve でフォールバック
    return self === resolve(entry);
  }
}

if (isMainModule()) {
  main();
}

export {
  BRIDGE_MAP,
  COMMON_BRIDGES,
  DOCS_CONCEPTS,
  HELP,
  parseArgs,
  run,
  type Tool,
  type Target,
  type Options,
};
