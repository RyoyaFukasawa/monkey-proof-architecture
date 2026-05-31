/**
 * widgets/post-card — 自立した UI ブロック。
 *
 * MPA: widget は entities と features を「組み立てる」層。
 *   - PostBody（entity の表示）と LikeButton（feature の操作）を合成する。
 *   - widget 自身はロジックを持たない。組み立てに徹する。
 * 依存方向: widgets → features / entities（下向き、合法）。
 */
import { PostBody, type Post } from "@/entities/post";
import { LikeButton } from "@/features/like-post";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <div data-testid="post-card">
      <PostBody post={post} />
      <LikeButton post={post} />
    </div>
  );
}
