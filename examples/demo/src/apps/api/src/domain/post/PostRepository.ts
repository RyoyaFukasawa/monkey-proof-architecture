/**
 * domain/post/PostRepository — リポジトリ interface（実装は infrastructure）。
 *
 * MPA（依存性逆転 / Clean Architecture の核心）:
 *   domain は「永続化の契約」だけを定義する。実装技術（Prisma 等）は知らない。
 *   infrastructure 層のリポジトリ実装がこれを implements する
 *   （本 reference では InMemoryPostRepository、本番では例えば PrismaPostRepository）。
 *   → application は this interface に依存し、infrastructure には依存しない。
 */
import type { Post } from "./Post";
import type { PostId } from "./PostId";

export interface PostRepository {
  findById(id: PostId): Promise<Post | null>;
  save(post: Post): Promise<void>;
}
