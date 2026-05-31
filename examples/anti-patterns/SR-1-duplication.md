# Anti-pattern: SR-1 違反（同じ機能を二度作る）

> MPA の SR-1（同じ機能を二度作らない）が**何を捕まえるか**を具体で示す。
> このコードは**わざと間違っている**。reference 実装と対比して読むこと。

> ※ 違反例（`displayLikes`／`profile`）は説明用の仮想で、reference には無い。
> 対比先（`entities/post/formatLikeCount`）は reference に実在する。reference の実題材は post / like-post。

---

## ❌ 違反コード

新しく「プロフィール画面のいいね数表示」を作るとき、既存を調べずに整形を再実装した：

```ts
// features/profile/lib/displayLikes.ts  ← 新規作成してしまった
export function displayLikes(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return String(count);
}
```

## なぜ違反か

`entities/post/lib/formatLikeCount.ts` に**意味的に同一**の関数が既に存在する：

```ts
// entities/post/lib/formatLikeCount.ts  ← 既にあった
export function formatLikeCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
}
```

- 名前が違う（`displayLikes` vs `formatLikeCount`）ので **grep では見つからない**。
- だが「Post のいいね数を表示用に整形する」という**意味は同一**。
- → lint では検出不能。**SR-1 として AI が意味検索で捕まえる**。

## なぜ機械（lint）で防げないか

`displayLikes` と `formatLikeCount` はシグネチャも実装も似ているが、
lint は「この 2 つは同じ目的だ」を理解できない。名前で照合する grep も無力。
**意味的同値の判定には、コードの意図の理解が要る** → AI の領域。

## ✅ 正しい対応

```ts
// features/profile/ui/ProfileLikes.tsx
import { formatLikeCount } from "@/entities/post"; // 既存を再利用
```

新規作成せず、`entities/post` の公開 API から `formatLikeCount` を import する。

## AI（SR-1）の判定手順（再掲）

1. 作る機能を「動詞+目的語」で要約 → 「いいね数を表示用に整形する」
2. その意味で既存を意味検索 → `formatLikeCount` がヒット
3. 「再利用できないか?」→ できる
4. → **新規作成を中止**し、既存を import

> 関連: [`before-writing.md`](../../constitution/checklists/before-writing.md) STEP 1、
> [`20-semantic-rules.md`](../../constitution/20-semantic-rules.md) SR-1。
