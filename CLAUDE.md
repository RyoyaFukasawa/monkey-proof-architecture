# CLAUDE.md — mpa リポジトリ開発者向け

> これは **MPA という作品を開発する** ための入口です（このリポジトリ自身で作業する AI / 人間向け）。
> MPA を**自分のプロジェクトに導入したい人**は、ここではなく `npx create-mpa`（[`packages/create-mpa/`](packages/create-mpa/)）を使ってください。

## このリポジトリの構造（3つの顔）

```
mpa/
├── constitution/          ★ 唯一の正本。規約の実体（P2 の心臓）。ここだけが真実。
├── examples/
│   ├── anti-patterns/       規約違反の見本（読み物）
│   └── demo/                動くデモ = 規約が効いている証拠。CI の検証対象。
├── templates/             ★ create-mpa が各プロジェクトに配る素材一式
│   ├── CLAUDE.md GEMINI.md AGENTS.md   ユーザープロジェクトに置かれる入口の雛形
│   ├── skills/ commands/ hooks/        各 AI ツールへ展開される進行表・SR 判定器
└── packages/create-mpa/   ★ 導入機構。npx create-mpa の実装。
                              同一 repo 内の constitution/ + templates/ を直接参照して配る。
```

- **正本は `constitution/` ただ1つ。** templates/ も create-mpa も demo も、規約の文章を**複製せず参照**する（P2）。
- **`templates/CLAUDE.md` と この `CLAUDE.md` は別物。** 前者は「ユーザーに配る入口」、後者は「mpa を開発する入口」。混同しない。

## 開発時の約束

- **規約の文章を `constitution/` の外に複製しない。** templates/・create-mpa・demo はすべて参照に徹する（P2）。
- **create-mpa は `constitution/` と `templates/` を実ファイルとして読んで配る。** AI の記憶から規約を再生成しない（P2 違反になる）。
- **templates/ を編集したら、それが各ツール版（`.claude/` `.gemini/` `.agents/`）へどう展開されるかを create-mpa 側と整合させる。**
- **demo を変更したら CI（構造 lint ＋ `/mpa-review`）が通ることを確認する。** demo は配布物の品質を保証するドッグフーディングの場。

## このリポジトリ自身も MPA で開発する（ドッグフーディング）

mpa repo で実装作業をするときは、配布しているのと同じ手順に従う：

- 作業の入口は **`/mpa`**（`.claude/skills/mpa/SKILL.md`。templates/ から生成されたブリッジ）。
- 規約は [`constitution/README.md`](constitution/README.md) から読む。
- SR 判定は `/mpa-check`（書く前）・`/mpa-review`（マージ前）。

## してはいけないこと

- 規約をこのファイルや templates/ や create-mpa に**コピーしない**。常に `constitution/` を**参照**する。
- 機械で縛れるルール（依存方向・命名）を AI が再判定しない。lint の結果を信頼する。
- 「迷ったまま書く」をしない。配置に迷ったら [`constitution/10-structure.md`](constitution/10-structure.md) を読む。
