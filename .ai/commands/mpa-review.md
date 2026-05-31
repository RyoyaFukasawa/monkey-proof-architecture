---
description: 現在の diff に対して MPA の意味的レビュー（SR-1〜SR-4）を実行する
---

# /mpa-review

現在のブランチの変更に対して、MPA のレビュー時ダブルチェックを実行してください。

## 手順

1. `git diff` で変更内容を取得する（base はデフォルトブランチ、または引数で指定）。
2. [`constitution/checklists/before-merge.md`](../../constitution/checklists/before-merge.md) を読む。
3. その手順に従い、判定基準 [`constitution/20-semantic-rules.md`](../../constitution/20-semantic-rules.md) で diff を点検する（基準を複製しない）。

## チェック対象（意味的ルールのみ）

- **R-1 / SR-1**: 追加された機能がリポジトリ内の既存と意味的に重複していないか。
- **R-2 / SR-2**: 1 ファイル 1 責務か（接続詞テスト）。
- **R-3 / SR-3**: 偶然の一致を共通化していないか。
- **R-4 / SR-4**: domain/application/entities に下位・外側の語彙が漏れていないか。

機械検証（依存方向・命名）は lint の領域。**ここでは再判定しない。**

## 出力フォーマット

複製しない。[`constitution/checklists/before-merge.md`](../../constitution/checklists/before-merge.md)
の「出力フォーマット（AI レビューの返し方）」節を唯一の典拠とし、そこに従う
（各指摘に 該当 / 根拠 / 提案 / 確度。確度「高」が 0 件ならマージ可。グレーは人間に委ねる。根拠なき指摘はしない）。

$ARGUMENTS
