/**
 * application/shared/Clock — 時刻取得の抽象。
 *
 * MPA: new Date() を domain / application に直接書かない（純粋性・テスト可能性）。
 *   テストでは固定時刻の FakeClock を注入する。実装（SystemClock）は infrastructure。
 */
export interface Clock {
  now(): Date;
}
