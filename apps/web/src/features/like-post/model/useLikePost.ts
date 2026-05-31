/**
 * features/like-post/model — 「いいねする」操作のロジック（楽観的更新）。
 *
 * MPA/SR-2: このファイルの責務は一文で言える＝「いいね操作の楽観的更新を行う」。
 * MPA: Post の状態は entities/post の store を使う。feature は entity を組み立てる側。
 *   → entity を import するのは OK（features → entities は下向きで合法）。
 */
import { useState } from "react";
import { postStore, type Post } from "@/entities/post";
import { likePost } from "../api/likePost";

export function useLikePost() {
  const [pending, setPending] = useState(false);

  async function toggleLike(post: Post): Promise<void> {
    if (pending) return;
    setPending(true);

    // 楽観的更新：先に UI を進める。
    const optimistic: Post = {
      ...post,
      likedByMe: !post.likedByMe,
      likeCount: post.likeCount + (post.likedByMe ? -1 : 1),
    };
    postStore.upsert(optimistic);

    try {
      const res = await likePost(post.id);
      // サーバの確定値で上書き。
      postStore.upsert({ ...post, likeCount: res.likeCount, likedByMe: res.likedByMe });
    } catch {
      // 失敗したら元に戻す（ロールバック）。
      postStore.upsert(post);
    } finally {
      setPending(false);
    }
  }

  return { toggleLike, pending };
}
