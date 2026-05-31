/**
 * domain/post/PostId — 値オブジェクト（Value Object）。
 *
 * MPA/SR-4: domain は技術語彙を持たない。ここに uuid ライブラリや DB の語彙は出てこない。
 *   ID の「生成」は infrastructure の責務にし、domain は「文字列を ID として扱う」不変条件だけ持つ。
 */
export class PostId {
  private constructor(private readonly value: string) {}

  static from(value: string): PostId {
    if (!value || value.trim().length === 0) {
      throw new Error("PostId must not be empty");
    }
    return new PostId(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: PostId): boolean {
    return this.value === other.value;
  }
}
