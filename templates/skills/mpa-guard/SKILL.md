---
name: mpa-guard
description: MPA (Monkey-Proof Architecture) の意味的ルール SR-1〜SR-4 を、生成時・レビュー時に強制する。コードを書く前/PR をレビューする時、「重複してないか」「1ファイル1責務か」「早すぎる共通化でないか」「レイヤー越えの語彙汚染がないか」を constitution/ の基準で判定する。Use when writing new code in an MPA repo, reviewing a diff, or when the user says "MPAチェック", "mpa-guard", or runs /mpa-check or /mpa-review.
---

# mpa-guard

MPA の心臓 = 機械で縛れない意味的ルール（SR-1〜SR-4）を AI に守らせる Skill。

## 最重要原則：このSkillはルールをコピーしない

判断基準は **`constitution/` にしかない**。この Skill 本体に基準を複製しない（MPA 原則 P2）。
常に以下を**読んで**、そこに書かれた基準で判定する：

- ルール本体: [`constitution/20-semantic-rules.md`](../../../constitution/20-semantic-rules.md)
- 既存機能の探し方: [`constitution/40-discovery.md`](../../../constitution/40-discovery.md)
- 生成時手順: [`constitution/checklists/before-writing.md`](../../../constitution/checklists/before-writing.md)
- レビュー時手順: [`constitution/checklists/before-merge.md`](../../../constitution/checklists/before-merge.md)

> Skill が古くなっても constitution が真実。必ず constitution を読み直してから判定する。

## モード1：生成時（before writing / `/mpa-check`）

コードを書く**前**に呼ばれる。`before-writing.md` の手順を実行する。

1. これから書く機能を「動詞+目的語」で言語化する。
2. **SR-1（重複チェック）が最優先**。`40-discovery.md` の Capability Map を引く：
   - 関連レイヤーの `index.ts`（公開 API）を読み、既存シンボルと突き合わせる。
   - 不足なら `find-shared` Skill を起動して意味的類似を広く拾う。
3. 近い既存が見つかれば「再利用案」を提示し、**新規作成を止める**。
4. SR-2/SR-3/SR-4 を `before-writing.md` STEP に沿って自己点検。
5. 配置レイヤーが一意に決まったか確認。迷うなら書かず、人間に確認を促す。

出力：各 STEP の結果 + SR-1 で見つかった既存候補（パスつき最大3件）+ 「書いてよいか」の結論。

## モード2：レビュー時（before merge / `/mpa-review`）

PR / diff に対して呼ばれる。`before-merge.md` の手順を実行する。

1. `git diff` で変更を取得。
2. 追加シンボルを **`find-shared`** でリポジトリ全体と照合（R-1 / SR-1）。
3. 肥大ファイルを接続詞テストで点検（R-2 / SR-2）。
4. この diff の新規共通化が「偶然の一致」でないか点検（R-3 / SR-3）。
5. domain/application/entities への語彙漏れを点検（R-4 / SR-4）。
6. 機械検証（lint）の領域は再判定しない。

出力フォーマットは複製しない。[`constitution/checklists/before-merge.md`](../../../constitution/checklists/before-merge.md)
の「出力フォーマット（AI レビューの返し方）」節を唯一の典拠とし、そこに従う。

## メタルール（constitution と同じ）

- **根拠なき指摘をしない**。ファイル・箇所・理由をセットで。
- **断定より提示**。グレーは「判断を仰ぐ」と人間に返す。
- ルールは増やさない。SR-1〜SR-4 のみ。追加は constitution に明記されてから。

## find-shared との関係

`find-shared` は「意味的に似たものを広く拾う」探索の実行器。
mpa-guard は「MPA ルールの文脈で、拾った候補を SR-1/SR-3 の基準で判定する」側。
mpa-guard が探索の手足として find-shared を呼ぶ。基準は mpa-guard（= constitution）が持つ。
