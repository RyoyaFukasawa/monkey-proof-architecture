/**
 * infrastructure/SystemClock — Clock interface の本番実装。
 *
 * MPA: new Date() の「唯一の正規の置き場所」がここ。
 *   domain / application は Clock interface に依存し、本番ではこれを注入する。
 *   テストでは FakeClock を注入するので、時間依存のテストが安定する。
 */
import type { Clock } from "@/application/shared/Clock";

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
