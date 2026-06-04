# examples/spec/ — 仕様の例

> MPA のフェーズ1（仕様をつくる）が**埋まると何になるか**を示す動く例。
> 雛形は [`templates/spec/_template.md`](../../templates/spec/_template.md)、ディレクトリ規約は [`templates/spec/README.md`](../../templates/spec/README.md) を参照。

題材は **「投稿にいいねする」機能**。[`examples/demo/`](../demo/) のコード実装（web=FSD / api=CleanArch×DDD）と対応している。

---

## 構成

```
examples/spec/
├── README.md                          # このファイル
├── _glossary.md                       # 横断用語集（Post / User / Like）
└── post/                              # ケイパビリティ: post
    └── spec-001-like-post.md          # 「投稿にいいねする」仕様（acceptance criteria 5本）
```

---

## 注目ポイント

### 1. AC が測定可能になっている

`spec-001-like-post.md` の AC は **「200 OK」「1 増える」「409 Conflict」**のように測定可能な条件で書かれている。

- ❌ NG: 「使いやすい」「速い」「ちゃんと動く」
- ✅ OK: 「201 Created」「いいね数が 1 増える」「エラーコード `POST_ALREADY_LIKED`」

これは機械検証（仕様 lint）が判定できる形にするため。

### 2. AC-id が振られている

各受け入れ基準に `AC-1`〜`AC-5` の ID が振られている。

これにより、フェーズ3（実装）で `@ac AC-1` をコード・テストに書けば、CI で **未カバー AC** を機械的に検出できる。

### 3. 用語は横断 / 個別で分けている

- 横断用語（Post / User / Like）→ [`_glossary.md`](_glossary.md)
- この spec だけで使う用語（二重いいね）→ spec 内の「用語」セクション

[原則 P1（原本は一つ）](../../docs/concepts/mpa.md#p1-原本は一つ何でも一つにする)に従い、同じ用語の定義が複数の spec に散らばらないようにする。

### 4. 非ゴールが明示されている

「いいねの通知」「ランキング」「コメントへのいいね」を**明示的に除外**することで、後続フェーズの脱線を防ぐ。

### 5. demo の実装と対応している

この仕様の AC-1〜AC-5 は、[`examples/demo/src/apps/api/domain/post/Post.ts`](../demo/src/apps/api/domain/post/Post.ts) の不変条件と [`LikePostUseCase.ts`](../demo/src/apps/api/application/like-post/LikePostUseCase.ts) のテストに対応している。

仕様 → 実装 → テスト が AC-id で繋がっている例。

---

## 対比して学ぶ

- 仕様（このディレクトリ） → **何を作るか**を業務の言葉で
- コード実装（[`demo/`](../demo/)） → **どう作るか**を構造の言葉で
- アンチパターン（[`anti-patterns/`](../anti-patterns/)） → 何が「壊れている」か

3つを並べて読むと、MPA がどの層で何を縛っているかが見える。
