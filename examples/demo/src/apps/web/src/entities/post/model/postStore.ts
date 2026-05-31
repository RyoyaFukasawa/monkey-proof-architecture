/**
 * entities/post/model — Post の最小限の状態。
 *
 * MPA: 「いいねの楽観的更新ロジック」は features/like-post に置く（操作は feature の責務）。
 * ここは「Post 一覧を保持し、id で 1 件更新できる」という名詞の状態管理まで。
 *
 * 実プロジェクトでは zustand 等を使う想定。ここは依存を増やさず素朴に書く。
 */
import type { Post } from "./types";

type Listener = (posts: Post[]) => void;

let posts: Post[] = [];
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l(posts);
}

export const postStore = {
  getAll: (): Post[] => posts,

  setAll: (next: Post[]): void => {
    posts = next;
    emit();
  },

  /** id で 1 件を置き換える。いいね更新時に feature 側から使われる。 */
  upsert: (post: Post): void => {
    const idx = posts.findIndex((p) => p.id === post.id);
    posts = idx >= 0 ? posts.with(idx, post) : [...posts, post];
    emit();
  },

  getById: (id: string): Post | undefined => posts.find((p) => p.id === id),

  subscribe: (l: Listener): (() => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};
