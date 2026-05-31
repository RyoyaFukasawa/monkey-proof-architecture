/**
 * entities/post/model — ビジネスの「名詞」。
 *
 * MPA: entities はドメインオブジェクト。技術詳細（localStorage, fetch 直叩き）を持たない（SR-4）。
 * 状態の持ち方は最小限。複数 feature が共有する「Post とは何か」をここで定義する。
 */
import type { PostDTO } from "@mpa/types";

/** UI が扱う Post モデル。DTO とほぼ同形だが、entity 側の都合で別名にしている。 */
export interface Post {
  id: string;
  authorId: string;
  body: string;
  likeCount: number;
  likedByMe: boolean;
}

export function toPost(dto: PostDTO): Post {
  return {
    id: dto.id,
    authorId: dto.authorId,
    body: dto.body,
    likeCount: dto.likeCount,
    likedByMe: dto.likedByMe,
  };
}
