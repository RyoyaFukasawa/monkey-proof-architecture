# CLAUDE.md

> このファイルは **薄い入口** です。規約の実体は持ちません（MPA 原則 P2）。

## 最初に読むこと

このリポジトリのアーキテクチャ規約は **`constitution/`** に集約されています。
人間も AI も、**同じこの規約**を読みます（人間用とAI用を分けない）。

**コードを読む / 書く / レビューする前に、必ず以下を読んでください：**

1. [`constitution/00-principles.md`](constitution/00-principles.md) — なぜこの構造か（MPA の 4 原則）
2. [`constitution/10-structure.md`](constitution/10-structure.md) — FSD / CleanArch の配置ルール
3. [`constitution/20-semantic-rules.md`](constitution/20-semantic-rules.md) — **機械で縛れないルール（MPA の心臓）**
4. [`constitution/30-naming.md`](constitution/30-naming.md) — 命名規約
5. [`constitution/40-discovery.md`](constitution/40-discovery.md) — 既存機能の探し方（SR-1 を実際に効かせる仕組み）
6. [`constitution/50-enforcement.md`](constitution/50-enforcement.md) — ルールの強制方法（多層防御・hook・機械検証）

## 振る舞いの指示

### コードを書く前
[`constitution/checklists/before-writing.md`](constitution/checklists/before-writing.md) を通すこと。
特に **SR-1（同じ機能を二度作らない）** を必ず確認する。
書く前に [`constitution/40-discovery.md`](constitution/40-discovery.md) の手順で既存を探す
（Capability Map = 公開 `index.ts` ＋ `shared`/`application/shared` の直走査 を引き、必要なら `find-shared` Skill で意味的類似を拾う）。

### コードをレビューするとき
[`constitution/checklists/before-merge.md`](constitution/checklists/before-merge.md) を通すこと。
**根拠なき指摘をしない。グレーは断定せず人間に委ねる。**

### 実行支援
- `mpa-guard` Skill（[`.ai/skills/mpa-guard/SKILL.md`](.ai/skills/mpa-guard/SKILL.md)）が生成時/レビュー時の SR チェックを担う。
- slash command: `/mpa-check`（書く前）、`/mpa-review`（マージ前）。
- これらは規約を**複製せず参照する**。判断基準は常に `constitution/` 側にある。

## してはいけないこと

- 規約をこのファイルや Skill に**コピーしない**。常に `constitution/` を**参照**する。
- 機械で縛れるルール（依存方向・命名）を AI が再判定しない。lint の結果を信頼する。
- 「迷ったまま書く」をしない。配置に迷ったら `10-structure.md` を読み、それでも迷えば人間に聞く。
