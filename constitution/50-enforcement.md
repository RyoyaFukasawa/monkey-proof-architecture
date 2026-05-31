# 50. Enforcement — ルールをどう強制するか（多層防御）

> MPA の核心は「機械で縛れないルールを AI に守らせる」こと。
> だが **AI の自己申告は、急ぐとすり抜ける**。slash command は人間が打たないと起動しない。
> このファイルは、その限界を正面から扱い、**多層防御**でカバーする設計を定義する。

---

## 正直な前提：完全な強制は不可能

- 「AI が新機能を書き始める瞬間」を機械的に検知して止める手段は**存在しない**。
  どのツール呼び出しが「新規ロジックの開始」かは、構文では判定できない。
- だから MPA は **「単一の完璧な関門」を作ろうとしない**。
  代わりに、**すり抜けても次の層で捕まる**ように、防御を多層化する。

> 設計思想：強制力の弱い層（リマインド）から強い層（CI で落とす）へ、段階的に締める。
> どれか一つに賭けない。

---

## 4 層の防御

```
        弱い強制力 ←──────────────────────→ 強い強制力
  [L1 リマインド]  [L2 セルフレビュー]  [L3 機械検証]  [L4 人間レビュー]
   PreToolUse hook   Stop hook / command   lint+CI       PR review
   気づきを与える    書きっぱなし防止       絶対に落ちる   最終判断
```

### L0. 対話オーケストレータ（`/mpa` Skill）— 任意の運転役

- `templates/skills/mpa/SKILL.md`（slash: `/mpa`）。
- **新たな強制層ではない**。ユーザーが叩いたとき、L1〜L4 の手順（生成時チェック・SR 判定・終了時レビュー）を
  **対話で順に運転する案内役**。中身は `/mpa-check`・`mpa-guard`・`/mpa-review` を呼ぶだけで、判断基準は持たない（P2）。
- 叩かれなくても**床は従来どおり L3（CI）/ 気づきは L1/L2（hook）**。`/mpa` は床を上書きも代替もしない。
- 意味判定を行う以上、下記 L1/L2/L4 と同じく**同一 AI で相関する**（独立保証は L3 と L4 の人間判断のみ）。

### L1. 生成時リマインド（PreToolUse hook）— 弱いが軽い

- `templates/hooks/bin/mpa-pre-write.sh`
- Write/Edit で `apps/` `packages/` の `.ts(x)` を触る**直前**に、SR-1〜SR-4 を思い出させる。
- **強制はしない**（ブロックしない）。コードを書く直前に「既存を探したか?」を確実に提示するだけ。
- 対象外（md・設定・apps 外）では黙る。ノイズを出さない。
- **守るもの**: 「うっかり既存を探さず書き始める」を減らす。

### L2. 終了時セルフレビュー（Stop hook / `/mpa-review`）— 書きっぱなし防止

- `templates/hooks/bin/mpa-stop-review.sh`
- ターン終了時、この差分に `apps/` `packages/` の TS 変更があれば、
  `before-merge`（SR-1〜SR-4 の事後チェック）を促す。
- 再帰防止（`stop_hook_active`）を実装済み。
- **守るもの**: 「書いてレビューせず終える」を防ぐ最後の砦。

### L3. 機械検証（lint / dependency-cruiser + CI）— 唯一の絶対的強制点

> **ここだけは AI の自己申告に依存しない。CI に組み込めば物理的に落ちる。**

- FSD 依存方向・slice deep import 禁止・命名 → eslint（→ 10-structure / 30-naming）。
- CleanArch 依存方向（domain 何にも依存しない）→ dependency-cruiser。
- **これらは P3 の領域**（機械で縛れるもの）。AI も人間も判断しない。導入後は**通らなければマージできない**。
- 設定例は本ファイル末尾（reference にはランナー一式は同梱しない。下記の但し書き参照）。

### L4. PR レビュー（`/mpa-review` + 人間）— 意味判断の最終確認

- L1〜L3 をすり抜けた **意味的違反**（SR-1〜SR-4）を、PR の diff に対して捕まえる。
- AI が `before-merge.md` で指摘 → **人間が最終判断**。
- グレーは断定せず人間に委ねる（meta ルール）。

---

## なぜこの配置か

| 層 | 強制力 | コスト | 捕まえるもの |
|---|---|---|---|
| L1 リマインド | 弱 | 極小 | 「探さず書く」癖 |
| L2 セルフレビュー | 中 | 小 | 「書きっぱなし」 |
| L3 機械検証 | **絶対** | 中 | 構文で縛れる違反（依存方向・命名） |
| L4 人間レビュー | 強 | 大 | 意味的違反（SR-1〜SR-4） |

- **意味的ルール（SR-1〜SR-4）は L1・L2・L4 で多重に拾う**（機械で縛れないから、層を増やして確率を上げる）。
- **構造的ルール（依存方向・命名）は L3 で確実に落とす**（機械で縛れるから、一点で十分）。

> 限界：SR-1〜SR-4（意味的ルール）には絶対ブロックする層が存在しない。L3 が縛るのは依存方向・命名（構造ルール）のみ。
> 意味的ルールは L1/L2/L4 の確率的抑止に委ねられる。

> 重要：L3（機械検証）が MPA の「床」。どんなにすり抜けても、依存方向違反だけは絶対に通さない。
> その上に L1/L2/L4 という「意味の網」を重ねる。

> 正直な但し書き：L1/L2/L4 の意味判定は同一 AI が同じ基準で行うため、失敗は相関する。
> 層を重ねても捕捉率は独立事象の掛け算ほどは上がらない。真に独立な保証は L3（機械）と L4 の人間判断のみ。
> 相関を下げる実務策（任意）：レビュー時（L4 の AI 部分）は生成時とは別プロンプト視点（できれば別モデル）で
> diff を読ませ、生成時の盲点を共有しない。

---

## 機械検証の設定例（L3 の実体）

> **正直な但し書き**: この reference リポジトリには、L3 を実際に走らせるランナー一式
> （`package.json`、eslint / dependency-cruiser / vitest の依存、CI の yaml）は**同梱していない**（最小 reference のため）。
> 下記は**設定例**であり、そのままでは実行されない。L3 が「床」として機能するのは、各プロジェクトがこれらを
> 導入して CI に組み込んだ後である。MPA が提供するのは規約と配置の手本であって、ビルド基盤そのものではない。

### dependency-cruiser（CleanArch 依存方向）

```js
// apps/api/.dependency-cruiser.js
module.exports = {
  forbidden: [
    {
      name: "domain-must-not-depend-on-anything",
      severity: "error",
      from: { path: "^src/domain" },
      to: { path: "^src/(application|infrastructure|presentation)" },
    },
    {
      name: "application-must-not-depend-on-infra-or-presentation",
      severity: "error",
      from: { path: "^src/application" },
      to: { path: "^src/(infrastructure|presentation)" },
    },
  ],
};
```

### eslint（FSD 依存方向・公開 API）

```jsonc
// apps/web/.eslintrc.json（抜粋イメージ）
{
  "extends": ["@feature-sliced"],
  "rules": {
    // 上位→下位のみ、slice 内部への deep import 禁止は
    // @feature-sliced/eslint-config が担保する。
  }
}
```

### CI（必ず通す）

```yaml
# .github/workflows/mpa.yml（抜粋）
jobs:
  mpa-machine-checks:
    steps:
      - run: pnpm -r lint                       # L3: FSD/命名
      - run: pnpm --filter api depcruise        # L3: CleanArch 依存方向
      - run: pnpm -r test                       # 同梱テスト
```

> L4（意味レビュー）を CI に組み込むかは任意。AI レビューは非決定的なので、
> **ブロッキングにするなら「確度=高」のみを失敗条件**にする（誤検出でマージを止めない）。

### 失敗ハンドリング規約

> SR-4 は語彙汚染（HTTP 概念の domain への漏れ）を扱うが、非ドメイン失敗の型表現までは縛らない。ここを運用規約で補う（新しい SR は作らない）。

想定される失敗は**型付きドメインエラー**（例 `PostNotFoundError`）または **Result 型**で表現し、
`presentation` がそれを**網羅的に HTTP へ変換**、未知のみ 500 にフォールバックする。
**エラーメッセージ文字列で HTTP ステータスを分岐してはならない**（文字列と HTTP の暗黙結合は脆い）。
NotFound / バリデーション / インフラ失敗も、文字列ではなく型で表す。

### テスト戦略の最低要件

`pnpm -r test`（上の CI）で回す同梱テストの、レイヤー別の最低ライン：

| レイヤー | 最低要件 |
|---|---|
| domain | 不変条件とドメインエラーを**純粋テスト（DB/HTTP 不要）**で必須 |
| application | 各ユースケースの**正常系 + 主要異常系**を in-memory repo + Fake Clock で |
| web feature | 主要操作ロジック（**楽観的更新 + ロールバック**等） |

> 書き方は reference 実装（`examples/README.md` が案内する `examples/demo/src/apps/`）の形に倣う（複製しない）。
> 具体形：`examples/demo/src/apps/api/.../Post.test.ts`（domain）／`LikePostUseCase.test.ts`（application）／`examples/demo/src/apps/web/.../useLikePost.test.ts`（feature）。

---

## まとめ

- MPA は「完璧な単一関門」を諦め、**多層防御**で確率的に締める。
- **機械で縛れるもの（依存方向・命名）= L3 で絶対強制**。ここが床。
- **機械で縛れないもの（SR-1〜SR-4）= L1/L2/L4 で多重に拾う**。網を重ねる。
- hook は強制ではなく「気づき」を与える軽い層。賭けるのは L3。
