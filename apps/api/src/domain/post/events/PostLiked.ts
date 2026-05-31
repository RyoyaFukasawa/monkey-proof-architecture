/**
 * domain/post/events/PostLiked — ドメインイベント（過去分詞で命名）。
 * 「いいねされた」という事実。発行は集約（Post）が行い、誰がどう処理するかは domain は知らない。
 */
import type { PostId } from "../PostId";

export class PostLiked {
  readonly occurredAt: Date;

  constructor(
    readonly postId: PostId,
    readonly likedByUserId: string,
    occurredAt: Date,
  ) {
    // MPA: new Date() を domain 内部で呼ばず、外から渡す（テスト可能性・純粋性）。
    this.occurredAt = occurredAt;
  }
}
