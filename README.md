# MPA — Monkey-Proof Architecture

> Monkey-Proof = foolproof（誰でも間違えない）のもじり。「猿でも壊せない」設計。

「守れる人」を前提にしないアーキテクチャ規約。
規律を内面化していない人間（新人・業務委託・将来の自分）と、規律を持たない AI の両方が、
考えなくても正しい場所に正しいものを置ける。

機械で縛れるもの（依存方向・命名）は機械（lint / 型）で、機械で縛れないもの（例：同じ機能を二度作らない等の意味的判断）は AI で縛る。
構造は枯れたもの（web=FSD〔Feature-Sliced Design〕 / backend=Clean Architecture×DDD / monorepo）を使い、発明は「強制方法」にだけ置く。

---

## あなたは何をしに来た？

| 目的 | 行き先 |
|---|---|
| 📖 **思想と規約を読みたい** | **[`constitution/`](constitution/README.md)** — 規約のすべてと地図 |
| 📦 **自分のプロジェクトに導入したい** | `npx create-mpa`（[`packages/create-mpa/`](packages/create-mpa/)）— 対話で AI ツールへ `/mpa` 一式を展開 |
| 🧪 **規約が効いている実例を見たい** | **[`examples/`](examples/README.md)** — 「いいね」機能の reference 実装（web=FSD / api=CleanArch）と[アンチパターン](examples/anti-patterns/) |
| 🛠 **MPA 自体を開発したい** | **[`CLAUDE.md`](CLAUDE.md)** — このリポジトリの開発者向け入口 |

---

## 導入したプロジェクトでの使い方

`npx create-mpa` で導入すると、**作業の入口 `/mpa` が各 AI ツールに展開される。**
MPA を知らなくても、対話に答えるだけで規約に沿って実装/修正できる。

| ツール | 起動 |
|---|---|
| Claude Code | `/mpa` |
| Gemini CLI | `/mpa` |
| Codex | `/skills` セレクタ or `$mpa`（`/mpa` 直叩きは環境差あり） |
| その他（Cursor 等） | `AGENTS.md` を読むツールは、そこから同じ進行表へ案内される |

> どのツール版も規約を複製せず、`constitution/` を参照する薄いブリッジ。
> 正本（`constitution/` と `templates/`）を直したら `create-mpa` を publish し直すだけで全ツールへ反映される。

---

## このリポジトリの構成

```
constitution/          唯一の正本。規約の実体（読む人はここ）
examples/
  ├── anti-patterns/     規約違反の見本（読み物）
  └── demo/              動くデモ = 規約が効いている証拠。CI の検証対象
templates/             create-mpa が各プロジェクトに配る素材一式
packages/create-mpa/   導入機構。npx create-mpa の実装
```
