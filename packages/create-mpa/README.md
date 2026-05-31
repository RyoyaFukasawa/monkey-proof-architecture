# create-mpa

**MPA (Monkey-Proof Architecture) を新規/既存プロジェクトに導入する CLI。**

```bash
npm create mpa@latest
# or
npx create-mpa
```

対話で「新規/既存」「使う AI ツール（Claude Code / Gemini CLI / Codex / 汎用）」を聞き、
`constitution/`（規約の実体）と各ツール用ブリッジ（`/mpa` 一式）を配置する。

---

## 設計：正本を複製せず「同梱したスナップショット」を配る（MPA P2）

create-mpa の心臓は **「規約の文章を二重管理しない」**（MPA 原則 P2）こと。

- **唯一の正本は mpa リポジトリの [`constitution/`](../../constitution/) と [`templates/`](../../templates/) だけ。**
- `create-mpa` は AI の記憶から規約を**再生成しない**。`build` 時に正本を `assets/` へコピーして同梱し、
  実行時はその**実ファイル**をユーザーのプロジェクトへ配る。
- npm に載るのは「ある時点の正本の影（スナップショット）」であって、手書きの複製ではない。
  → ユーザーの `npx create-mpa` は**ネット越し clone 不要**（速い・本家 URL 固定の脆さがない）。

```
mpa repo (唯一の正本)
  constitution/  templates/
        │ build 時に copy-assets.mjs が取り込む（assets/ は .gitignore 済み）
        ▼
  packages/create-mpa/assets/   ← publish に同梱されるスナップショット
        │ npx create-mpa
        ▼
  ユーザーのプロジェクト   .claude/ .gemini/ AGENTS.md … + constitution/
```

これは Capability Map と同じ「**導出するから腐らない**」原則
（[`../../constitution/40-discovery.md`](../../constitution/40-discovery.md)）をリリースパイプラインへ広げたもの。
正本を直したら publish し直すだけで、配布物に反映される。

---

## やること（Phase A〜D）

各 AI ツールはコマンド/スキルを**別々の場所・別々の形式**で探す。だから「正本を各ツールの正規パスへ
ブリッジ展開する」必要がある。各ブリッジは規約を複製せず `constitution/` を**参照**する薄い1枚にする（P2）。

### Phase A — 立ち上げ先（新規 / 既存）
- **新規** → `constitution/` + 入口雛形 + `README.md`/`.gitignore` 雛形を配置。
- **既存** → ファイル単位で存在チェックし**欠落のみ補完**。内容差分があれば diff を提示し
  **[skip / 上書き / .bak 退避]** を対話で選ばせる。`.gitignore` は MPA 必須行
  （`.claude/scheduled_tasks.lock`, `.claude/*.lock`）を末尾追記（重複なし）。

### Phase B — 使う AI ツールを選ぶ（複数可）
Claude Code / Gemini CLI / Codex / 汎用（AGENTS.md のみ）。

### Phase C — 各ツールの正規パスへ展開（`src/cli.ts` の `BRIDGE_MAP`）

| 正本（assets/） | Claude Code | Gemini CLI | Codex | 汎用 |
|---|---|---|---|---|
| `templates/skills/mpa/SKILL.md` | `.claude/skills/mpa/SKILL.md` | `.gemini/commands/mpa.toml` | `.agents/skills/mpa/SKILL.md` | （AGENTS.md が指す） |
| `templates/skills/mpa-guard/SKILL.md` | `.claude/skills/mpa-guard/SKILL.md` | （`mpa.toml` 内で手順参照） | `.agents/skills/mpa-guard/SKILL.md` | （同左） |
| `templates/commands/mpa-check.md` | `.claude/commands/mpa-check.md` | `.gemini/commands/mpa-check.toml` | （mpa-guard が内包） | — |
| `templates/commands/mpa-review.md` | `.claude/commands/mpa-review.md` | `.gemini/commands/mpa-review.toml` | （mpa-guard が内包） | — |
| 入口（薄い） | `CLAUDE.md` | `GEMINI.md` | `AGENTS.md` | `AGENTS.md` |
| hook | `.claude/settings.json`（`templates/hooks/settings.example.json` をマージ） | — | — | — |

**ツール差の注記**：
- **Claude**: `/mpa` は command を作らず、**skill ディレクトリ名 `mpa` = `/mpa` 起動**で代替。
- **Codex**: 独立した check/review コマンドは作らず、`mpa-guard` skill のモード1/2 が内包。
- **Gemini**: `mpa-guard` 単独コマンドは作らず、`mpa.toml` の prompt から手順をインライン参照。

**description の生成規則**：各ツール版 frontmatter の `description` は、正本
`templates/skills/mpa/SKILL.md` の description から**決定的に転記**する（Claude は自動発火に使うので全文一致。
Codex/Gemini は長さ制約で短縮可だが正本から導出）。トリガ用メタデータであり P2 の複製禁止には当たらない。

**入口ファイルの冪等追記**：`CLAUDE.md`/`GEMINI.md`/`AGENTS.md` への MPA 記述は
`<!-- MPA:BEGIN --> … <!-- MPA:END -->` で囲む。既存ブロックは置換、無ければ末尾追記（再実行で重複しない）。
`AGENTS.md` は Codex と汎用のどちらが選ばれても1ファイル・1ブロックだけ生成。

**hook（Claude 選択時のみ）**：`templates/hooks/settings.example.json` の hooks ブロックを
`.claude/settings.json` へマージ（`PreToolUse`/`Stop` 配列に重複ガード付き追記、上書きしない）。
`templates/hooks/bin/*.sh` は**実行ビット 0755 を保って**配置。

### Phase D — 生成後の sanity check
生成ファイルが実在 / SKILL に `name`+`description` / hook の実行ビット / 入口 md が参照する
`constitution/` のファイルが実在、を確認してから報告する。

---

## 開発

```bash
npm run build   # tsc + copy-assets（repo ルートの constitution/ + templates/ を assets/ へ取り込む）
npm run dev     # tsx で src/cli.ts を直接実行
```

> `assets/` は build 生成物。git には含めない（`.gitignore` 済み）。正本は常に repo ルートの
> `constitution/` と `templates/` だけ。
