/**
 * features/like-post/api — 「いいねする」という操作のサーバ通信。
 *
 * MPA: これは features の api。entities/post/api（取得）とは責務が違う（SR-2）。
 * 取得は entity、操作は feature。
 */
import { httpClient } from "@/shared/api/httpClient";
import type { LikePostResponse } from "@mpa/types";

export function likePost(postId: string): Promise<LikePostResponse> {
  return httpClient.post<LikePostResponse>(`/posts/${postId}/likes`);
}
