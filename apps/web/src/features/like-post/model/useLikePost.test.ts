/**
 * features/like-post のテスト（同梱）。
 *
 * MPA: テストは振る舞いの近くに置く。この feature の責務（楽観的更新とロールバック）を検証する。
 * フレームワークは vitest を想定。
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { postStore } from "@/entities/post";
import type { Post } from "@/entities/post";

// api をモックして、楽観的更新のロジックだけを検証する。
vi.mock("../api/likePost", () => ({
  likePost: vi.fn(),
}));
import { likePost } from "../api/likePost";
import { useLikePost } from "./useLikePost";

const basePost: Post = {
  id: "p1",
  authorId: "u1",
  body: "hello",
  likeCount: 10,
  likedByMe: false,
};

describe("useLikePost", () => {
  beforeEach(() => {
    postStore.setAll([basePost]);
    vi.clearAllMocks();
  });

  it("楽観的に likeCount を増やし、サーバ確定値で上書きする", async () => {
    vi.mocked(likePost).mockResolvedValue({ postId: "p1", likeCount: 11, likedByMe: true });

    const { toggleLike } = useLikePost();
    await toggleLike(basePost);

    expect(postStore.getById("p1")).toMatchObject({ likeCount: 11, likedByMe: true });
  });

  it("失敗したら元の状態にロールバックする", async () => {
    vi.mocked(likePost).mockRejectedValue(new Error("network"));

    const { toggleLike } = useLikePost();
    await toggleLike(basePost);

    expect(postStore.getById("p1")).toMatchObject({ likeCount: 10, likedByMe: false });
  });
});
