/**
 * features/like-post/ui — 「いいねボタン」。この操作専用の UI。
 *
 * MPA: ドメイン語彙を持つ UI（LikeButton）は features に置く。
 *   汎用の Button は shared/ui から借りる（features → shared は下向きで合法）。
 * MPA/SR-1: いいね数の表示整形は entities/post の formatLikeCount を使う。再実装しない。
 */
import { Button } from "@/shared/ui/Button";
import { formatLikeCount, type Post } from "@/entities/post";
import { useLikePost } from "../model/useLikePost";

interface LikeButtonProps {
  post: Post;
}

export function LikeButton({ post }: LikeButtonProps) {
  const { toggleLike, pending } = useLikePost();

  return (
    <Button
      variant={post.likedByMe ? "primary" : "ghost"}
      disabled={pending}
      onClick={() => toggleLike(post)}
      aria-pressed={post.likedByMe}
    >
      ♥ {formatLikeCount(post.likeCount)}
    </Button>
  );
}
