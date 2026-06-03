---
name: mpa-doctor
description: MPA (Monkey-Proof Architecture) の L3（機械検証＝土台）が、このリポジトリに物理的に導入されているかを診断する。eslint / dependency-cruiser / knip / CI に「依存方向・公開API・命名・死コード」のガードが組み込まれているかを点検し、欠けている土台を報告する。コードの依存方向そのものは再判定しない（設定の有無だけ見る）。Use when checking whether the machine-enforced floor is set up in an MPA repo, or when the user says "L3 入ってる?", "土台できてる?", "機械ガードの点検", "mpa-doctor", or runs /mpa-doctor.
---

# mpa-doctor

MPA の **土台（L3 = 機械検証）が物理的に導入されているか**を診断する Skill。

MPA は「L3 こそが唯一の絶対的な土台。すり抜けても依存方向違反だけは絶対に通さない」と言う
（多層防御の思想は [`constitution/50-enforcement.md`](../../../constitution/50-enforcement.md)）。
だが [`constitution/55-machine-checks.md`](../../../constitution/55-machine-checks.md) の但し書きが認めるとおり、
**L3 を走らせるランナー（eslint / dependency-cruiser / knip / CI）は最初は入っていない。入れ忘れれば土台は無い。**
このSkillは、その**土台の有無を可視化する**。意味ルール（SR-1〜4）には触れない。そこは `mpa-guard` の領域。

## 最重要原則：このSkillは点検項目をコピーしない（P2）

点検項目の正本は **`constitution/55-machine-checks.md` の「L3 導入点検表」（項目1〜7）にしかない**。
この Skill 本体に項目を複製しない（MPA 原則 P2）。常に以下を**読んで**、そこに書かれた各項目を唯一の典拠とする：

- 点検表の本体: [`constitution/55-machine-checks.md`](../../../constitution/55-machine-checks.md) の「L3 導入点検表」節
- ガードの根拠: [`constitution/10-structure.md`](../../../constitution/10-structure.md)（依存方向・公開API）/ [`constitution/30-naming.md`](../../../constitution/30-naming.md)（命名）

> 点検表が更新されたら doctor の挙動も自動で追従する（doctor は表を読むだけ）。
> Skill が古くなっても constitution が真実。必ず点検表を読み直してから診断する。

## もう一つの掟：土台の有無だけ見る。依存方向そのものは再判定しない（P3）

doctor が判定するのは「**L3 を縛る設定/CI が在るか**」だけ。
**コードが実際に依存方向を守っているか**は機械（lint / depcruise）の仕事であって、AI が import を読んで再判定しない（P3）。
doctor は「土台ができているか」を見るのであって、「土台の上で誰かが転んでいないか」は見ない。

## 手順

1. **点検表を読む**。`constitution/55-machine-checks.md` の「L3 導入点検表」から全項目（1〜7）を取得する。
2. 各項目について、リポジトリに対応する設定/CI が**存在するか**を読み取りツール（Glob / Grep / Read）で確認する：
   - **eslint 設定**：`.eslintrc*` / `eslint.config.*` / `package.json` の `eslintConfig`。
     `@feature-sliced` の extends/plugin があるか、依存方向・public-api・命名の rule があるか（項目 1/2/4/5）。
   - **dependency-cruiser**：`*.dependency-cruiser.{js,cjs,mjs,json}` に `forbidden` rule があるか（項目1 代替 / 項目3）。
   - **knip / ts-prune**：`knip.{json,jsonc,ts,js}` / `.knip.*` / `package.json` の `knip` script、または `ts-prune` の利用（項目6）。
   - **CI**：`.github/workflows/*.yml` に lint / depcruise / knip / test を走らせる `run` 行があるか（項目7）。
3. 設定の**存在は確認できるが内容まで読み切れない**（独自命名の config 等）なら、断定せず `❓ 判定保留` にして人間に委ねる。
4. **AST 解釈やコードの依存方向の再判定はしない**（P3）。見るのは「設定が在るか／CI が走らせるか」の有無だけ。

## 出力フォーマット

点検表の全項目（1〜7）を 3 値で表にする：

| # | 点検項目 | 状態 | 備考 |
|---|---|---|---|
| n | （点検表の項目名） | ✅ 導入済み / ⚠️ 未導入 / ❓ 判定保留 | 確認したファイル、または未導入で抜ける土台 |

- **✅ 導入済み**：対応する設定/CI が確認できた（確認したファイルのパスを書く）。
- **⚠️ 未導入**：対応する設定/CI が見つからない。「これが無いと L3 のどの土台が抜けるか」を一行添える（根拠は constitution の章を指す）。
- **❓ 判定保留**：存在はするが内容を読み切れない。何を人間に確認してほしいかを書く。

末尾に総括：

> **土台は n/7 整っている。** 抜けている土台：D-x（…）, D-y（…）。
> これらが CI に乗るまで、MPA の「絶対の土台」はその分だけ穴が開いている。

> **doctor は設定を書かない。** 未導入の土台に対しては「何を入れるべきか」を提案するに留め、
> eslint 設定や CI yaml を勝手に生成しない（土台の自動敷設は doctor の責務ではない）。
> ユーザーが「入れて」と明示したら、そこで初めて別作業として導入を手伝う。

## メタルール（constitution と同じ）

- **根拠なき指摘をしない**。各項目の判定には「確認したファイル」をセットで。
- **設定の意味判断には踏み込まない**。knip が出す個々の「未使用」の真偽（動的参照・外部公開 API の誤検出）は
  人間が確認する（点検表 項目6 の歯止め）。doctor は「knip 設定が在るか」までで止まる。
- **ルールを増やさない**。点検項目は点検表の 7 つのみ。追加は constitution の点検表に明記されてから。
- **断定より提示**。グレー（❓）は人間に委ねる。

## 他の MPA ツールとの関係（守備範囲は直交）

| ツール | 守るもの | 層 |
|---|---|---|
| `mpa-guard` / `/mpa-check` / `/mpa-review` | 意味ルール（SR-1〜4：重複・1責務・早すぎる共通化・語彙汚染） | L1/L2/L4（確率的な網） |
| **`mpa-doctor` / `/mpa-doctor`** | **L3 の土台そのものが導入されているか**（依存方向・命名・死コードの機械ガードの有無） | **L3（土台の点検）** |

> `mpa-guard` は「網が違反を拾えているか」を回す。`mpa-doctor` は「そもそも土台ができているか」を見る。
> 網（意味）と土台（機械）は別物。doctor は意味ルールを判定しないし、guard は土台の有無を点検しない。
