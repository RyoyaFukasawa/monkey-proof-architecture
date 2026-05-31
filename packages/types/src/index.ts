/**
 * packages/types の公開 API。
 *
 * MPA: packages も公開 API は index.ts に集約する（Capability Map の対象 / 40-discovery.md）。
 * apps からは `@mpa/types` でここを import する（`@mpa/types/post` のような deep import はしない）。
 */
export type { PostDTO, LikePostResponse } from "./post";
