# constitution/ — MPA 規約のすべて

規約の実体は **ここ `constitution/` だけ**にある。
README・CLAUDE.md・Skill・command はすべてここを**参照**し、複製しない（MPA 原則 P2）。
人間も AI も、同じこの規約を読む。

> 入口は [`/mpa`](../templates/skills/mpa/SKILL.md)。叩いて対話すれば、以下を読まなくても規約に沿って実装/修正できる。
> このページは「仕組みを知りたくなった人」のための地図。

---

## 記号の凡例（何の頭文字か）

本書は短い記号で項目を指す。**綴りが意味を語らない**ので、ここで一度だけ由来を示す（各記号の実体は右の正本にある）。

| 記号 | 由来 | 何を指すか | 正本 |
|---|---|---|---|
| **P**1〜4 | **P**rinciple（原則） | MPA がなぜこの形かの 4 原則 | [00-principles](00-principles.md) |
| **SR**-1〜4 | **S**emantic **R**ule（意味ルール） | 機械で縛れない 4 つの心臓ルール | [20-semantic-rules](20-semantic-rules.md) |
| **L**0〜4 | **L**ayer（多層防御の層） | 強制力の段階（hook→lint→人間） | [50-enforcement](50-enforcement.md) |
| **R**-1〜4 | **R**eview（レビュー） | マージ前チェック。`R-n` は `SR-n` の事後版 | [checklists/before-merge](checklists/before-merge.md) |

> 番号は「同じものを毎回フルネームで書かずに指す」ための索引。例：`L3` = 機械検証の層／`R-1` は `SR-1` の事後（レビュー時）版。

---

## MPA の心臓（4つの意味的ルール）

lint では原理的に判定できない 4 つを、AI が生成時とレビュー時に縛る。`/mpa` がこれを代行する。
本体は [`20-semantic-rules.md`](20-semantic-rules.md)。

| # | ルール |
|---|---|
| SR-1 | 同じ機能を二度作らない |
| SR-2 | 1 ファイル 1 責務 |
| SR-3 | 早すぎる共通化をしない |
| SR-4 | レイヤー越えの語彙汚染をしない |

---

## 読む順（オンボーディング）

| | 中身 |
|---|---|
| [00-principles](00-principles.md) | なぜこの構造か（MPA の 4 原則） |
| [10-structure](10-structure.md) | FSD / CleanArch の配置ルール（機械検証の根拠） |
| [20-semantic-rules](20-semantic-rules.md) | ★ 機械で縛れないルール集（SR-1〜SR-4 の本体） |
| [30-naming](30-naming.md) | 命名規約 |
| [40-discovery](40-discovery.md) | 既存機能の探し方（Capability Map = SR-1 を実際に効かせる仕組み） |
| [50-enforcement](50-enforcement.md) | ルールの強制方法（多層防御 / hook / 機械検証）の**思想** |
| [55-machine-checks](55-machine-checks.md) | L3（機械の土台）の**実体**：設定例 / 導入点検表（`/mpa-doctor` の典拠）/ 失敗ハンドリング / テスト戦略 |
| [checklists/before-writing](checklists/before-writing.md) | 生成時セルフチェック |
| [checklists/before-merge](checklists/before-merge.md) | レビュー時ダブルチェック |

---

## 手を動かして学ぶ

[`examples/README.md`](../examples/README.md) の歩き方に沿って、`examples/demo/src/apps/` の「いいね」機能の reference 実装
（web=FSD / api=CleanArch の対比）と [`examples/anti-patterns/`](../examples/anti-patterns/) の違反見本を対で読む。

---

## ツール（`templates/`）

> これらは `templates/` に正本があり、`npx create-monkey-proof`（[`packages/create-monkey-proof/`](../packages/create-monkey-proof/)）が各 AI ツール用のブリッジ（`.claude/` 等）を生成する。

| | 役割 |
|---|---|
| [`/mpa`](../templates/skills/mpa/SKILL.md) | 作業の入口。対話オーケストレータ（下記を順に運転する） |
| [`mpa-guard`](../templates/skills/mpa-guard/SKILL.md) | SR-1〜4 の判定実行器 |
| `/mpa-check` / `/mpa-review` | 生成時チェック / レビュー時チェック（`/mpa` が内部で呼ぶ） |
| [`/mpa-doctor`](../templates/skills/mpa-doctor/SKILL.md) | **土台の点検**。L3（機械検証＝依存方向・命名・死コードの lint/CI）が導入されているか診断（→ [55-machine-checks](55-machine-checks.md) の L3 導入点検表） |
| hook | 書く直前のリマインド / 書きっぱなし防止（多層防御の L1/L2 → [50-enforcement](50-enforcement.md)） |

---

## ディレクトリ

```
constitution/            # 規約の本体（このページがその目次）
examples/                # 規約を言葉で示す補助（reference の歩き方・違反見本）
  demo/src/apps/web      #   FSD の reference（「いいね」機能の縦串）
  demo/src/apps/api      #   Clean Architecture × DDD の reference（同じ「いいね」を同心円で）
  demo/src/packages/types #  reference の apps 間で共有する契約型
templates/               # Skill / command / hook の正本（create-monkey-proof が各ツールへ展開）
packages/create-monkey-proof/     # 導入機構（npx create-monkey-proof）
CLAUDE.md                # AI 向けの薄い入口
```
