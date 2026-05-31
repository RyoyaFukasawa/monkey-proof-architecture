# 40. Discovery — 「既にある機能」を見つける仕組み（SR-1 の実効化）

> SR-1（同じ機能を二度作らない）は、「既にあるか」を**実際に見つけられて初めて**機能する。
> このファイルは、その**探し方**を定義する。AI も人間もこの手順で「既存」を探す。

---

## 問題

SR-1 のジレンマ：
- 「同じ機能」は意味的同値なので **grep では見つからない**（だから SR-1 は AI の領域）。
- だが AI の検索手段も結局はテキストベース。**何を手がかりに探すか**が無いと、探索が当てずっぽうになる。

よくある誤った解：**手書きの「機能カタログ」を別途持つ**。
→ これは**腐る**。コードと別に一覧を手で維持すると、必ずズレる。新たなメンテ対象が増える。
→ **MPA は手書きカタログを作らない。**

---

## 解：Capability Map（公開 API を索引として使う）

MPA では「公開 API は必ず `index.ts`」が規約（10-structure.md / 機械検証される）。
つまり：

> **各 slice / レイヤーの `index.ts` を集めれば、それが「このリポジトリに存在する機能の一覧」になる。**

`index.ts` は**どのみちコードとして必要**なので、これを索引に使えば**二重メンテにならない**。
これを **Capability Map（能力地図）** と呼ぶ。手書きの一覧ではなく、**公開 API から導出される索引**。

### Capability Map の実体

「ファイルとして生成して保存する」必要すらない。**探索手順そのもの**が Capability Map である：

```
このリポジトリの「機能の一覧」 =
  apps/web/src/{entities,features,widgets,pages}/*/index.ts が export するシンボル
  + apps/api/src/{domain,application}/**/index.ts が export するシンボル
  + packages/*/src/index.ts が export するシンボル
  + ↑ に載らない「index.ts を持たない置き場」のファイル直走査（下記）
```

これらの `index.ts` の export 行を読めば、「何が既にあるか」が一望できる。

#### 索引対象に含めるレイヤーの基準

索引対象は「**下位から再利用されうるレイヤー**」に限る。`app`（初期化・プロバイダ・ルーティング）は
再利用可能な capability を持たないため除外する。`pages` は画面合成が主だが公開 API を持つため含める
（同名画面の重複検出に効く）。

#### index.ts を持たない置き場（ファイル直走査が必要）

FSD の `shared` は slice ではなく**セグメント直置き**（`shared/ui/Button.tsx` 等）なので index.ts を持たない。
同様に `apps/api/src/application/shared`（`Clock` 等のポート）も index.ts を持たない。
これらは **index.ts ではなくディレクトリ内のファイル名・export を直接走査**する：

- `apps/web/src/shared/**`（httpClient・Button・utils 等の技術土台）
- `apps/api/src/application/shared/**`（Clock 等の抽象）

> つまり Capability Map は「index.ts の集合」＋「shared 系のファイル直走査」の**合成**である。
> `index.ts` だけでは shared 配下の既存（httpClient 等）を取りこぼす。SR-1 で「HTTP クライアントを作る」
> ようなタスクのときは、必ず shared 直下も見る。

---

## SR-1 の探索手順（AI・人間 共通）

新しい機能 `F` を書く前に踏む。STEP 1/2/4 は人間も AI も同じ操作。STEP 3 だけ実行手段が分かれる（下記）。

### STEP 1. F を意味で言語化
「動詞 + 目的語」で一文にする。例：「いいね数を表示用に整形する」。

### STEP 2. Capability Map を引く（公開 API を走査）
F が属しうるレイヤーを読む。優先順位：

| F の性質 | 最初に見る場所 | 読み方 |
|---|---|---|
| UI 操作（動詞） | `apps/web/src/features/*/index.ts` | index.ts の export |
| 画面（同名画面の重複確認） | `apps/web/src/pages/*/index.ts` | index.ts の export |
| ドメインオブジェクト（名詞） | `apps/web/src/entities/*/index.ts`, `apps/api/src/domain/*/index.ts` | index.ts の export |
| ユースケース | `apps/api/src/application/**/index.ts` | index.ts の export |
| 汎用ユーティリティ（技術土台） | `apps/web/src/shared/**`, `apps/api/src/application/shared/**` | **ファイル名・export を直接走査**（index.ts なし） |
| 共有契約型 | `packages/*/src/index.ts` | index.ts の export |

export されているシンボル名を見る。**責務が名前から読み取れないときは、その export 元ファイルの
冒頭コメント（責務の一文。SR-2 によりソース側に必ずある）を Read して責務を確認する**
（index.ts の各 export 行には責務コメントを付けない＝二重メンテを避けるため。責務はソース冒頭が正）。

### STEP 3. 近いものを意味検索で補完
`index.ts`・ファイル走査の一覧だけでは拾えない場合、意味的類似を広く探す：
- **AI**: `find-shared` Skill を起動する（意味的類似の検出に特化した実行器。下記）。
- **人間**: STEP 2 の各 index.ts と shared 配下の export を一覧し（例 `rg -n "export" <該当パス>`）、
  作ろうとする「動詞 + 目的語」に名前が近いものを最大 3 件開いて、再利用できるか判断する。

### STEP 4. 判定
- 近い既存が見つかった → SR-1：再利用する（or SR-3 で「偶然の一致」か判定）。
- 見つからない → 新規作成してよい。**そして F の `index.ts` に公開する**
  （= Capability Map が自動で更新される。次に誰かが同じものを作ろうとすると STEP 2 で見つかる）。

---

## find-shared Skill との関係

`find-shared` は「重複・意味的類似の検出」に特化した既存 Skill。MPA はこれを**正式な実行器**として採用する。

| 役割 | 担当 |
|---|---|
| 「何が存在するか」の索引 | Capability Map（公開 API の `index.ts` 群） |
| 「意味的に似たものを広く拾う」深い探索 | `find-shared` Skill |
| 「本質的同一か偶然の一致か」の最終判定 | AI（SR-1 / SR-3 の基準） |

- **SR-1（書く前）**: Capability Map をまず引き、不足を `find-shared` で補う。
- **SR-1 / SR-3（レビュー時）**: diff の新規シンボルを `find-shared` で全体照合する。

> `find-shared` は「広く拾って、メインで絞る」設計。MPA の SR-1（再利用判定）/ SR-3（偽の共通化排除）と
> 思想が一致している。MPA 側はルールの**根拠**を持ち、`find-shared` は**探索の実行**を持つ。複製しない。

---

## なぜこれで「腐らない」か

- Capability Map は**生成物を保存しない**。`index.ts`（コードの一部）を読むだけ。
- `index.ts` は FSD/CleanArch の規約上**必ず最新**（公開 API を変えれば必ず触る）。
- → 索引とコードが**構造的にズレない**。手書きカタログの「更新し忘れ」が原理的に起きない。

> 設計判断：索引は「作る」ものではなく「導出する」もの。
> MPA は Single Source of Truth を増やさない（公開 API がそのまま索引を兼ねる）。

## Capability Map が保証すること・しないこと（正直な範囲）

過信を避けるため、保証範囲を明示する：

- ✅ **保証する**: 「公開シンボルの網羅」と「コードとの同期（最新性）」。
- ❌ **保証しない**: 「意味的重複が無いこと」。

`index.ts` を読むのは **SR-1 の解決ではなく、AI/人間が意味判定（STEP 3 / STEP 4）を始める出発点**にすぎない。
AI が既存を見落として新規を公開すれば、索引にもその重複が載る。**「腐らない」は最新性の話であって、
「索引がきれい（重複ゼロ）に保たれる」という意味ではない**。

この取りこぼしは [`50-enforcement.md`](./50-enforcement.md) の多層防御
（L2/L4 のレビュー時に `find-shared` で diff 全体を再照合）で**確率的に**拾う前提である。
単一の関門で重複を完全に防げるとは主張しない。
