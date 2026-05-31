/**
 * entities/post/lib — Post という概念に固有の表示整形。
 *
 * MPA/SR-1: 「いいね数の表示整形」はここに 1 つだけ存在する。
 * features 側で同じ整形を再実装したら SR-1 違反。features は必ずこれを使う。
 *
 * MPA/SR-3: これは「Post のいいね数」専用。汎用の数値整形（formatNumber）ではない。
 * 「ユーザーのフォロワー数」など別概念の整形と安易に共通化しない（偶然の一致）。
 */
export function formatLikeCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return String(count);
}
