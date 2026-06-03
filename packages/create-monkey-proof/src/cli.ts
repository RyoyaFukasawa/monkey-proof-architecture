#!/usr/bin/env node
/**
 * create-monkey-proof — MPA を新規/既存プロジェクトに導入し、使う AI ツールへ /mpa 一式を展開する。
 *
 * 旧 `/mpa-init`（AI に手順を喋らせていた進行表）を、決定的なコードへ昇格したもの。
 * AI の記憶から規約を再生成せず、同梱した「正本のスナップショット」(assets/) を実ファイルとして配る。
 * これ自体が MPA P2「複製しない／正本を参照する」の実践。
 *
 * この版は「最小・新規導入が確実に動く」スコープ：
 *   - 引数フラグで target / tools / dir を指定（対話 UI は今後）
 *   - BRIDGE_MAP + CONSTITUTION に沿って assets/ を実ファイルとして配置
 *   - 既存ファイルは上書きせずスキップして報告（衝突解決の対話は今後）
 *   - hooks/bin/*.sh は実行ビット 0755 を維持
 *   - 最後に sanity check して、配置結果と各ツールでの /mpa 起動方法を報告
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
 * 規約の実体は複製せず、各ブリッジは constitution/ を参照する薄い1枚にする（P2）。
 *
 * 正本側:
 *   assets/templates/skills/{mpa,mpa-guard,mpa-doctor}/SKILL.md
 *   assets/templates/commands/{mpa,mpa-check,mpa-review,mpa-doctor}.md
 *   assets/templates/hooks/{bin/*.sh, settings.example.json}
 *   assets/templates/{CLAUDE.md,GEMINI.md,AGENTS.md}
 *   assets/constitution/**            （規約の実体。そのまま配置）
 */
const BRIDGE_MAP: Record<Tool, { from: string; to: string }[]> = {
  claude: [
    { from: "templates/skills/mpa/SKILL.md", to: ".claude/skills/mpa/SKILL.md" },
    { from: "templates/skills/mpa-guard/SKILL.md", to: ".claude/skills/mpa-guard/SKILL.md" },
    { from: "templates/skills/mpa-doctor/SKILL.md", to: ".claude/skills/mpa-doctor/SKILL.md" },
    { from: "templates/commands/mpa-check.md", to: ".claude/commands/mpa-check.md" },
    { from: "templates/commands/mpa-review.md", to: ".claude/commands/mpa-review.md" },
    { from: "templates/commands/mpa-doctor.md", to: ".claude/commands/mpa-doctor.md" },
    { from: "templates/CLAUDE.md", to: "CLAUDE.md" },
    { from: "templates/hooks/bin/mpa-pre-write.sh", to: ".claude/hooks/bin/mpa-pre-write.sh" },
    { from: "templates/hooks/bin/mpa-stop-review.sh", to: ".claude/hooks/bin/mpa-stop-review.sh" },
    // hooks/bin/*.sh は実行ビット 0755 を保って配置する（settings.example.json が
    // $CLAUDE_PROJECT_DIR/.claude/hooks/bin/*.sh を参照する前提）。
    { from: "templates/hooks/settings.example.json", to: ".claude/settings.example.json" },
  ],
  gemini: [
    { from: "templates/commands/mpa.md", to: ".gemini/commands/mpa.toml" }, // md→toml 変換
    { from: "templates/commands/mpa-check.md", to: ".gemini/commands/mpa-check.toml" },
    { from: "templates/commands/mpa-review.md", to: ".gemini/commands/mpa-review.toml" },
    { from: "templates/commands/mpa-doctor.md", to: ".gemini/commands/mpa-doctor.toml" },
    { from: "templates/GEMINI.md", to: "GEMINI.md" },
  ],
  codex: [
    { from: "templates/skills/mpa/SKILL.md", to: ".agents/skills/mpa/SKILL.md" },
    { from: "templates/skills/mpa-guard/SKILL.md", to: ".agents/skills/mpa-guard/SKILL.md" },
    { from: "templates/skills/mpa-doctor/SKILL.md", to: ".agents/skills/mpa-doctor/SKILL.md" },
    { from: "templates/AGENTS.md", to: "AGENTS.md" },
  ],
  generic: [
    { from: "templates/AGENTS.md", to: "AGENTS.md" },
  ],
};

/** constitution/ は全ツール共通で必ずそのまま配置（規約の実体） */
const CONSTITUTION = { from: "constitution", to: "constitution" };

/** hooks/bin の実行ビットを保つべき配置先（to）の集合 */
const EXECUTABLE_TARGETS = new Set<string>([
  ".claude/hooks/bin/mpa-pre-write.sh",
  ".claude/hooks/bin/mpa-stop-review.sh",
]);

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

const HELP = `create-monkey-proof — MPA を導入する

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
  npx create-monkey-proof --tools=claude,gemini --dir=./my-app
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
        `配布物が壊れています。npm run build（copy-assets）を実行してから配布してください。`
    );
  }
  for (const name of ["constitution", "templates"]) {
    if (!existsSync(join(ASSETS_DIR, name))) {
      throw new Error(`assets/${name}/ がありません。配布物が不完全です。`);
    }
  }
}

/**
 * md の frontmatter（description）と本文を、Gemini の command toml へ変換する。
 * Gemini commands は { description, prompt } の toml を期待する。
 */
function mdToToml(md: string): string {
  let description = "";
  let body = md;

  const fm = md.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (fm) {
    const front = fm[1];
    body = fm[2];
    const descLine = front.match(/^description:\s*(.*)$/m);
    if (descLine) description = descLine[1].trim();
  }

  const tomlEscape = (s: string) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const lines: string[] = [];
  if (description) lines.push(`description = "${tomlEscape(description)}"`);
  // 本文は複数行リテラル。toml の """ と衝突しないよう、本文中の """ を退避。
  const safeBody = body.replace(/"""/g, '\\"\\"\\"');
  lines.push(`prompt = """\n${safeBody.trim()}\n"""`);
  return lines.join("\n") + "\n";
}

/**
 * 1つのブリッジ（from→to）を配置する。
 * - 既存ファイルがあれば作らずスキップ（最小版は上書きしない）
 * - .toml 変換が必要なら mdToToml を通す
 * - 実行ビット対象なら 0755 を付与
 */
async function placeOne(
  from: string,
  to: string,
  cwd: string
): Promise<PlacementResult> {
  const src = join(ASSETS_DIR, from);
  const dest = join(cwd, to);

  if (existsSync(dest)) {
    return { to, status: "skipped-exists" };
  }

  await mkdir(dirname(dest), { recursive: true });

  if (to.endsWith(".toml") && from.endsWith(".md")) {
    const md = await readFile(src, "utf8");
    await writeFile(dest, mdToToml(md), "utf8");
  } else {
    await cp(src, dest);
  }

  if (EXECUTABLE_TARGETS.has(to)) {
    await chmod(dest, 0o755);
  }

  return { to, status: "created" };
}

/** constitution/ ディレクトリを配置（既存ならスキップ） */
async function placeConstitution(cwd: string): Promise<PlacementResult> {
  const dest = join(cwd, CONSTITUTION.to);
  if (existsSync(dest)) {
    return { to: CONSTITUTION.to + "/", status: "skipped-exists" };
  }
  await cp(join(ASSETS_DIR, CONSTITUTION.from), dest, { recursive: true });
  return { to: CONSTITUTION.to + "/", status: "created" };
}

/** 生成後の sanity check。期待した配置先が実在するか。 */
async function sanityCheck(
  cwd: string,
  results: PlacementResult[]
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

  // 規約の実体（全ツール共通）
  results.push(await placeConstitution(opts.cwd));

  // 選択ツールごとのブリッジ。重複 to（複数ツールが同じ AGENTS.md 等）は
  // 既存スキップで自然に1回だけ created になる。
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
  console.log("  1. constitution/ を読む（MPA の規約の実体）");
  if (opts.tools.includes("claude")) {
    console.log("  2. Claude Code: /mpa を叩いて作業を開始");
    console.log("     hooks を有効化する場合は .claude/settings.example.json の hooks ブロックを");
    console.log("     .claude/settings.json へマージしてください。");
  }
  if (opts.tools.includes("gemini")) {
    console.log("  2. Gemini: /mpa を叩いて作業を開始");
  }
  if (opts.tools.includes("codex") || opts.tools.includes("generic")) {
    console.log("  2. AGENTS.md を読ませてから作業を開始");
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
  CONSTITUTION,
  HELP,
  parseArgs,
  mdToToml,
  run,
  type Tool,
  type Target,
  type Options,
};
