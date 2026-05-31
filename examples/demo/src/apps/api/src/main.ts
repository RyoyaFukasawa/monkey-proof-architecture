/**
 * main.ts — Composition Root（合成の根）。
 *
 * MPA（Clean Architecture）:
 *   依存性の注入（DI）を行う唯一の場所。ここで初めて「実装」を「interface」に差し込む。
 *   - InMemoryPostRepository（infra 実装）を LikePostUseCase に注入。
 *   - SystemClock（infra 実装）を注入。
 *   本番では InMemoryPostRepository を PrismaPostRepository に変えるだけ。
 *   application / domain は一行も変わらない＝依存性逆転の成果。
 *
 * この層だけが「全レイヤーを知ってよい」。逆に domain は何も知らない。
 */
import { LikePostUseCase } from "@/application/like-post";
import { InMemoryPostRepository } from "@/infrastructure/repositories/InMemoryPostRepository";
import { SystemClock } from "@/infrastructure/SystemClock";
import { PostController } from "@/presentation/http/PostController";

export function buildApp() {
  // インフラ実装を生成。
  const postRepository = new InMemoryPostRepository([
    { id: "p1", authorId: "author-1", body: "Hello MPA", likedByUserIds: [] },
  ]);
  const clock = new SystemClock();

  // ユースケースに interface として注入。
  const likePostUseCase = new LikePostUseCase(postRepository, clock);

  // プレゼンテーションにユースケースを注入。
  const postController = new PostController(likePostUseCase);

  return { postController };
}
