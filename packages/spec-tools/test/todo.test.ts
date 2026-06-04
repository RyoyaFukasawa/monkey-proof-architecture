import { test } from "node:test";
import assert from "node:assert/strict";
import {
  extractSpecIdFromFilename,
  parseTodoContent,
} from "../src/parsers/todo.ts";

const TODO_CONTENT = `# TODO — spec-001 (投稿にいいねする)

---

## TD-1: 二重いいねの振る舞い

同じユーザーが同じ投稿に2回目の「いいね」を押したとき、どう振る舞うべきか？

- 担当: @yamada
- 期限: 2026-06-18
- issue: #42

---

## TD-2: ランキング

人気投稿の集計はする？

- 担当: （未定）
- 期限: 2026-07-01
- issue: （CI が自動追記）
`;

test("parseTodoContent: TD を抽出する", () => {
  const todo = parseTodoContent(
    "/tmp/spec-001-like-post.todo.md",
    TODO_CONTENT,
  );
  assert.equal(todo.specId, "spec-001");
  assert.equal(todo.items.length, 2);
});

test("parseTodoContent: 担当・期限・issue を抽出する", () => {
  const todo = parseTodoContent(
    "/tmp/spec-001-like-post.todo.md",
    TODO_CONTENT,
  );
  const td1 = todo.items[0];
  assert.equal(td1?.id, "TD-1");
  assert.equal(td1?.owner, "@yamada");
  assert.equal(td1?.dueDate, "2026-06-18");
  assert.equal(td1?.issueNumber, 42);

  const td2 = todo.items[1];
  assert.equal(td2?.owner, null);
  assert.equal(td2?.dueDate, "2026-07-01");
  assert.equal(td2?.issueNumber, null);
});

test("parseTodoContent: 質問本文を保持する", () => {
  const todo = parseTodoContent(
    "/tmp/spec-001-like-post.todo.md",
    TODO_CONTENT,
  );
  const td1 = todo.items[0];
  assert.match(td1?.question ?? "", /同じユーザー/);
});

test("extractSpecIdFromFilename: 正規ファイル名から spec-id を取り出す", () => {
  assert.equal(
    extractSpecIdFromFilename("/tmp/spec-001-like-post.todo.md"),
    "spec-001",
  );
  assert.equal(
    extractSpecIdFromFilename("/tmp/spec-042-handle-payment.todo.md"),
    "spec-042",
  );
});

test("extractSpecIdFromFilename: 不正なファイル名は空文字", () => {
  assert.equal(extractSpecIdFromFilename("/tmp/random.todo.md"), "");
  assert.equal(extractSpecIdFromFilename("/tmp/spec-001.md"), "");
});
