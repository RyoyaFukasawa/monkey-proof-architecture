/**
 * features/like-post の公開 API。
 * 外部（widgets/pages）はこの index 経由でのみ import する。
 * 内部の model/useLikePost や api/likePost への deep import は lint で禁止。
 */
export { LikeButton } from "./ui/LikeButton";
export { useLikePost } from "./model/useLikePost";
