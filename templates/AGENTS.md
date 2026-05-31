<!-- MPA:BEGIN — このブロックは create-monkey-proof が管理。再実行で置換される。手で書くなら外で。 -->
# AGENTS.md — MPA リポジトリの AI エージェント向け入口

> このファイルは **薄い入口**。規約の実体は持たない（MPA 原則 P2）。
> Codex / Gemini CLI / Cursor など AGENTS.md を読む全ツール共通の入口。

## まず読むこと

このリポジトリのアーキテクチャ規約は **[`constitution/`](constitution/README.md)** に集約されている。
人間も AI も同じこの規約を読む。コードを読む/書く/レビューする前に
[`constitution/README.md`](constitution/README.md)（地図）から入ること。

## 作業の入口

**作業を始めるときは、`/mpa` 相当の進行表（`.agents/skills/mpa/SKILL.md`）に従う。**
新規/修正/リファクタを対話で聞き、必要な MPA 手順（SR-1〜SR-4）を代行運転し、実装/修正まで案内する。

- 生成時チェック: [`constitution/checklists/before-writing.md`](constitution/checklists/before-writing.md)
- レビュー時チェック: [`constitution/checklists/before-merge.md`](constitution/checklists/before-merge.md)
- SR 判定の実行器: `.agents/skills/mpa-guard/SKILL.md`

**起動方法**：Codex なら `/skills` セレクタまたは `$mpa` メンションで mpa スキルを起動する
（`/mpa` 直叩きの可否は環境差あり）。スラッシュコマンドの仕組みが無い/展開前なら、
この AGENTS.md に従い `.agents/skills/mpa/SKILL.md` の進行表を直接たどる。

## してはいけないこと

- 規約をこのファイルや各ツール版に**コピーしない**。常に `constitution/` を**参照**する。
- 機械で縛れるルール（依存方向・命名）を AI が再判定しない。lint の結果を信頼する。
- 「迷ったまま書く」をしない。配置に迷えば [`constitution/10-structure.md`](constitution/10-structure.md) を読む。
<!-- MPA:END -->
