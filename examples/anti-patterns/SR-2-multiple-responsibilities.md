# Anti-pattern: SR-2 違反（1 ファイルに複数責務）

> MPA の SR-2（1 ファイル 1 責務）が**何を捕まえるか**を示す。わざと間違ったコード。

> ※ これは説明用の仮想例で、reference には無いドメイン（`UserService` 等の user）を使う。reference の実題材は post / like-post。

---

## ❌ 違反コード

```ts
// application/UserService.ts  ← 1 ファイルに 3 つの責務
export class UserService {
  async authenticate(email: string, password: string) { /* 認証 */ }
  async updateProfile(userId: string, name: string) { /* プロフィール更新 */ }
  async sendWelcomeEmail(userId: string) { /* メール送信 */ }
}
```

## なぜ違反か

このファイルの責務を一文で言おうとすると：

> 「ユーザーを**認証し**、プロフィールを**更新し**、メールを**送る**」

**「〜し、〜し、〜する」と接続詞が 2 回**出る。→ 3 責務。SR-2 違反。
Clean Architecture では「1 ユースケース = 1 クラス = 1 ファイル」なので、これは 3 ユースケースが 1 ファイルに同居している。

## なぜ機械（lint）で防げないか

- 行数制限では測れない（短くても複数責務はありうる）。
- メソッド数制限も無効（凝集した集約は多メソッドでも 1 責務）。
- 「責務が複数か」は**意味の凝集度**の判断 → AI の領域（接続詞テスト）。

## ✅ 正しい対応（分割）

```
application/
├── authenticate-user/AuthenticateUserUseCase.ts   # 「ユーザーを認証する」
├── update-profile/UpdateProfileUseCase.ts          # 「プロフィールを更新する」
└── send-welcome-email/SendWelcomeEmailUseCase.ts   # 「ウェルカムメールを送る」
```

各ファイルの責務が**接続詞なしの一文**になる。

## 注意：過剰分割もまた違反（逆方向）

```ts
// domain/post/Post.ts は like() unlike() archive() を持つ → これは 1 責務（OK）
```

`Post` 集約のメソッド群は「Post の不変条件を守る」という**一つの凝集した責務**。
これをメソッドごとにファイル分割するのは**過剰分割**で、別の SR-2 違反。
判断軸は常に「**この一文に接続詞が要るか**」。

> 関連: [`20-semantic-rules.md`](../../constitution/20-semantic-rules.md) SR-2、
> reference: `apps/api/src/application/like-post/LikePostUseCase.ts`（1 ファイル 1 ユースケースの正例）。
