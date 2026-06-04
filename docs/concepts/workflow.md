# プロジェクトの進め方（workflow）

MPA における **仕様 → タスク → 実装 → 運用** の4フェーズの進め方。

思想（なぜそうするか）は [mpa.md](mpa.md)。各フェーズの具体的な手順・叩くスキルは内部リンクから辿る。

---

## フェーズ一覧

| # | フェーズ | 主役の成果物 | 詳細 |
|---|---|---|---|
| 1 | 仕様をつくる | `docs/spec/<spec-id>.md`（AC-id 付き） | [phases/1-spec.md](phases/1-spec.md) |
| 2 | 仕様 → タスクへ展開 | 縦スライス issue（1 issue = 1 PR） | [phases/2-tasks.md](phases/2-tasks.md) |
| 3 | 実装する | コード + テスト（`@spec` `@ac` 付き） | [phases/3-implement.md](phases/3-implement.md) |
| 4 | 状態が自動で閉じる | PR マージで issue 自動クローズ・spec-drift 自動起票 | [phases/4-close.md](phases/4-close.md) |
