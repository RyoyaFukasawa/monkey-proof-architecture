# 🐵 Monkey-Proof Architecture (MPA)

> 規律を内面化していない人間と、規律を持たない AI エージェントの両方が、
> 「考えなくても」動かして壊れない **プロジェクト進行のフレーム**。

**現在、コードのアーキテクチャ規約から「プロジェクト進行のフレーム」へとスコープを拡張中**。
旧スコープのコード規約（旧 `constitution/`）は一旦削除し、上から積み直しています。
git の履歴には残っています。

---

## まず読む

- **[`docs/concepts/mpa.md`](docs/concepts/mpa.md)** — MPA の思想（核）
- **[`docs/concepts/workflow.md`](docs/concepts/workflow.md)** — プロジェクトの進め方（骨格）
- **[`docs/concepts/phases/1-spec.md`](docs/concepts/phases/1-spec.md)** — フェーズ1（仕様をつくる）の詳細

---

## このリポジトリの構造

```
monkey-proof-architecture/
├── docs/
│   ├── concepts/          MPA の思想と進め方の原本（配布される）
│   │   ├── mpa.md
│   │   ├── workflow.md
│   │   └── phases/
│   └── design-notes/      設計の議論ログ（草案）
├── templates/             配布素材
│   ├── spec/              spec の雛形・ディレクトリ規約
│   ├── github/workflows/  CI ワークフロー（spec lint / TODO 連携）
│   └── skills/mpa-spec/   仕様作成スキル（各 AI ツール向け）
├── examples/spec/         「投稿にいいねする」を題材にした仕様の例
└── packages/
    ├── create-monkey-proof/   配布機構（npx create-monkey-proof）
    └── spec-tools/            CI 用 CLI（@monkey-proof/spec-tools）
```

---

## 導入

```bash
npx create-monkey-proof --tools=claude
```

詳細は [`packages/create-monkey-proof/`](packages/create-monkey-proof/) を参照。

---

## 開発者向け（このリポ自身で作業する人）

- 思想と進め方を読む（[`docs/concepts/`](docs/concepts/)）
- spec の例を読む（[`examples/spec/`](examples/spec/)）
- CI 用 CLI のテスト（[`packages/spec-tools/`](packages/spec-tools/)）
