# Anti-pattern: SR-4 違反（レイヤー越えの語彙汚染）

> MPA の SR-4（レイヤー越えの語彙汚染をしない）が**何を捕まえるか**を示す。わざと間違ったコード。

> ※ post の例は reference（post / like-post）に対応する。違反例 2 の `user` のみ説明用の仮想。

---

## ❌ 違反コード 1：domain に HTTP 語彙が漏れる

```ts
// domain/post/Post.ts  ← domain なのに HTTP を知っている
like(userId: string) {
  if (this.likedByUserIds.has(userId)) {
    // ❌ domain が HTTP ステータスコードを返している
    return { error: true, statusCode: 409, message: "already liked" };
  }
  // ...
}
```

### なぜ違反か
`statusCode: 409` は **HTTP の語彙**。domain は HTTP を知ってはならない。
このコードは `import` を一切伴わない（ただのオブジェクトリテラル）ので、
**dependency-cruiser の依存方向チェックを通過してしまう**。型チェックも通る。
→ 機械で防げない。**SR-4 として AI が語彙の出自で捕まえる**。

### ✅ 正しい対応
```ts
// domain はドメインエラーを投げる（HTTP を知らない）
like(userId: string, now: Date) {
  if (this.likedByUserIds.has(userId)) {
    throw new PostAlreadyLikedError(this.id.toString(), userId);
  }
}
```
```ts
// presentation/http/PostController.ts で初めて HTTP に変換する
catch (err) {
  if (err instanceof PostAlreadyLikedError) {
    return { status: 409, body: { message: err.message } };
  }
}
```

---

## ❌ 違反コード 2：domain に永続化（ORM）語彙が漏れる

```ts
// domain/user/User.ts  ← domain なのに ORM デコレータを持つ
import { Entity, Column } from "typeorm"; // ❌ 永続化技術の import

@Entity()                                  // ❌
export class User {
  @Column()                                // ❌
  name!: string;
}
```

### なぜ違反か
`@Entity()` `@Column()` は ORM（永続化技術）の語彙。
これは `import` を伴うので **dependency-cruiser でも捕まえられる**（＝機械で防げる部分）。
ただし「ドメインモデルと ORM エンティティを兼用してよいか」という設計判断自体は意味的で、
AI が「永続化詳細が domain に漏れている」と説明できることに価値がある。

### ✅ 正しい対応
domain の `User` は純粋なクラス。ORM マッピングは infrastructure 層で別に定義する。

---

## ❌ 違反コード 3：FSD entities が技術詳細を触る

```ts
// entities/post/model/postStore.ts  ← entity が localStorage を直接触る
export function savePost(post: Post) {
  localStorage.setItem(`post:${post.id}`, JSON.stringify(post)); // ❌
}
```

### なぜ違反か
`localStorage` は技術詳細（`shared` の責務）。entity は永続化手段を知るべきでない。
型は通る → **SR-4 として AI が捕まえる**。

### ✅ 正しい対応
永続化は `shared/lib/storage` 等に抽象化し、entity はそれを使う（または feature が担う）。

---

## 判定軸（再掲）

> **その語彙はビジネスの人に通じるか?**
> - 通じる（`like`, `OutOfStock`, `author`）→ ドメイン語彙。domain に置いてよい。
> - 通じない（`statusCode`, `@Column`, `localStorage`, `req`, `res`）→ 技術語彙。domain/entity から排除。

> 関連: [`20-semantic-rules.md`](../../constitution/20-semantic-rules.md) SR-4、
> reference: `apps/api/src/domain/post/Post.ts`（ドメインエラーを投げる正例）、
> `apps/api/src/presentation/http/PostController.ts`（HTTP 変換の正例）。
