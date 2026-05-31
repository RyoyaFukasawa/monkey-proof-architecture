/**
 * presentation/http/PostController — HTTP ハンドラ。
 *
 * MPA/SR-4: HTTP の語彙（statusCode, request, response）を持ってよいのは "この層だけ"。
 *   - domain が投げた PostAlreadyLikedError を、ここで初めて HTTP 409 に変換する。
 *   - domain / application は HTTP を知らないまま保たれる。
 *
 * 責務（一文）: 「いいね」HTTP リクエストを受け、ユースケースを呼び、結果を HTTP レスポンスに変換する。
 */
import { LikePostUseCase } from "@/application/like-post";
import { PostAlreadyLikedError, PostNotFoundError } from "@/domain/post";
import type { LikePostResponse } from "@mpa/types";
import type { LikePostRequest } from "../dto/LikePostRequest";

// フレームワーク非依存の最小 HTTP 型（実際は express/hono の型を使う）。
interface HttpResult {
  status: number;
  body: unknown;
}

export class PostController {
  constructor(private readonly likePost: LikePostUseCase) {}

  async like(req: LikePostRequest): Promise<HttpResult> {
    // 入力 DTO のバリデーションは presentation の責務。application には素の値だけ渡す。
    if (!req.postId || !req.userId) {
      return { status: 400, body: { message: "postId and userId are required" } };
    }

    try {
      const out = await this.likePost.execute({ postId: req.postId, userId: req.userId });
      const body: LikePostResponse = {
        postId: out.postId,
        likeCount: out.likeCount,
        likedByMe: out.likedByMe,
      };
      return { status: 200, body };
    } catch (err) {
      // ドメインエラー → HTTP ステータスへの変換はここでだけ行う（型で分岐。文字列マッチしない）。
      if (err instanceof PostAlreadyLikedError) {
        return { status: 409, body: { message: err.message } };
      }
      if (err instanceof PostNotFoundError) {
        return { status: 404, body: { message: err.message } };
      }
      return { status: 500, body: { message: "Internal Server Error" } };
    }
  }
}
