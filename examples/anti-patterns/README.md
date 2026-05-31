# Anti-patterns — SR-1〜SR-4 が「何を捕まえるか」

> 各 SR ルールに対し、**わざと違反したコード**と**正しい対応**を並べた見本集。
> AI はこれを「やってはいけない具体例」として参照する。reference 実装（リポジトリ直下の `apps/`）と対で読む。
> 歩き方は [`../README.md`](../README.md)。

| ファイル | 対応ルール | 捕まえるもの | なぜ lint で無理か |
|---|---|---|---|
| [SR-1-duplication.md](./SR-1-duplication.md) | SR-1 | 名前違いの重複機能 | 意味的同値は grep で見つからない |
| [SR-2-multiple-responsibilities.md](./SR-2-multiple-responsibilities.md) | SR-2 | 1 ファイル複数責務 | 責務は行数でもメソッド数でも測れない |
| [SR-3-premature-abstraction.md](./SR-3-premature-abstraction.md) | SR-3 | 偶然の一致の共通化 | 「同じ理由で変わるか」はドメイン理解が要る |
| [SR-4-vocabulary-leak.md](./SR-4-vocabulary-leak.md) | SR-4 | レイヤー越えの語彙汚染 | import を伴わず型を通る漏れがある |

## 使い方

- **生成時**: これから書くコードがこれらの形になっていないか、`/mpa-check` で確認。
- **レビュー時**: diff にこれらのパターンが混入していないか、`/mpa-review` で確認。
- **学習**: SR-1・SR-4 は reference の post/like-post と直接対比でき、
  SR-2・SR-3 は概念を際立たせるため仮想ドメイン（user/product 等）を用いる。

## 重要な交通整理

- **SR-1 と SR-3 は緊張関係**にある。
  - 意味が同じ → SR-1 で再利用（共通化が正しい）。
  - 偶然同じだけ → SR-3 で分離（共通化が誤り）。
  - 唯一の軸: **「同じ理由で変わるか」**。
