# 30. Naming — 命名規約

> このファイルのルールは原則 **P3（機械で縛れる）** 対象。eslint で強制する。
> 命名は「迷わせない」ためにある。**選択肢を与えず、一意に決まる**ようにする。

---

## 大原則

- **名前は省略しない**。`btn` ❌ → `button` ✅、`usr` ❌ → `user` ✅。
- **動詞 / 名詞の役割を名前に出す**。features は動詞、entities は名詞。
- **層が名前から分かる**。`UseCase`, `Repository`, `Controller` のような接尾辞を守る。

---

## apps/web (FSD)

### ディレクトリ / slice
- slice 名は **kebab-case**：`like-post/`, `user-profile/`
- **features は動詞句**：`like-post`, `search-articles`, `edit-comment`
- **entities は名詞（単数）**：`post`, `user`, `comment`
- **widgets は UI ブロック名（名詞）**：`post-card`, `header`, `comment-list`

### セグメント（固定名）
```
ui/  model/  api/  lib/  index.ts
```
- これらのセグメント名は**固定**。別名を作らない（`hooks/` ❌ → `model/`）。

### ファイル
- React コンポーネント: **PascalCase**（`PostCard.tsx`, `LikeButton.tsx`）
- hooks: **camelCase + use 接頭辞**（`useLikePost.ts`）
- その他 ts: **camelCase**（`formatDate.ts`）
- 型定義ファイル: `types.ts`（slice ローカル）
- 公開 API: **必ず `index.ts`**（他名禁止）

---

## apps/api (Clean Architecture × DDD)

### レイヤー直下（固定名）
```
domain/  application/  infrastructure/  presentation/
```

### domain
- 集約ディレクトリ: **kebab-case 名詞**（`post/`, `user/`）
- エンティティ / 集約ルート: **PascalCase**（`Post.ts`, `User.ts`）
- 値オブジェクト: **PascalCase**（`PostId.ts`, `Email.ts`）
- リポジトリ interface: **PascalCase + `Repository` 接尾辞**（`PostRepository.ts`）
- ドメインイベント: **PascalCase（過去分詞）**（`PostLiked.ts`, `UserRegistered.ts`）
- ドメインエラー: **PascalCase + `Error` 接尾辞**（`PostAlreadyLikedError.ts`）

### application
- ユースケース: **PascalCase + `UseCase` 接尾辞**（`LikePostUseCase.ts`）
  - **1 ファイル 1 ユースケース**（→ SR-2）。
  - 動詞 + 目的語で命名（`LikePost`, `RegisterUser`）。

### infrastructure
- リポジトリ実装: **技術名 + 対象 + `Repository`**（`PrismaPostRepository.ts`）
  - interface 名（`PostRepository`）に実装技術を**前置**する。

### presentation
- コントローラ: **PascalCase + `Controller`**（`PostController.ts`）
- DTO / リクエスト: **PascalCase + `Request`/`Response`**（`LikePostRequest.ts`）

---

## 共通

- ブール値: `is` / `has` / `can` 接頭辞（`isPublished`, `hasLiked`, `canEdit`）
- 定数: **UPPER_SNAKE_CASE**（`MAX_RETRY_COUNT`）
- 列挙的な型: **PascalCase**（`PostStatus`）

---

## 機械検証

| ルール | 強制方法 |
|---|---|
| slice 名 kebab-case | eslint（ディレクトリ名規則） |
| 公開 API が index.ts | eslint（FSD plugin） |
| UseCase / Repository / Controller 接尾辞 | eslint（filename pattern） |
| コンポーネント PascalCase / hook use 接頭辞 | eslint |

> **「動詞か名詞か」（features=動詞 / entities=名詞）の妥当性**は意味判断なので、
> 命名そのものの形式は eslint、語の選択の妥当性は AI（SR レビュー）が補助する。
