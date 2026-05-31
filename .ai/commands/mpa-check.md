---
description: コードを書く前の MPA セルフチェック（SR-1〜SR-4）を実行する
---

# /mpa-check

あなたはこれからコードを書こうとしています。書き始める**前に**、MPA の生成時チェックを通してください。

## 手順

1. [`constitution/checklists/before-writing.md`](../../constitution/checklists/before-writing.md) を読む。
2. その手順に**厳密に従って**、これから書こうとしている機能を自己点検する。
3. 判定基準は [`constitution/20-semantic-rules.md`](../../constitution/20-semantic-rules.md) に従う（ここに複製しない）。

## 特に重視すること

- **SR-1（重複禁止）**: 作る機能を「動詞+目的語」で要約し、`40-discovery.md` の手順で既存を探せ
  （公開 `index.ts` ＋ shared 直走査＝Capability Map → 不足は `find-shared` Skill）。
  近い既存が見つかれば、新規作成をやめて再利用を提案せよ。
- **配置の一意性**: web/api・レイヤーが一意に決まったか確認せよ。迷うなら書かず、確認を求めよ。

## 出力

- チェックリストの各 STEP の結果（OK / 要対応）。
- SR-1 の意味検索で見つかった既存候補（最大 3 件、パスつき）。
- 「書いてよい」か「書く前に確認が必要」かの結論。

$ARGUMENTS
