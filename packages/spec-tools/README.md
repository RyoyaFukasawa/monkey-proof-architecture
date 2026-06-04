# @monkey-proof/spec-tools

MPA における仕様の lint / TODO 連携を扱う CLI 群。各プロジェクトの CI から呼ばれる。

> このパッケージは MPA の **フェーズ1（仕様をつくる）** と **フェーズ4（自動クローズ）** の機械検証部分（[原則 P2](../../docs/concepts/mpa.md#p2-機械で縛れるものは必ず機械で縛る)）を実装する。

## 提供する CLI

| CLI | 役割 |
|---|---|
| `mpa-spec-lint <dir>` | 指定ディレクトリ（`docs/spec/` 等）の spec / TODO ファイルを lint |
| `mpa-spec-todo-issue <dir>` | `.todo.md` の新規 TD を GitHub Issue として起票 |
| `mpa-spec-todo-cleanup <dir>` | クローズされた Issue に対応する TD を `.todo.md` から削除 |

## lint チェック項目

### spec ファイル
- front-matter 必須項目（`spec-id` / `title` / `status` / `owner` / `capability`）の有無
- `status` が `draft | review | accepted | obsolete` のいずれか
- `capability` が `_capabilities.md` に登録されているか
- 各 AC に `AC-N` の ID が振られているか
- `status: accepted` の spec に `[保留]` マーカーが残っていないか
- `status: accepted` の spec に対応する `.todo.md` が存在しない、または空であるか
- 内部リンク切れがないか

### TODO ファイル
- ファイル名が `<spec-id>-<summary>.todo.md` で、対応する spec が存在するか
- 各 TD に番号（`TD-N`）が振られているか
- 期限の形式（`YYYY-MM-DD`）が正しいか

## ローカルでの開発

```bash
cd packages/spec-tools
npm install
npm run build
npm test
```

dev モード:

```bash
npm run dev:lint -- ../../examples/spec
```

## 配布

このパッケージは workflow テンプレート（`templates/github/workflows/`）から呼ばれる前提で設計されている。
配布されたプロジェクトの `.github/workflows/` から `npx @monkey-proof/spec-tools` で利用される。
