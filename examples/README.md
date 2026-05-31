# Examples — reference 実装の歩き方

> MPA の規約（`constitution/`）を**動く形**で示す reference 実装の歩き方ガイド。
> 実装本体はリポジトリ直下の **`apps/web`**・**`apps/api`** にある（このディレクトリはその案内）。
> AI はこのガイドを入口に、`apps/` の reference 実装を「真似る対象（規範）」として読む。人間はオンボーディングで読む。

題材は **「投稿にいいねする」機能**。web（FSD）と api（CleanArch×DDD）で 1 本ずつ、
同じ機能をそれぞれのアーキテクチャで実装している。

---

## apps/web — FSD の縦串

「いいね」が下位レイヤーから上位へどう積み上がるか：

```
shared/api/httpClient.ts           技術土台（ドメイン知識ゼロ）
  ↑
entities/post/                     名詞: Post とは何か
  ├── model/types.ts                 Post 型
  ├── model/postStore.ts             Post の状態
  ├── lib/formatLikeCount.ts         いいね数の表示整形（SR-1 の単一の置き場所）
  ├── api/getPostFeed.ts             取得（名詞の取得まで）
  ├── ui/PostBody.tsx                操作を含まない素の表示
  └── index.ts                       公開 API
  ↑
features/like-post/                動詞: いいねする操作
  ├── api/likePost.ts                操作のサーバ通信
  ├── model/useLikePost.ts           楽観的更新ロジック（責務は一文）
  ├── model/useLikePost.test.ts      テスト同梱
  ├── ui/LikeButton.tsx              操作専用 UI（formatLikeCount を再利用）
  └── index.ts                       公開 API
  ↑
widgets/post-card/                 entity と feature を組み立てる
  ↑
pages/post-feed/                   画面（widget を並べる）
```

依存は常に**上 → 下**。`features` 同士・`entities` 同士の横依存はない。
slice 外からは必ず `index.ts`（公開 API）経由で import する。

### 注目ポイント
- `LikeButton`（feature）が `formatLikeCount`（entity）を**再利用**している → SR-1 の正例。
- `useLikePost` の責務が「楽観的更新を行う」の一文 → SR-2 の正例。
- `shared` にドメイン語彙がない → SR-4 の正例。

---

## apps/api — Clean Architecture × DDD の同心円

「いいね」が内核（domain）から外核（presentation/infra）へどう広がるか：

```
domain/post/                       最内核: ビジネスルール（何にも依存しない）
  ├── Post.ts                        集約ルート: 二重いいね禁止の不変条件
  ├── PostId.ts                      値オブジェクト
  ├── PostRepository.ts              リポジトリ interface（実装は外）
  ├── events/PostLiked.ts            ドメインイベント
  ├── errors/PostAlreadyLikedError.ts ドメインエラー（HTTP を知らない）
  ├── errors/PostNotFoundError.ts    ドメインエラー（Post 不在。404 変換は presentation）
  ├── Post.test.ts                   純粋なドメインテスト（DB/HTTP 不要）
  └── index.ts
  ↑ (依存は内向き)
application/                        ユースケース層
  ├── shared/Clock.ts                時刻取得の抽象
  └── like-post/
      ├── LikePostUseCase.ts         1 ユースケース 1 クラス（domain のみ依存）
      └── LikePostUseCase.test.ts    in-memory + FakeClock で検証
  ↑
infrastructure/                    最外核: 実装詳細
  ├── repositories/InMemoryPostRepository.ts  interface の実装（依存性逆転）
  └── SystemClock.ts                 new Date() の唯一の正規の置き場所
presentation/                      最外核: HTTP
  ├── http/PostController.ts         ドメインエラー → HTTP ステータス変換（SR-4 の境界）
  └── dto/LikePostRequest.ts
  ↑
main.ts                            Composition Root（DI で全部を配線）
```

依存は常に**外 → 内**。`domain` は何も import しない。
`infrastructure` が `domain` の interface を**実装**することで依存が逆転する。

### 注目ポイント
- `Post.ts` がドメインエラーを投げ、HTTP を知らない → SR-4 の正例。
- `PostController` だけが `statusCode`（HTTP 語彙）を持つ → 語彙の境界。
- `PostAlreadyLikedError`→409 と `PostNotFoundError`→404 を `instanceof` で型分岐（文字列マッチしない）
  → 型付きドメインエラーの網羅変換（[`50-enforcement.md`](../constitution/50-enforcement.md) の失敗ハンドリング規約）。
- `LikePostUseCase` が `PostRepository` **interface** に依存し、実装を知らない → 依存性逆転。
- `main.ts` だけが全レイヤーを知る → Composition Root。

---

## 対比して学ぶ

同じ「いいね」が、FSD では**レイヤーの縦串**、CleanArch では**同心円**として実装される。
構造は違うが、MPA の意味的ルール（SR-1〜SR-4）は**両方に共通して適用**される。

違反の見本は [`anti-patterns/`](./anti-patterns/) を参照。
