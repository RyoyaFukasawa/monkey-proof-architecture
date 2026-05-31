# Anti-pattern: SR-3 違反（早すぎる/誤った共通化）

> MPA の SR-3（早すぎる共通化をしない）が**何を捕まえるか**を示す。わざと間違ったコード。

> ※ これは説明用の仮想例で、reference には無いドメイン（product / user 等）を使う。reference の実題材は post / like-post。
> 「偶然似た別ドメイン」を示すのが要点なので、ここでは仮想ドメインをそのまま用いる。

---

## ❌ 違反コード

「商品価格の表示」と「ユーザーポイントの表示」がたまたま同じ形だったので共通化した：

```ts
// shared/lib/formatNumber.ts  ← 偶然の一致を共通化してしまった
export function formatNumber(n: number): string {
  return new Intl.NumberFormat("ja-JP").format(n);
}
```

```ts
// 2 箇所がこれを使う
formatNumber(product.price);   // 商品価格
formatNumber(user.points);     // ユーザーポイント
```

## なぜ違反か

問い：**「この 2 つは将来、同じ理由で同時に変わるか?」**

- 商品価格 → 通貨記号「¥」を付ける、税込表示にする、等の変更がありうる。
- ユーザーポイント → 「pt」を付ける、単位を変える、等の**別の理由**で変わる。

→ **別々の理由で変わる** = 偶然の一致。共通化すべきでない。
今は同じでも、片方の要件変更がもう片方に**波及してはいけない**。
共通化したことで、「商品価格だけ通貨記号を付けたい」ときに `formatNumber` を触れず、
結局フラグを生やして分岐が増える……という典型的な腐り方をする。

## なぜ機械（lint）で防げないか

- 「2 つのコードが似ている」ことは検出できる（重複検出ツール）。
- だが「**同じ理由で変わるのか / たまたま同じなのか**」は
  **ドメインの意図**を理解しないと判定できない。→ AI の領域。

## ✅ 正しい対応（分けたまま保つ）

```ts
// entities/product/lib/formatPrice.ts
export function formatPrice(price: number): string {
  return `¥${new Intl.NumberFormat("ja-JP").format(price)}`;
}

// entities/user/lib/formatPoints.ts
export function formatPoints(points: number): string {
  return `${new Intl.NumberFormat("ja-JP").format(points)} pt`;
}
```

それぞれのドメインに置き、独立して変更できるようにする。

## SR-1 との交通整理（重要）

- もしこれらが**本当に同じ概念**（同じビジネスルールで必ず一緒に変わる）なら → SR-1 で共通化が正しい。
- 偶然似ているだけ → SR-3 で分離が正しい。
- **唯一の判断軸: 「同じ理由で変わるか」**。これで SR-1 と SR-3 を切り分ける。

## 3 回ルール

2 箇所で同じものが出ても、まだ共通化しない。**3 箇所目**が来て、かつ本質的同一と確認できてから共通化を検討する。

> 関連: [`20-semantic-rules.md`](../../constitution/20-semantic-rules.md) SR-3、SR-1 との関係。
