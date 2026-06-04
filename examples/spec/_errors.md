# エラーコード（Errors）

> プロジェクト横断で使われるエラーコードの定義集。
> 各 spec の中でエラーレスポンスを定義するときは、ここで定義されたコードを**参照**する（[原則 P1](../../docs/concepts/mpa.md#p1-原本は一つ何でも一つにする)）。
> 各 spec にエラーコードの定義をコピーしない。

エラーコードは **クライアントが分岐に使う文字列定数**。HTTP ステータスは presentation 層の都合だが、エラーコードは業務的意味を持つので spec の言葉として扱う。

---

## 命名規則

- **大文字スネークケース**（`POST_ALREADY_LIKED`）
- 名詞 + 状態（`POST_NOT_FOUND`）か 名詞 + 違反（`POST_ALREADY_LIKED`）の形
- ドメインの境界を超えない（HTTP 用語 `BAD_REQUEST` のようなものは使わない）

---

## エラーコード一覧

### POST_NOT_FOUND

- **HTTP ステータス**: 404 Not Found
- **意味**: 指定された投稿 ID が存在しない、または論理削除されている
- **ドメインエラー**: `PostNotFoundError`
- **関連 spec**: [spec-001-like-post](post/spec-001-like-post.md)（AC-3）

### POST_ALREADY_LIKED

- **HTTP ステータス**: 409 Conflict
- **意味**: ユーザーが既にいいねを付けている投稿に対して、再度いいねを試みた
- **ドメインエラー**: `PostAlreadyLikedError`
- **関連 spec**: [spec-001-like-post](post/spec-001-like-post.md)（AC-2 は [TD-1](post/spec-001-like-post.todo.md#td-1) で確定予定）

### UNAUTHORIZED

- **HTTP ステータス**: 401 Unauthorized
- **意味**: 認証されていないユーザーが認証必須の操作を試みた
- **ドメインエラー**: （横断・presentation 層で判定）
- **関連 spec**: [spec-001-like-post](post/spec-001-like-post.md)（AC-4）
