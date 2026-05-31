/**
 * presentation/dto/LikePostRequest — HTTP リクエストの形（入力 DTO）。
 * バリデーション（zod 等）もこの層で行い、application には素の値だけを渡す。
 */
export interface LikePostRequest {
  postId: string;
  userId: string;
}
