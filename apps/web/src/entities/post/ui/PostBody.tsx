/**
 * entities/post/ui — Post という名詞の「素の表示」。
 *
 * MPA: entity の UI は「いいねボタン」のような操作を含まない（それは features/like-post）。
 * ここは Post の本文・著者・いいね数表示など、操作を伴わない見た目だけ。
 */
import { formatLikeCount } from "../lib/formatLikeCount";
import type { Post } from "../model/types";

interface PostBodyProps {
  post: Post;
}

export function PostBody({ post }: PostBodyProps) {
  return (
    <article>
      <p>{post.body}</p>
      <span data-testid="like-count">{formatLikeCount(post.likeCount)} likes</span>
    </article>
  );
}
