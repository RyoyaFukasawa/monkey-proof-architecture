---
spec-id: spec-XXX
title: <一行で機能名>
status: draft  # draft | review | accepted | obsolete
owner: "@<github-username>"
capability: <capability-name>  # 例: invitation, auth, billing
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# <タイトル>

## 背景・目的

なぜこの機能が必要か。業務的な動機を一段落で書く。

## ゴール

この仕様が「完成」したと言える条件を一段落で書く。

## 用語

この仕様の中で使う特殊な用語のみ。横断的な用語は [`../_glossary.md`](../_glossary.md) を参照する。

- **<用語1>** — 定義
- **<用語2>** — 定義

## 受け入れ基準（Acceptance Criteria）

各 AC には `AC-1` のような ID を必ず振る。後続のテスト・実装から `@ac AC-1` で参照される。
**測定可能な条件**で書く（「使いやすい」「速い」など曖昧な表現は禁止）。

### AC-1: <一行要約>

- **前提**: <状態・データの前提条件>
- **操作**: <ユーザーまたはシステムの操作>
- **期待結果**: <測定可能な結果・状態変化・レスポンス>

### AC-2: <一行要約>

- **前提**:
- **操作**:
- **期待結果**:

## 非ゴール（スコープ外）

この仕様が**扱わない**こと。境界を明示することで、後続の議論の脱線を防ぐ。

- <扱わないこと1>
- <扱わないこと2>

## 関連 spec

- [spec-XXX](../<capability>/spec-XXX.md) — 関係する理由

## 変更履歴

- YYYY-MM-DD: 作成
