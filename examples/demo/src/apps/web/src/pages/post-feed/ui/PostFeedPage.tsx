/**
 * pages/post-feed — ルートに対応する画面。
 *
 * MPA: page は widgets を組み立てる最上位の UI。
 *   - データ取得（entity の getPostFeed）を起動し、widget（PostCard）を並べる。
 *   - page 自身に複雑なロジックを持たせない（持たせたくなったら feature/widget へ降ろす）。
 * 依存方向: pages → widgets → features → entities（全て下向き、合法）。
 */
import { useEffect, useState } from "react";
import { getPostFeed, postStore, type Post } from "@/entities/post";
import { PostCard } from "@/widgets/post-card";

export function PostFeedPage() {
  const [posts, setPosts] = useState<Post[]>(postStore.getAll());

  useEffect(() => {
    const unsubscribe = postStore.subscribe(setPosts);
    getPostFeed().then(postStore.setAll);
    return unsubscribe;
  }, []);

  return (
    <main>
      <h1>Feed</h1>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </main>
  );
}
