# 10. Structure — 配置ルール（機械検証の根拠）

> このファイルのルールは **P3（機械で縛れるものは機械で縛る）** の対象。
> 人間も AI も「判断」しない。lint / 型 / dependency-cruiser が落とす。
> AI はこのファイルを「正解の配置」を知るための地図として読む。

---

## monorepo 全体構成

```
repo-root/
├── constitution/          # MPA 規約（Single Source of Truth）
├── apps/
│   ├── web/               # FSD
│   └── api/               # Clean Architecture × DDD
├── packages/              # apps 間で共有する真に汎用なもののみ
│   ├── types/             #   apps 間で共有する契約型（API スキーマ等）
│   ├── ui/                #   複数 app 共有のデザインシステム（ドメイン知識ゼロ）
│   └── config/            #   tsconfig / eslint / etc
├── CLAUDE.md              # → constitution/ を読めと指示するだけ
└── .ai/                   # Skill / command / hook
```

> **判断: `packages/ui` か `apps/web/src/shared/ui` か** — 複数 app（web と将来の admin 等）で共有する UI → `packages/ui`。その app 内だけで使う土台 → `apps/web/src/shared/ui`。app が web 1 つだけの現状は `shared/ui` に置く（だから reference の Button は `shared/ui` にある）。

**依存の大原則（monorepo レベル）**:
```
apps/web  ──┐
            ├──→ packages/*
apps/api  ──┘
```
- `apps/web` と `apps/api` は**互いに直接 import しない**。
- 共有は必ず `packages/*` を経由する。
- `packages/*` は `apps/*` を import してはならない（逆流禁止）。
- **packages の公開 API**: `packages/*` も公開 API は `src/index.ts` に集約する。
  apps からはパッケージ名で import し（`@mpa/types`）、`src` 内部への deep import（`@mpa/types/post` 等）は禁止
  ＝ FSD slice と同じ公開 API の契約境界。これにより packages も Capability Map（40-discovery.md）の索引に載る。

---

## apps/web — FSD (Feature-Sliced Design)

### レイヤー（上が上位、下が下位）

```
app/        # 初期化・プロバイダ・ルーティング・グローバル設定
pages/      # ルートに対応する画面（widgets を組み立てる）
widgets/    # 自立した UI ブロック（features/entities を組み立てる）
features/   # ユーザーの「動詞」= 1 つの操作（いいねする・検索する）
entities/   # ビジネスの「名詞」= ドメインオブジェクト（Post・User）
shared/     # 技術的土台（ドメイン知識ゼロ：UIキット・httpクライアント・utils）
```

**features か entities か（配置の決定ルール）**

- データを読むだけ（一覧/詳細の取得・GET）→ `entities/<名詞>/api`
- データを変える/ユーザー操作（いいね・編集・削除・検索など）→ `features/<動詞>`
- 境界ケース:「取得」は名詞側 = entity に倒す。`getPostFeed` が動詞的に読めても read なので entities。

**widget を作るか（決定ルール）**

- widget は任意。複数 page で再利用する束ね、または単体で意味が完結する束ねのときに作る。1 page でしか使わない単純な合成は page が features/entities を直接組み立ててよい（page→widgets を必ず経由する必要はない）。

### 依存ルール（FSD の核心 / 機械検証対象）

> **上位レイヤーは下位レイヤーのみ import できる。逆と横は禁止。**

```
app → pages → widgets → features → entities → shared
```

- `features` は他の `features` を import **してはならない**（横の依存禁止）。
- `entities` は他の `entities` を import **してはならない**。
- 下位（`shared`）が上位（`features`）を import するのは**厳禁**。

### スライスと公開 API

- 各レイヤー内は **slice**（ドメイン単位のフォルダ）に分かれる。
  例: `features/like-post/`、`entities/post/`
- **slice の外から触れるのは `index.ts` が公開したものだけ**。
  - slice 内部ファイルへの直接 import は禁止（`features/like-post/model/foo.ts` を外から import しない）。
  - これが「公開 API（public API）」パターン。**契約の境界**。

### セグメント（slice 内部の技術役割分割）

```
features/like-post/
├── ui/        # コンポーネント
├── model/     # 状態・ロジック（store, hooks）
├── api/       # サーバ通信
├── lib/       # この slice 内だけのヘルパー
└── index.ts   # 公開 API
```

> **判断メモ**: 本プロジェクトは FSD 標準のセグメント分割を**維持する**。
> （AI 向けの Colocation 案も検討したが、P1「枯れたものを使う」を優先し、FSD 標準に従う。）

### 機械検証

- 依存ルール: `eslint` + `@feature-sliced/eslint-config` または `dependency-cruiser`
- public API 強制: slice 内部への deep import を lint で禁止

---

## apps/api — Clean Architecture × DDD

### レイヤー（同心円。内側ほど安定・抽象）

```
domain/         # 最内核。エンティティ・値オブジェクト・ドメインサービス・リポジトリ "インターフェース"
application/    # ユースケース（domain を組み合わせてアプリの操作を実現）
infrastructure/ # 最外核。DB・外部API・リポジトリ "実装"・フレームワーク詳細
presentation/   # 最外核。HTTP ハンドラ・コントローラ・DTO・ルーティング
```

### 依存ルール（依存性逆転 / 機械検証対象）

> **依存は内側へのみ向く。`domain` は何にも依存しない。**

```
presentation ──┐
               ├──→ application ──→ domain
infrastructure ┘
```

- `domain` は `application` / `infrastructure` / `presentation` を import **してはならない**。
- `application` は `domain` のみに依存する（`infrastructure` を直接 import しない）。
- `infrastructure` は `domain` のインターフェースを**実装**する（依存性逆転）。
  - 例: `domain/repositories/PostRepository`（interface）を
    `infrastructure/repositories/PrismaPostRepository`（class）が implements。
- トランザクション境界 = application 層のユースケース 1 実行 = 1 コミット（コミットの所有は application 層。domain / repository ではない）。複数集約をまたぐ操作の整合戦略は、運用で必要になった時点で本書に明記する。

### DDD の構成要素配置

```
domain/
├── post/                          # 集約（Aggregate）単位
│   ├── Post.ts                    # エンティティ / 集約ルート
│   ├── PostId.ts                  # 値オブジェクト
│   ├── PostRepository.ts          # リポジトリ interface（実装は infra）
│   └── events/PostLiked.ts        # ドメインイベント
application/
├── like-post/
│   └── LikePostUseCase.ts         # 1 ユースケース = 1 クラス
infrastructure/
├── repositories/PrismaPostRepository.ts
└── db/...
presentation/
├── http/PostController.ts
└── dto/LikePostRequest.ts
```

> ※ 図中の `PrismaPostRepository.ts` は本番想定の例示。reference 実装（`apps/api`）では interface を `InMemoryPostRepository.ts` で実装し、`main.ts` で「本番は `PrismaPostRepository` に差し替え」と明示している（依存性逆転の成果）。

### レイヤー越えの語彙汚染（SR-4 の対象）

- `domain` に **HTTP / DB / フレームワークの語彙が漏れてはならない**。
  - ❌ `domain/post/Post.ts` が `express` の `Request` を知っている
  - ❌ `domain` が ORM のデコレータ（`@Entity()` 等）に依存する
- これは型チェックを**通ってしまう**ことがあるため、AI が意味で検出する（→ SR-4）。

### 機械検証

- 依存方向: `dependency-cruiser` で `domain → 外側` を禁止
- インターフェース実装の所在: lint ルールで repository 実装が `infrastructure/` 配下にあることを強制

---

## 機械検証で守ること / AI に委ねること（境界線）

| 守るべきこと | 守らせ方 | 根拠原則 |
|---|---|---|
| FSD 依存方向（上→下のみ） | dependency-cruiser / eslint | P3 |
| FSD slice 内部への deep import 禁止 | eslint | P3 |
| CleanArch 依存方向（内向きのみ） | dependency-cruiser | P3 |
| repository 実装が infra にある | eslint | P3 |
| ファイル/フォルダ命名パターン | eslint（→ 30-naming.md） | P3 |
| **同じ機能が既にないか** | **AI（SR-1）** | P4 |
| **1 ファイル 1 責務か** | **AI（SR-2）** | P4 |
| **早すぎる共通化でないか** | **AI（SR-3）** | P4 |
| **レイヤー越えの語彙汚染** | **AI（SR-4）** | P4 |

> 上 5 つ（機械検証）は AI に判断させない。下 4 つ（意味判断）だけを AI に委ねる。
