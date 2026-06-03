---
name: mpa-doctor
description: MPA (Monkey-Proof Architecture) の L3（機械検証＝土台）が、このリポジトリに物理的に導入されているかを診断する。eslint / dependency-cruiser / knip / CI に「依存方向・公開API・命名・死コード」のガードが組み込まれているかを点検し、欠けている土台を報告する。コードの依存方向そのものは再判定しない（設定の有無だけ見る）。Use when checking whether the machine-enforced floor is set up in an MPA repo, or when the user says "L3 入ってる?", "土台できてる?", "機械ガードの点検", "mpa-doctor", or runs /mpa-doctor.
---

# mpa-doctor（Claude Code 版ブリッジ）

> このファイルは `npx create-monkey-proof` が**正本から生成したブリッジ**。点検項目も手順もコピーしない（腐るため）。
> 正本: [`templates/skills/mpa-doctor/SKILL.md`](../../../templates/skills/mpa-doctor/SKILL.md) ／ 規約: [`constitution/`](../../../constitution/README.md)

**やること**: 正本 [`templates/skills/mpa-doctor/SKILL.md`](../../../templates/skills/mpa-doctor/SKILL.md) を読み、その手順で L3（機械の土台）が導入されているかを診断する。
点検項目の典拠は [`constitution/55-machine-checks.md`](../../../constitution/55-machine-checks.md) の「L3 導入点検表」。設定の有無だけ見る（依存方向そのものは再判定しない）。設定を勝手に書かない。
