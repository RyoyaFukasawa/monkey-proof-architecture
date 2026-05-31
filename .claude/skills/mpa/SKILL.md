---
name: mpa
description: MPA リポジトリで作業を始めるときの推奨入口。叩くと対話で「新規実装/修正/リファクタ」のどれかを聞き、その作業に必要な MPA の手順（SR-1〜SR-4 のチェック）を質問形式で代行運転し、実装/修正まで案内する。説明書を読まなくても、考え方を知らなくても、これと対話するだけで MPA の手順に沿って実装を進められる。Use when starting ANY coding work in an MPA repo, or when the user runs /mpa, says "作業する", "実装したい", "直したい", "MPAで始める".
---

# mpa（Claude Code 版ブリッジ）

> このファイルは `npx create-mpa` が**正本から生成したブリッジ**。進行表の実体はコピーしない（腐るため）。
> 正本: [`templates/skills/mpa/SKILL.md`](../../../templates/skills/mpa/SKILL.md) ／ 規約: [`constitution/`](../../../constitution/README.md)

**やること**: 正本 [`templates/skills/mpa/SKILL.md`](../../../templates/skills/mpa/SKILL.md) を読み、その進行表（Phase 0→3）に**厳密に従って**、
ユーザーと対話しながら実装/修正まで案内する。判断基準は [`constitution/`](../../../constitution/README.md) を読んで適用する（複製しない）。

正本が更新されたら `npx create-mpa` を再実行すればこのブリッジも更新される。
