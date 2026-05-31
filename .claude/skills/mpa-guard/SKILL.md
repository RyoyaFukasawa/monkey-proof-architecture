---
name: mpa-guard
description: MPA (Monkey-Proof Architecture) の意味的ルール SR-1〜SR-4 を、生成時・レビュー時に強制する。コードを書く前/PR をレビューする時、「重複してないか」「1ファイル1責務か」「早すぎる共通化でないか」「レイヤー越えの語彙汚染がないか」を constitution/ の基準で判定する。Use when writing new code in an MPA repo, reviewing a diff, or when the user says "MPAチェック", "mpa-guard", or runs /mpa-check or /mpa-review.
---

# mpa-guard（Claude Code 版ブリッジ）

> このファイルは `npx create-mpa` が**正本から生成したブリッジ**。判定基準も手順もコピーしない（腐るため）。
> 正本: [`templates/skills/mpa-guard/SKILL.md`](../../../templates/skills/mpa-guard/SKILL.md) ／ 規約: [`constitution/`](../../../constitution/README.md)

**やること**: 正本 [`templates/skills/mpa-guard/SKILL.md`](../../../templates/skills/mpa-guard/SKILL.md) を読み、その手順で SR-1〜SR-4 を判定する。
判断基準は [`constitution/20-semantic-rules.md`](../../../constitution/20-semantic-rules.md)。根拠なき指摘をしない。グレーは人間に委ねる。
