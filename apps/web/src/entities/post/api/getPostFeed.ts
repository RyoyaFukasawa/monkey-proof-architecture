/**
 * entities/post/api — Post の取得。
 * 「いいねする」のような動詞（操作）は features に置く。ここは名詞の取得まで。
 */
import { httpClient } from "@/shared/api/httpClient";
import type { PostDTO } from "@mpa/types";
import { toPost, type Post } from "../model/types";

export async function getPostFeed(): Promise<Post[]> {
  const dtos = await httpClient.get<PostDTO[]>("/posts");
  return dtos.map(toPost);
}
