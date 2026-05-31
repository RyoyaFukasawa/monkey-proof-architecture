# MPA — Monkey-Proof Architecture

> 規律を内面化していない人間（新人・業務委託・将来の自分）と、規律を持たない AI エージェントの**両方**が、
> 「考えなくても正しい場所に正しいものを置ける」ことを目的としたアーキテクチャ規約。

## 一言で

> **「守れる人」を前提にしない。**
> 機械で縛れるものは機械（lint / 型）で、機械で縛れないものは AI で縛る。

## 構造の選択（発明しない）

| 領域 | アーキテクチャ |
|---|---|
| web | **FSD (Feature-Sliced Design)** |
| backend | **Clean Architecture × DDD** |
| 全体 | **monorepo** |

- **FSD** = 画面をレイヤー（`app → pages → widgets → features → entities → shared`）に積む流儀。
- **Clean Architecture × DDD** = 内側（ビジネスルール）が外側（DB / HTTP）を知らない同心円。ドメインの言葉で設計する（DDD = Domain-Driven Design）。
- **monorepo** = web / api / 共通を 1 リポジトリに同居。

> これらを知らなくても使える。`10-structure.md` の配置図と、`apps/` の reference 実装（「いいね」機能。`examples/README.md` の歩き方に沿って読む）を真似れば正しい場所に置ける。用語の理解は後追いでよい。

枯れていて、誰もが知っていて、ツールが揃っている構成を採用する。
**「AI 時代の発明」は構造ではなく、規約の強制方法にある。**
ただし強制が物理的に効くのは構造ルール（依存方向・命名）まで。SR-1〜SR-4（意味的ルール）は絶対的な床を持たず、多層による確率的抑止である（詳細は [`50-enforcement.md`](constitution/50-enforcement.md)）。

## MPA の心臓 — 機械で縛れないルールを AI が縛る

AST / lint では原理的に判定できない 4 つのルールを、AI が
**生成時（書く前）とレビュー時（マージ前）の両方**で判定する。

| # | ルール | なぜ AI か |
|---|---|---|
| SR-1 | 同じ機能を二度作らない | 「同じ機能」は意味的同値。grep で見つからない |
| SR-2 | 1 ファイル 1 責務 | 「責務」は構文では数えられない |
| SR-3 | 早すぎる共通化をしない | 「本質的同一」か「偶然の一致」かはドメイン理解が要る |
| SR-4 | レイヤー越えの語彙汚染をしない | import を伴わず、型を通ってしまう漏れがある |

## ディレクトリ

```
constitution/                 # 規約の本体（Single Source of Truth）
├── 00-principles.md          #   MPA の 4 原則（なぜこの構造か）
├── 10-structure.md           #   FSD / CleanArch の配置ルール（機械検証の根拠）
├── 20-semantic-rules.md      #   ★機械で縛れないルール集（MPA の心臓）
├── 30-naming.md              #   命名規約
├── 40-discovery.md           #   既存機能の探し方（Capability Map / SR-1 の実効化）
├── 50-enforcement.md         #   ルールの強制方法（多層防御 / hook / 機械検証）
└── checklists/
    ├── before-writing.md     #   生成時セルフチェック
    └── before-merge.md       #   レビュー時ダブルチェック

examples/                     # 規約を「言葉」で示す補助資料（reference コードは持たない）
├── README.md                 #   reference の歩き方（FSD と CleanArch の対比）
└── anti-patterns/            #   SR-1〜SR-4 に「わざと違反した」見本集

apps/                         # reference 実装の本体（top-level）
├── web/                      # FSD の reference（「いいね」機能の縦串）
└── api/                      # CleanArch×DDD の reference（同じ「いいね」を同心円で）
packages/                     # apps 間で共有する層（top-level）
├── types/                    #   apps 間で共有する契約型
├── ui/                       #   共有 UI
└── config/                   #   共有設定

CLAUDE.md                     # 薄い入口（constitution/ を読めと指示するだけ）
.ai/
├── skills/mpa-guard/         # SR-1〜SR-4 を生成時/レビュー時に強制する Skill（規約を参照）
├── commands/
│   ├── mpa-check.md          # /mpa-check  — 生成時チェックを起動
│   └── mpa-review.md         # /mpa-review — diff の意味レビューを起動
└── hooks/
    ├── bin/mpa-pre-write.sh  # PreToolUse: 書く直前に SR-1〜SR-4 をリマインド
    ├── bin/mpa-stop-review.sh# Stop: 書きっぱなしを防ぎセルフレビューを促す
    └── settings.example.json # .claude/settings.json への登録例
```

## 設計の肝（Single Source of Truth）

- 規約の実体は **`constitution/` だけ**にある。
- `CLAUDE.md` も Skill も command も、規約を**複製しない。参照する**。
- → 人間のオンボーディング資料と AI のプロンプトが**物理的に同一**になる。
- → 規約が二箇所に分かれて片方が腐る、を構造的に防ぐ。

## 使い方

### 人間
1. `constitution/` を `00 → 10 → 20 → 30 → 40 → 50` の順に読む。これがオンボーディング。
2. [`examples/README.md`](examples/README.md) の歩き方に沿って、`apps/`（top-level）の
   「いいね」機能の reference 実装を読み、[`examples/anti-patterns/`](examples/anti-patterns/) で
   「やってはいけない見本」を対で見る。

### AI（生成時）
コードを書く前に `/mpa-check`（または `mpa-guard` Skill）。`before-writing.md` を通す。
特に **SR-1**：`40-discovery.md` の Capability Map（公開 `index.ts` ＋ `shared`/`application/shared` の直走査）を引き、
必要なら `find-shared` Skill で意味的類似を探してから書く。

### AI（レビュー時）
PR を出す前 / レビュー時に `/mpa-review`。`before-merge.md` を通す。

## SR-1 を実際に効かせる仕組み（Capability Map）

「同じ機能を二度作らない」は、既存を**見つけられて初めて**機能する。
MPA は**手書きの機能カタログを作らない**（腐るから）。代わりに：

> **公開 API（各 slice の `index.ts`）をそのまま索引（Capability Map）として使う。**

`index.ts` は規約上どのみち必要なので、二重メンテにならない。
（`shared`/`application/shared` は index.ts を持たないので、そこだけはファイルを直接走査して補う。）
詳細は [`constitution/40-discovery.md`](constitution/40-discovery.md)。

## ルールはどう強制されるか（多層防御）

AI の自己申告は急ぐと飛ぶ。だから MPA は**完璧な単一関門を諦め、層を重ねる**：

```
[L1 リマインド]   PreToolUse hook  — 書く直前に SR-1〜SR-4 を思い出させる（弱・軽）
[L2 セルフレビュー] Stop hook         — 書きっぱなしを防ぐ
[L3 機械検証]      lint + CI         — 依存方向/命名は物理的に落ちる（唯一の絶対強制）
[L4 人間レビュー]   /mpa-review + 人  — 意味的違反の最終判断
```

- **構造的ルール（依存方向・命名）= L3 で絶対強制**。ここが床。
- **意味的ルール（SR-1〜SR-4）= L1/L2/L4 で多重に拾う**。機械で縛れないので網を重ねる。

詳細は [`constitution/50-enforcement.md`](constitution/50-enforcement.md)。

## 関連

- `find-shared` Skill — 意味的類似の検出に特化した既存 Skill。SR-1 / SR-3 の探索の実行器。
  MPA 側（`mpa-guard` / constitution）が**判断基準**を持ち、find-shared が**探索**を担う。複製しない。
