/**
 * domain/post/errors/PostNotFoundError — ドメインエラー。
 *
 * MPA: PostAlreadyLikedError と対になる型付きエラー。
 *   「Post が存在しない」を表す。HTTP 404 への変換は presentation の責務（domain は 404 を知らない）。
 *   型で表すことで、presentation が文字列マッチではなく instanceof でマップできる
 *   （= エラーメッセージ文言を変えても HTTP マッピングが壊れない）。
 */
export class PostNotFoundError extends Error {
  constructor(postId: string) {
    super(`Post not found: ${postId}`);
    this.name = "PostNotFoundError";
  }
}
