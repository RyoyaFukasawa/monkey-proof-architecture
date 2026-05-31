/**
 * domain/post/Post — 集約ルート（Aggregate Root）。
 *
 * MPA/SR-2: このファイルの責務は一文で言える＝「Post の不変条件と振る舞いを守る」。
 * MPA/SR-4: HTTP / DB / FW の語彙を一切持たない。
 *   - いいねの重複は PostAlreadyLikedError（ドメインエラー）で表現。statusCode は持たない。
 *   - 永続化（save）は知らない。リポジトリ interface（別ファイル）経由で外が行う。
 *   - 時刻は引数で受け取る（new Date() を内部で呼ばない＝純粋・テスト可能）。
 *
 * 不変条件: 同じユーザーは同じ Post に 2 回いいねできない。
 */
import { PostId } from "./PostId";
import { PostLiked } from "./events/PostLiked";
import { PostAlreadyLikedError } from "./errors/PostAlreadyLikedError";

export class Post {
  private readonly events: PostLiked[] = [];

  private constructor(
    readonly id: PostId,
    readonly authorId: string,
    readonly body: string,
    private likedByUserIds: Set<string>,
  ) {}

  static reconstitute(params: {
    id: string;
    authorId: string;
    body: string;
    likedByUserIds: string[];
  }): Post {
    return new Post(
      PostId.from(params.id),
      params.authorId,
      params.body,
      new Set(params.likedByUserIds),
    );
  }

  get likeCount(): number {
    return this.likedByUserIds.size;
  }

  likedBy(userId: string): boolean {
    return this.likedByUserIds.has(userId);
  }

  /** ビジネスルールの本体。二重いいねを禁止し、イベントを発行する。 */
  like(userId: string, now: Date): void {
    if (this.likedByUserIds.has(userId)) {
      throw new PostAlreadyLikedError(this.id.toString(), userId);
    }
    this.likedByUserIds.add(userId);
    this.events.push(new PostLiked(this.id, userId, now));
  }

  /** 発行されたドメインイベントを取り出す（application が拾って配信する）。 */
  pullEvents(): PostLiked[] {
    return this.events.splice(0, this.events.length);
  }

  /** 永続化用のスナップショット。infrastructure がこれを DB に書く。 */
  snapshot(): { id: string; authorId: string; body: string; likedByUserIds: string[] } {
    return {
      id: this.id.toString(),
      authorId: this.authorId,
      body: this.body,
      likedByUserIds: [...this.likedByUserIds],
    };
  }
}
