/**
 * domain/post/Post のテスト（同梱）。
 *
 * MPA: domain のテストは最も価値が高い。DB も HTTP もモック不要で、純粋にビジネスルールを検証できる。
 *   これが「domain が技術詳細を持たない（SR-4）」ことの実利。
 */
import { describe, it, expect } from "vitest";
import { Post } from "./Post";
import { PostAlreadyLikedError } from "./errors/PostAlreadyLikedError";

const now = new Date("2026-01-01T00:00:00Z");

function makePost(likedBy: string[] = []): Post {
  return Post.reconstitute({ id: "p1", authorId: "author", body: "hi", likedByUserIds: likedBy });
}

describe("Post.like", () => {
  it("いいねで likeCount が増え、PostLiked イベントが発行される", () => {
    const post = makePost();
    post.like("user-1", now);

    expect(post.likeCount).toBe(1);
    expect(post.likedBy("user-1")).toBe(true);

    const events = post.pullEvents();
    expect(events).toHaveLength(1);
    expect(events[0].likedByUserId).toBe("user-1");
  });

  it("同じユーザーの二重いいねは PostAlreadyLikedError", () => {
    const post = makePost(["user-1"]);
    expect(() => post.like("user-1", now)).toThrow(PostAlreadyLikedError);
  });

  it("異なるユーザーは独立していいねできる", () => {
    const post = makePost(["user-1"]);
    post.like("user-2", now);
    expect(post.likeCount).toBe(2);
  });
});
