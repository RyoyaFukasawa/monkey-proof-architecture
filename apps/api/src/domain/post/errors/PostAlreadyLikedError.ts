/**
 * domain/post/errors — ドメインエラー。
 *
 * MPA/SR-4: ここは「ビジネスのルール違反」を表す。HTTP ステータス（409 等）は知らない。
 *   HTTP への変換は presentation 層の責務。domain は statusCode を持ってはならない。
 *   （アンチパターン: `{ statusCode: 409 }` を返す → examples/anti-patterns 参照）
 */
export class PostAlreadyLikedError extends Error {
  constructor(postId: string, userId: string) {
    super(`User ${userId} has already liked post ${postId}`);
    this.name = "PostAlreadyLikedError";
  }
}
