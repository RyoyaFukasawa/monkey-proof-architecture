# CLAUDE.md — monkey-proof-architecture リポジトリ開発者向け

> このファイルは **MPA という作品を開発する** ための入口。
> MPA を**自分のプロジェクトに導入したい人**は、ここではなく `npx create-monkey-proof` を使ってください。

このリポジトリは MPA を **プロジェクト進行のフレーム** として再構築中です。
旧スコープ（コードのアーキテクチャ規約）のファイル群は削除済み。git の履歴に残っています。

---

## まず読む（このリポを触る前に）

1. **[`docs/concepts/mpa.md`](docs/concepts/mpa.md)** — MPA の思想（5つの原則と諦めること）
2. **[`docs/concepts/workflow.md`](docs/concepts/workflow.md)** — プロジェクトの進め方の骨格
3. **[`docs/concepts/phases/1-spec.md`](docs/concepts/phases/1-spec.md)** — フェーズ1の詳細

---

## このリポジトリの3つの顔

```
docs/concepts/           ★ MPA の思想と進め方の原本（配布される）
templates/               ★ 配布素材（spec 雛形 / workflow / 各ツール向けスキル）
packages/
  ├── create-monkey-proof/  ★ 配布機構（npx で各プロジェクトに展開）
  └── spec-tools/           ★ CI 用 CLI（@monkey-proof/spec-tools として配布）
examples/spec/           動く例。CI の検証対象
```

- **原本は `docs/concepts/` と `templates/` だけ**。`create-monkey-proof` は実ファイルとして読んで配る。AI の記憶から再生成しない（原則 P1）。

---

## 開発時の約束

- **思想を `docs/concepts/` の外に複製しない**（原則 P1）。配布物・skill・CI はすべて参照に徹する。
- **`create-monkey-proof` は同一リポジトリ内の `docs/concepts/` と `templates/` を実ファイルとして読んで配る**。AI の記憶から再生成しない（P1 違反になる）。
- **`templates/` を編集したら、それが各ツール版（`.claude/` `.agents/`）へどう展開されるかを `create-monkey-proof` の `BRIDGE_MAP` と整合させる**。
- **CI に変更を加えたら `packages/spec-tools/` の単体テストが緑なことを確認する**。

---

## してはいけないこと

- 思想・規約をこのファイルや `templates/` や `create-monkey-proof` に**コピーしない**。常に `docs/concepts/` を**参照**する。
- 機械で縛れるもの（spec の必須項目・AC-id 等）を AI が再判定しない。`packages/spec-tools/` の lint 結果を信頼する。
- 「迷ったまま書く」をしない。進め方に迷ったら [`docs/concepts/workflow.md`](docs/concepts/workflow.md) を読む。
