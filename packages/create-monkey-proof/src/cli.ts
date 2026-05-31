#!/usr/bin/env node
/**
 * create-monkey-proof — MPA を新規/既存プロジェクトに導入し、使う AI ツールへ /mpa 一式を展開する。
 *
 * 旧 `/mpa-init`（AI に手順を喋らせていた進行表）を、決定的なコードへ昇格したもの。
 * AI の記憶から規約を再生成せず、同梱した「正本のスナップショット」(assets/) を実ファイルとして配る。
 * これ自体が MPA P2「複製しない／正本を参照する」の実践。
 *
 * ※ これはプロトタイプの骨格です。対話 UI（prompts 等）と衝突解決の実体は今後実装します。
 */

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
// dist/cli.js から見た assets/。build 時に copy-assets.mjs が用意する。
const ASSETS_DIR = resolve(here, "..", "assets");

/** 導入先の種別 */
type Target = "new" | "existing";

/** 展開先の AI ツール */
type Tool = "claude" | "gemini" | "codex" | "generic";

/**
 * 正本（assets/）→ 各ツールの正規パスへの展開マップ。
 * 規約の実体は複製せず、各ブリッジは constitution/ を参照する薄い1枚にする（P2）。
 *
 * 正本側:
 *   assets/templates/skills/{mpa,mpa-guard}/SKILL.md
 *   assets/templates/commands/{mpa,mpa-check,mpa-review}.md
 *   assets/templates/hooks/{bin/*.sh, settings.example.json}
 *   assets/templates/{CLAUDE.md,GEMINI.md,AGENTS.md}
 *   assets/constitution/**            （規約の実体。そのまま配置）
 */
const BRIDGE_MAP: Record<Tool, { from: string; to: string }[]> = {
  claude: [
    { from: "templates/skills/mpa/SKILL.md", to: ".claude/skills/mpa/SKILL.md" },
    { from: "templates/skills/mpa-guard/SKILL.md", to: ".claude/skills/mpa-guard/SKILL.md" },
    { from: "templates/commands/mpa-check.md", to: ".claude/commands/mpa-check.md" },
    { from: "templates/commands/mpa-review.md", to: ".claude/commands/mpa-review.md" },
    { from: "templates/CLAUDE.md", to: "CLAUDE.md" },
    { from: "templates/hooks/bin/mpa-pre-write.sh", to: ".claude/hooks/bin/mpa-pre-write.sh" },
    { from: "templates/hooks/bin/mpa-stop-review.sh", to: ".claude/hooks/bin/mpa-stop-review.sh" },
    // hooks/bin/*.sh は実行ビット 0755 を保って配置する（settings.example.json が
    // $CLAUDE_PROJECT_DIR/.claude/hooks/bin/*.sh を参照する前提）。
    // templates/hooks/settings.example.json は .claude/settings.json へマージ（PreToolUse/Stop に重複ガード付き追記）。
  ],
  gemini: [
    { from: "templates/commands/mpa.md", to: ".gemini/commands/mpa.toml" }, // md→toml 変換
    { from: "templates/commands/mpa-check.md", to: ".gemini/commands/mpa-check.toml" },
    { from: "templates/commands/mpa-review.md", to: ".gemini/commands/mpa-review.toml" },
    { from: "templates/GEMINI.md", to: "GEMINI.md" },
  ],
  codex: [
    { from: "templates/skills/mpa/SKILL.md", to: ".agents/skills/mpa/SKILL.md" },
    { from: "templates/skills/mpa-guard/SKILL.md", to: ".agents/skills/mpa-guard/SKILL.md" },
    { from: "templates/AGENTS.md", to: "AGENTS.md" }, // MPA:BEGIN/END ブロックで冪等追記
  ],
  generic: [
    { from: "templates/AGENTS.md", to: "AGENTS.md" },
  ],
};

/** constitution/ は全ツール共通で必ずそのまま配置（規約の実体） */
const CONSTITUTION = { from: "constitution", to: "constitution" };

interface Options {
  target: Target;
  tools: Tool[];
  cwd: string;
}

async function run(_opts: Options): Promise<void> {
  // TODO(prototype): 実装予定の流れ
  //
  // Phase A — 立ち上げ先を決める（新規/既存）
  //   新規:  assets/constitution, assets/templates の入口 + README/.gitignore 雛形を配置
  //   既存:  ファイル単位で存在チェックし欠落のみ補完。
  //          内容差分があれば diff 提示 → [skip / 上書き / .bak 退避] を対話で選ばせる。
  //          .gitignore は MPA 必須行（.claude/*.lock 等）を末尾追記（重複なし）。
  //
  // Phase B — 使う AI ツールを選ぶ（複数選択可: claude/gemini/codex/generic）
  //
  // Phase C — BRIDGE_MAP に沿って各ツールの正規パスへ展開
  //   - 各ブリッジは constitution/ を参照する薄い1枚（規約を複製しない）
  //   - description は assets/templates/skills/mpa/SKILL.md の frontmatter から決定的に転記
  //   - hooks（claude選択時）: settings.example.json を settings.json へマージ、bin/*.sh は 0755 維持
  //   - 入口 md（CLAUDE/GEMINI/AGENTS）は <!-- MPA:BEGIN/END --> で冪等追記。AGENTS は1ファイル1ブロック
  //
  // Phase D — 生成後の sanity check
  //   - 生成ファイルが実在 / SKILL に name+description / hook の実行ビット / constitution 参照先が実在
  //
  // 出力: 配置・補完したファイル、衝突時の選択結果、各ツールでの /mpa 起動方法を報告
  console.log("create-monkey-proof (prototype)");
  console.log("assets:", ASSETS_DIR);
  console.log("TODO: 対話フローと展開ロジックを実装する");
}

// エントリポイント（引数パースは今後 prompts/clack 等で対話化）
run({ target: "new", tools: ["claude"], cwd: process.cwd() }).catch((err) => {
  console.error(err);
  process.exit(1);
});

export { BRIDGE_MAP, CONSTITUTION, type Tool, type Target, type Options };
