# 00. Principles — MPA の不変原則

> **MPA = Monkey-Proof Architecture**
> 規律を内面化していない人間（新人・業務委託・将来の自分）と、規律を持たない AI エージェントの**両方**が、
> 「考えなくても正しい場所に正しいものを置ける」ことを目的としたアーキテクチャ規約。

---

## なぜ MPA か

FSD も Clean Architecture も DDD（Domain-Driven Design / ドメイン駆動設計）も、**「人間が規律を守る」前提**で設計されている。
だが現実には規律は守られない。守れる人だけを前提にした規約は、チームが大きくなるほど破綻する。

MPA の出発点は一つ：

> **「守れる人」を前提にしない。**

代わりに、規約を **2 つの方法で強制**する。

1. **機械で縛れるものは機械で縛る**（lint / 型 / dependency-cruiser）
2. **機械で縛れないものは AI に縛らせる**（意味的判断を要するルール）

この 2 つの境界線を引き、後者を運用可能にすることが MPA の発明である。
ただし後者（意味的判断）に**絶対的な床は無い**。機械の縛りと違い破られうるので、MPA は確率的に締めることを目指す（P4 / [`50-enforcement.md`](./50-enforcement.md)）。

---

## 4 つの原則

### P1. 構造は枯れたものを使う。発明しない。

- web = **FSD (Feature-Sliced Design)**
- backend = **Clean Architecture × DDD**
- これらを **monorepo** で束ねる。

新しいアーキテクチャを発明しない。**広く実績があり、規約が明文化されていて、ツールが揃っている**ことが価値（知らなくても [`10-structure.md`](./10-structure.md) の配置図に従えば置ける）。
「AI 時代っぽい発明」は構造には持ち込まない。発明は P4 のレイヤーにのみ存在する。

→ 詳細は [`10-structure.md`](./10-structure.md)

### P2. 人間と AI を同等に扱う。規約は一つ。

人間用ドキュメントと AI 用プロンプトを**分けない**。
両者が読む **Single Source of Truth = この `constitution/`** を唯一の規約とする。

- `CLAUDE.md` は「`constitution/` を読め」と指示するだけの薄い入口にする。
- Skill / slash command は規約を**複製しない。参照する**。
  - ❌ Skill 本体に判断基準をコピーする → 二重管理で腐る
  - ✅ Skill 本体は「`constitution/20-semantic-rules.md` の基準で判定せよ」と**指す**

これにより、人間のオンボーディング資料と AI のプロンプトが**物理的に同一**になる。

### P3. 機械で縛れるルールは、必ず機械で縛る。

意味判断の要らないルール（依存方向、命名パターン、レイヤー配置）は
人間にも AI にも**判断させない**。lint / 型 / CI で落とす。

> AI に判断を委ねるのは「機械で縛れないもの」だけに限定する。
> 機械で縛れるものまで AI に委ねると、コストが上がり、ブレが生まれる。

→ 機械検証の設定は [`10-structure.md`](./10-structure.md) を根拠とする。

### P4. 機械で縛れないルールは、AI が生成時とレビュー時の両方で縛る。

「同じ機能が既にないか」「1 ファイル 1 責務か」のような**意味的判断**は、
AST や lint では原理的に判定できない。これを AI に担わせる。

- **生成時（事前）**: AI がコードを書く前に [`checklists/before-writing.md`](./checklists/before-writing.md) を通す。
- **レビュー時（事後）**: PR / diff に対して [`checklists/before-merge.md`](./checklists/before-merge.md) を通す。

二重の安全網にする。生成時にすり抜けても、レビュー時に捕まえる。
ただし**自己申告は完璧ではない**（AI は急ぐと飛ばす）。よって hook・機械検証・人間レビューを重ねた
**多層防御**にする。完全な単一関門は諦め、確率的に締める。

→ ルール本体は [`20-semantic-rules.md`](./20-semantic-rules.md)
→ 強制の多層防御は [`50-enforcement.md`](./50-enforcement.md)

---

## 適用範囲

- この `constitution/` 配下のルールは、monorepo 全体に適用される。
- `apps/web`（FSD）と `apps/api`（Clean Architecture × DDD）で
  **構造ルール（P1）は異なる**が、**意味的ルール（P4）は共通**である。
- 例外を作るときは、このディレクトリ内に明文化する。明文化されない例外は存在しない。

---

## この憲法の読み順

| ファイル | 役割 | 読む人 |
|---|---|---|
| `00-principles.md` | なぜこの構造か（本書） | 全員・最初に |
| `10-structure.md` | FSD / CleanArch の配置ルール | 実装者・AI |
| `20-semantic-rules.md` | 機械で縛れないルール集（MPA の心臓） | 実装者・レビュアー・AI |
| `30-naming.md` | 命名規約 | 実装者・AI |
| `40-discovery.md` | 既存機能の探し方（Capability Map / SR-1 の実効化） | 実装者・AI |
| `50-enforcement.md` | ルールの強制方法（多層防御 / hook / 機械検証） | 全員・運用設計 |
| `checklists/before-writing.md` | 生成時チェックリスト | AI（書く前） |
| `checklists/before-merge.md` | レビュー時チェックリスト | AI・レビュアー（マージ前） |
