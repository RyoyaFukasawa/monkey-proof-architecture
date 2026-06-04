# docs/spec/ — 仕様のディレクトリ規約

> このディレクトリは MPA における **フェーズ1（仕様をつくる）** の成果物が置かれる場所。
> 詳細は [`docs/concepts/phases/1-spec.md`](../../docs/concepts/phases/1-spec.md) を参照。

---

## ディレクトリ構成

ケイパビリティ（業務領域）ごとにサブディレクトリを切る：

```
docs/spec/
├── README.md                  # このファイル
├── _template.md               # 仕様の雛形（新しい spec はここからコピー）
├── _template.todo.md          # TODO ファイルの雛形（保留事項の置き場所）
├── _glossary.md               # 用語集（横断的な業務用語）
├── _errors.md                 # エラーコード定義（横断的に参照される）
├── _capabilities.md           # ケイパビリティ一覧（新規追加時はここに登録）
│
├── invitation/                # ケイパビリティ: 招待
│   ├── spec-001-create.md
│   ├── spec-001-create.todo.md       # spec-001 の保留事項（あれば）
│   ├── spec-002-accept.md
│   └── spec-003-revoke.md
│
├── auth/                      # ケイパビリティ: 認証
│   ├── spec-004-login.md
│   └── spec-005-logout.md
│
└── billing/                   # ケイパビリティ: 課金
    └── spec-006-subscribe.md
```

---

## ルール

### 1. 一つの spec は一つの機能

- 1 spec = 1 機能。複数機能を1ファイルに混ぜない。
- spec が大きくなったら分割する。

### 2. spec-id とファイル名

- `spec-id` は **`spec-` + 3桁連番**（`spec-001`, `spec-002`, ...）
- ファイル名は `<spec-id>-<kebab-case-summary>.md`
- 例: `spec-001-create.md`, `spec-042-handle-payment-failure.md`

### 3. ケイパビリティ

- 新しいケイパビリティを追加するときは [`_capabilities.md`](_capabilities.md) に登録してから。
- 機械検証（仕様 lint）が「未定義のケイパビリティに置いてないか」をチェックする。
- 横断的に使われる仕様は `_cross-cutting/` に置く（例外的）。

### 4. front-matter は必須

すべての spec ファイルは [`_template.md`](_template.md) の front-matter を持つこと。
欠落は機械検証で落ちる。

### 5. AC には ID を振る

各受け入れ基準には `AC-1`, `AC-2`, ... の ID を必ず振る。
後続のテスト・実装が `@ac AC-1` で参照する。

### 6. エラーコードは `_errors.md` を参照する

横断的に使われるエラーコード（`POST_NOT_FOUND` 等）は [`_errors.md`](_errors.md) で一元定義し、各 spec からは**リンクで参照**する。spec 内にエラーコードの定義をコピーしない（[原則 P1](../../docs/concepts/mpa.md#p1-原本は一つ何でも一つにする)）。

### 7. spec を直すと spec-drift が起票される

すでに `status: accepted` の spec を改訂すると、機械が**実装側のコードを逆引き**して
`spec-drift` issue を自動起票する（フェーズ4）。

### 8. 保留事項は `.todo.md` ファイルに置く

仕様作成中に「顧客に確認したい」「上司の判断待ち」「もう少し考えたい」がある場合、
**保留事項（TODO）として `<spec-id>-<summary>.todo.md` ファイル**に書き出す。

- spec 本体には該当 AC に **`[保留] → [TODO](<spec-id>-<summary>.todo.md#td-X)`** のマーカーを残す。
- 雛形は [`_template.todo.md`](_template.todo.md)。
- 各 TODO（TD-1, TD-2, …）は **担当（任意）と期限（デフォルト作成日 + 2週間）** を持つ。
- マージ後、CI が各 TD を **GitHub Issue として自動起票**し、`issue:` 番号を追記する。
- Issue は GitHub Projects（kanban / WBS / ロードマップ）に自動連携される。
- Issue がクローズされたら、CI が当該 TD を `.todo.md` から**自動削除**する。
- **TODO が1個でも残っている spec は `status: accepted` に上げられない**（CI で落とす）。

> 「保留」を仕様に書く文化を持つ。曖昧を抱え込んだまま実装に進ませない（[原則 P5「重ねる」](../../docs/concepts/mpa.md#p5)）。

---

## 新しい spec を書く流れ

詳細は [`docs/concepts/phases/1-spec.md`](../../docs/concepts/phases/1-spec.md) 参照。

1. `/mpa-spec` を叩いて対話で生成（または `_template.md` をコピーして手で書く）
2. ケイパビリティが [`_capabilities.md`](_capabilities.md) に登録済みか確認
3. 該当ケイパビリティのディレクトリに置く
4. CI で仕様 lint が走る（落ちたら直す）
5. spec PR を作成
6. **業務が分かる人**がレビュー（人間ゲート 1-7）
7. マージ → フェーズ2（タスク分解）へ

---

## 関連

- 仕様の雛形 → [`_template.md`](_template.md)
- TODO ファイルの雛形 → [`_template.todo.md`](_template.todo.md)
- 横断用語集 → [`_glossary.md`](_glossary.md)
- エラーコード → [`_errors.md`](_errors.md)
- ケイパビリティ一覧 → [`_capabilities.md`](_capabilities.md)
- フェーズ1 詳細 → [`docs/concepts/phases/1-spec.md`](../../docs/concepts/phases/1-spec.md)
