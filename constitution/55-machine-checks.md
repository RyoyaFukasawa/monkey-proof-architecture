# 55. Machine Checks — L3（機械の土台）の実体

> [`50-enforcement.md`](./50-enforcement.md) が**多層防御の思想**（なぜ層を重ねるか）を語るのに対し、
> このファイルはその中の **L3（機械検証＝唯一の絶対的な土台）の実装ディテール**をまとめる。
> L3 が「何を・どう縛るか」は 50 の L3 節を、「どう書くか・導入できているか」はこのファイルを見る。

---

## 機械検証の設定例（L3 の実体）

> **正直な但し書き**: この reference リポジトリには、L3 を実際に走らせるランナー一式
> （`package.json`、eslint / dependency-cruiser / vitest の依存、CI の yaml）は**同梱していない**（最小 reference のため）。
> 下記は**設定例**であり、そのままでは実行されない。L3 が「土台」として機能するのは、各プロジェクトがこれらを
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
      - run: pnpm -r knip                        # L3: 死コード（未使用 export・到達不能）
      - run: pnpm -r test                       # 同梱テスト
```

> L4（意味レビュー）を CI に組み込むかは任意。AI レビューは非決定的なので、
> **ブロッキングにするなら「確度=高」のみを失敗条件**にする（誤検出でマージを止めない）。

---

## L3 導入点検表（`/mpa-doctor` が読む唯一の典拠）

> **この表が「L3 の土台ができているか」の点検項目の唯一の典拠。** `/mpa-doctor`（doctor skill）はここを読み、
> 各プロジェクトに対応する**設定/CI が存在するか（有無）だけ**を診断する。
> **ここに無い項目を doctor が勝手に足さない**（P2：複製も増殖もしない）。
> doctor は「設定が在るか」までで、コードの依存方向そのものは再判定しない（P3：機械で縛れるものを AI が判定し直さない）。
>
> なぜ点検が要るか：上の「正直な但し書き」のとおり、この reference にも各プロジェクトにも L3 ランナーは
> **最初は入っていない**。L3 が「土台」として機能するのは導入後だけ。**入れ忘れれば土台は無い。** その有無を可視化する。

| # | 点検項目（L3 ガード） | 何を見て「導入済み」とするか | 根拠 |
|---|---|---|---|
| 1 | FSD 依存方向（上→下のみ）が lint で縛られている | `apps/web` 配下に `@feature-sliced/eslint-config`（eslint 設定の extends/plugin）または依存方向 forbidden を持つ `dependency-cruiser` 設定がある | [10-structure](./10-structure.md) |
| 2 | FSD slice の deep import 禁止（公開 API 強制）が lint にある | 同 eslint 設定に public-api / deep-import 禁止 rule（`@feature-sliced` が担保 or 明示 rule） | [10-structure](./10-structure.md) |
| 3 | CleanArch 依存方向（`domain` → 外側 禁止）が depcruise にある | `apps/api/.dependency-cruiser.*` に `domain-must-not-depend-on-anything` 等の forbidden がある | [10-structure](./10-structure.md) |
| 4 | repository 実装が `infrastructure/` 配下、の lint 強制 | eslint の filename/path rule（repository 実装の所在制約）がある | [10-structure](./10-structure.md) |
| 5 | 命名規約が lint にある | `UseCase`/`Repository`/`Controller` 接尾辞・slice 名 kebab・公開 API が `index.ts` を縛る eslint filename pattern rule がある | [30-naming](./30-naming.md) |
| 6 | 死コード検出（未使用 export・到達不能）が knip / ts-prune にある | `knip.*`（または `ts-prune`）の設定 or `package.json` の該当 script がある | このファイル L3 設定例 |
| 7 | 上記すべてが CI で必ず走る（通らなければマージできない） | `.github/workflows/*.yml` に lint / depcruise / knip / test を走らせる run がある | このファイル CI 例 |

> **項目6（死コード検出）の歯止め**：doctor は「knip 設定の有無」までを見る。knip が出す個々の「未使用」指摘の真偽
> （動的参照・外部公開 API・DI 経由の誤検出）は、[`50-enforcement.md`](./50-enforcement.md) の L3 節の但し書きどおり**人間が確認**する。doctor は踏み込まない。
> **判定保留（❓）**：設定の存在は確認できるが内容まで読み切れない（独自 eslint config 等）場合、doctor は断定せず ❓ で人間に委ねる。

---

## 失敗ハンドリング規約

> SR-4 は語彙汚染（HTTP 概念の domain への漏れ）を扱うが、非ドメイン失敗の型表現までは縛らない。ここを運用規約で補う（新しい SR は作らない）。

想定される失敗は**型付きドメインエラー**（例 `PostNotFoundError`）または **Result 型**で表現し、
`presentation` がそれを**網羅的に HTTP へ変換**、未知のみ 500 にフォールバックする。
**エラーメッセージ文字列で HTTP ステータスを分岐してはならない**（文字列と HTTP の暗黙結合は脆い）。
NotFound / バリデーション / インフラ失敗も、文字列ではなく型で表す。

---

## テスト戦略の最低要件

`pnpm -r test`（上の CI）で回す同梱テストの、レイヤー別の最低ライン：

| レイヤー | 最低要件 |
|---|---|
| domain | 不変条件とドメインエラーを**純粋テスト（DB/HTTP 不要）**で必須 |
| application | 各ユースケースの**正常系 + 主要異常系**を in-memory repo + Fake Clock で |
| web feature | 主要操作ロジック（**楽観的更新 + ロールバック**等） |

> 書き方は reference 実装（`examples/README.md` が案内する `examples/demo/src/apps/`）の形に倣う（複製しない）。
> 具体形：`examples/demo/src/apps/api/.../Post.test.ts`（domain）／`LikePostUseCase.test.ts`（application）／`examples/demo/src/apps/web/.../useLikePost.test.ts`（feature）。
