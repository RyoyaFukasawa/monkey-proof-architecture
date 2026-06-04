import { test } from "node:test";
import assert from "node:assert/strict";
import { parseSpecContent } from "../src/parsers/spec.ts";

const VALID_SPEC = `---
spec-id: spec-001
title: 投稿にいいねする
status: draft
owner: "@example"
capability: post
created: 2026-06-01
updated: 2026-06-04
---

# 投稿にいいねする

## 受け入れ基準

### AC-1: 認証済みユーザーは未いいねの投稿に「いいね」を付けられる

- 前提: U は未いいね
- 操作: いいねを押す
- 期待結果: 201 Created

### AC-2: [保留] 二重いいねの振る舞い

→ [TODO](spec-001-like-post.todo.md#td-1)

## 非ゴール

- 通知は別 spec
`;

test("parseSpecContent: front-matter を抽出する", () => {
  const spec = parseSpecContent("/tmp/spec-001.md", VALID_SPEC);
  assert.equal(spec.frontMatter["spec-id"], "spec-001");
  assert.equal(spec.frontMatter.title, "投稿にいいねする");
  assert.equal(spec.frontMatter.status, "draft");
  assert.equal(spec.frontMatter.capability, "post");
});

test("parseSpecContent: AC を抽出する", () => {
  const spec = parseSpecContent("/tmp/spec-001.md", VALID_SPEC);
  assert.equal(spec.acceptanceCriteria.length, 2);

  const ac1 = spec.acceptanceCriteria[0];
  assert.equal(ac1?.id, "AC-1");
  assert.equal(ac1?.isPending, false);
  assert.match(ac1?.summary ?? "", /認証済み/);

  const ac2 = spec.acceptanceCriteria[1];
  assert.equal(ac2?.id, "AC-2");
  assert.equal(ac2?.isPending, true);
  assert.equal(ac2?.summary, "二重いいねの振る舞い");
});

test("parseSpecContent: status コメント付きを許容する", () => {
  const raw = `---
spec-id: spec-001
title: x
status: draft  # コメント
owner: "@a"
capability: post
---

# x
`;
  const spec = parseSpecContent("/tmp/x.md", raw);
  assert.equal(spec.frontMatter.status, "draft");
});

test("parseSpecContent: 不正な status は空文字に丸める", () => {
  const raw = `---
spec-id: spec-001
title: x
status: nonsense
owner: "@a"
capability: post
---

# x
`;
  const spec = parseSpecContent("/tmp/x.md", raw);
  assert.equal(spec.frontMatter.status, "");
});
