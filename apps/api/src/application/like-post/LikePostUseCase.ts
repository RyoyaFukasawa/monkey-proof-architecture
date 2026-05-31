/**
 * application/like-post/LikePostUseCase — 1 ユースケース = 1 クラス = 1 ファイル（SR-2）。
 *
 * MPA（Clean Architecture）:
 *   - domain にのみ依存する。infrastructure（Prisma 等）は import しない。
 *   - 依存（PostRepository, Clock）は interface でコンストラクタ注入。実装は外から渡す（DI）。
 *   - HTTP の語彙を持たない（SR-4）。入力は素のプリミティブ、出力は素の値。
 *     HTTP への変換は presentation 層。
 *
 * 責務（一文）: 「指定ユーザーが指定 Post にいいねする」ユースケースを実行する。
 */
import { PostId, PostNotFoundError, type PostRepository } from "@/domain/post";
import type { Clock } from "../shared/Clock";

export interface LikePostInput {
  postId: string;
  userId: string;
}

export interface LikePostOutput {
  postId: string;
  likeCount: number;
  likedByMe: boolean;
}

export class LikePostUseCase {
  constructor(
    private readonly posts: PostRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: LikePostInput): Promise<LikePostOutput> {
    const post = await this.posts.findById(PostId.from(input.postId));
    if (!post) {
      // 型付きドメインエラー。HTTP 404 への変換は presentation が instanceof で行う。
      throw new PostNotFoundError(input.postId);
    }

    // ビジネスルールは domain（Post.like）が持つ。application は調整に徹する。
    post.like(input.userId, this.clock.now());

    await this.posts.save(post);

    // 発行されたドメインイベントの配信フックはここ（今回は省略）。
    post.pullEvents();

    return {
      postId: post.id.toString(),
      likeCount: post.likeCount,
      likedByMe: post.likedBy(input.userId),
    };
  }
}
