import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCapabilitiesContent } from "../src/parsers/capabilities.ts";

test("parseCapabilitiesContent: ## をケイパビリティ名として抽出", () => {
  const raw = `# ケイパビリティ一覧

## post

投稿に関連する機能。

## auth

認証関連。

## billing
`;
  const caps = parseCapabilitiesContent(raw);
  assert.equal(caps.length, 3);
  assert.equal(caps[0]?.name, "post");
  assert.equal(caps[0]?.description, "投稿に関連する機能。");
  assert.equal(caps[2]?.name, "billing");
  assert.equal(caps[2]?.description, undefined);
});

test("parseCapabilitiesContent: 空入力は空配列", () => {
  assert.deepEqual(parseCapabilitiesContent(""), []);
});
