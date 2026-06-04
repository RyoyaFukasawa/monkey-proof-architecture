# MPA workflow テンプレート

このディレクトリは、`create-monkey-proof` によって各プロジェクトの **`.github/workflows/`** に配布される workflow ファイルの正本。

| ファイル | 役割 | フェーズ |
|---|---|---|
| `spec-lint.yml` | `docs/spec/` を機械検証（必須項目・AC-id・TODO 整合性等） | 1（仕様） |
| `spec-todo-issue.yml` | `.todo.md` の新規 TD を GitHub Issue として自動起票 | 1（仕様） |
| `spec-todo-cleanup.yml` | Issue クローズ時、対応する TD を `.todo.md` から自動削除 | 1（仕様） |

すべて `@monkey-proof/spec-tools`（[`packages/spec-tools/`](../../../packages/spec-tools/)）を呼び出す薄いラッパ。判定基準・ロジックはツール側にある（[原則 P1](../../../docs/concepts/mpa.md)）。

## GitHub Projects との連携

CI が起票した Issue は `spec-todo` ラベルを持つ。

**Projects への自動連携**は、GitHub Projects 側の workflow ルールで設定する：

1. Project の **Settings → Workflows** を開く
2. **Auto-add to project** を有効化し、フィルタを `label:spec-todo` にする

これで起票された Issue が自動で kanban / WBS / ロードマップに乗る。
