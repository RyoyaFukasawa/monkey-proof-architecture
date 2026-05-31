/**
 * apps/web と apps/api が共有する Post の契約型。
 *
 * MPA: packages/types は「apps 間の契約」だけを置く。ロジックを持たない。
 * web も api もこの型を import するが、web ⇄ api の直接 import は禁止（10-structure.md）。
 */

/** Post の公開表現（API レスポンスの形）。 */
export interface PostDTO {
  id: string;
  authorId: string;
  body: string;
  likeCount: number;
  /** 閲覧中ユーザーが既にいいね済みか。 */
  likedByMe: boolean;
}

/** POST /posts/:id/likes のレスポンス。 */
export interface LikePostResponse {
  postId: string;
  likeCount: number;
  likedByMe: boolean;
}
