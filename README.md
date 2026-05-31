# MPA — Monkey-Proof Architecture

> Monkey-Proof = foolproof（誰でも間違えない）のもじり。「猿でも壊せない」設計。

「守れる人」を前提にしないアーキテクチャ規約。
規律を内面化していない人間（新人・業務委託・将来の自分）と、規律を持たない AI の両方が、
考えなくても正しい場所に正しいものを置ける。

機械で縛れるもの（依存方向・命名）は機械（lint / 型）で、機械で縛れないもの（例：同じ機能を二度作らない等の意味的判断）は AI で縛る。
構造は枯れたもの（web=FSD〔Feature-Sliced Design〕 / backend=Clean Architecture×DDD / monorepo）を使い、発明は「強制方法」にだけ置く。

---

## 使い方

**作業を始めるときは、Claude Code で [`/mpa`](.ai/skills/mpa/SKILL.md) と打つ。** これだけでいい。
（`/mpa` は Claude Code のスラッシュコマンド。チャットに入力すると対話が始まる。）

MPA を知らなくても、対話に答えるだけで規約に沿って実装/修正できる。

> hook（書く直前のリマインド等）も効かせたいなら、[`.ai/hooks/settings.example.json`](.ai/hooks/settings.example.json) を
> `.claude/settings.json` にマージする。なくても `/mpa` と CI は動く。

---

仕組みを知りたくなったら → **[`constitution/`](constitution/README.md)**（規約のすべてと地図）
