/**
 * entities/post の公開 API（public API パターン）。
 *
 * MPA/10-structure: slice の外から触れるのは、ここで re-export したものだけ。
 * 例えば `entities/post/model/postStore` への deep import は lint で禁止。
 * 外部（features 等）は必ずこの index 経由で import する。
 */
export type { Post } from "./model/types";
export { toPost } from "./model/types";
export { postStore } from "./model/postStore";
export { getPostFeed } from "./api/getPostFeed";
export { formatLikeCount } from "./lib/formatLikeCount";
export { PostBody } from "./ui/PostBody";
