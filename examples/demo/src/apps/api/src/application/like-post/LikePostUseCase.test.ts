/**
 * application/like-post のテスト（同梱）。
 *
 * MPA: application のテストは「in-memory のリポジトリ実装」と「FakeClock」を注入して書く。
 *   本物の DB は要らない。これが依存性逆転（domain が interface を持つ）の実利。
 */
import { describe, it, expect } from "vitest";
import { Post, PostId, PostNotFoundError, type PostRepository } from "@/domain/post";
import type { Clock } from "../shared/Clock";
import { LikePostUseCase } from "./LikePostUseCase";

// テスト専用の in-memory リポジトリ。infrastructure ではなくテスト内に置く。
class InMemoryPostRepository implements PostRepository {
  private store = new Map<string, Post>();
  constructor(seed: Post[]) {
    for (const p of seed) this.store.set(p.id.toString(), p);
  }
  async findById(id: PostId): Promise<Post | null> {
    return this.store.get(id.toString()) ?? null;
  }
  async save(post: Post): Promise<void> {
    this.store.set(post.id.toString(), post);
  }
}

const fixedClock: Clock = { now: () => new Date("2026-01-01T00:00:00Z") };

function seedPost() {
  return Post.reconstitute({ id: "p1", authorId: "author", body: "hi", likedByUserIds: [] });
}

describe("LikePostUseCase", () => {
  it("いいねが成功し、likeCount と likedByMe を返す", async () => {
    const repo = new InMemoryPostRepository([seedPost()]);
    const useCase = new LikePostUseCase(repo, fixedClock);

    const out = await useCase.execute({ postId: "p1", userId: "user-1" });

    expect(out).toEqual({ postId: "p1", likeCount: 1, likedByMe: true });
  });

  it("存在しない Post は PostNotFoundError", async () => {
    const repo = new InMemoryPostRepository([]);
    const useCase = new LikePostUseCase(repo, fixedClock);

    await expect(useCase.execute({ postId: "missing", userId: "user-1" })).rejects.toThrow(
      PostNotFoundError,
    );
  });
});
