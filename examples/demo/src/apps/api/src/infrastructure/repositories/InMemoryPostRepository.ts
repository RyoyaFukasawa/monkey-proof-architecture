/**
 * infrastructure/repositories/InMemoryPostRepository — リポジトリ "実装"。
 *
 * MPA（依存性逆転）:
 *   domain の PostRepository interface を implements する。
 *   命名規約: 「技術名 + 対象 + Repository」（30-naming.md）。
 *   ここでは実 DB の代わりに in-memory を使うが、本番では PrismaPostRepository に差し替える。
 *   application は interface にしか依存しないので、この差し替えで application は一切変わらない。
 *
 * MPA/SR-4: 永続化詳細（Map, 将来は SQL）はこの層に閉じ込める。domain には漏らさない。
 */
import { Post, PostId, type PostRepository } from "@/domain/post";

interface PostRow {
  id: string;
  authorId: string;
  body: string;
  likedByUserIds: string[];
}

export class InMemoryPostRepository implements PostRepository {
  private readonly rows = new Map<string, PostRow>();

  constructor(seed: PostRow[] = []) {
    for (const row of seed) this.rows.set(row.id, row);
  }

  async findById(id: PostId): Promise<Post | null> {
    const row = this.rows.get(id.toString());
    if (!row) return null;
    // 永続化表現（行）→ domain の集約 への変換はこの層の責務。
    return Post.reconstitute(row);
  }

  async save(post: Post): Promise<void> {
    // domain → 永続化表現 への変換（snapshot）もこの層で行う。
    const snap = post.snapshot();
    this.rows.set(snap.id, snap);
  }
}
