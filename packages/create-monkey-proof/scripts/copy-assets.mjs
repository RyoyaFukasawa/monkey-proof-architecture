// ビルド時に「唯一の正本」(リポジトリルートの docs/concepts/ と templates/) を
// create-monkey-proof の assets/ へ取り込む。
//
// これが原則 P1「原本は一つ・複製しない」の物理的実装：
//   - 開発時／git 上では assets/ は存在しない（.gitignore 済み）。正本は docs/concepts/ と templates/ だけ。
//   - publish 時にだけ、その時点の正本のスナップショットを assets/ へコピーして同梱する。
//   - つまり npm に載るのは「ある時点の正本の影」であり、手書きの複製ではない。
//
// → ユーザーの `npx create-monkey-proof` はネット越し clone 不要（速い・本家 URL 固定の脆さがない）。

import { cp, rm, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..", ".."); // packages/create-monkey-proof/scripts -> repo root
const assetsDir = resolve(here, "..", "assets");

// 配布するサブセット。
// - docs/concepts/  思想と進め方の原本（配布先で参照される）
// - templates/      spec 雛形 / github/workflows / 各ツール向けスキル
//
// docs/ 配下は concepts/ だけを取り込む（design-notes 等は配布しない）。
const SOURCES = [
  { from: "docs/concepts", to: "docs/concepts" },
  { from: "templates", to: "templates" },
];

async function main() {
  for (const { from } of SOURCES) {
    const src = resolve(repoRoot, from);
    if (!existsSync(src)) {
      throw new Error(
        `正本が見つかりません: ${src}\n` +
          `create-monkey-proof は同一リポジトリ内の docs/concepts/ と templates/ を取り込みます。` +
          `repo ルートから build してください。`,
      );
    }
  }

  await rm(assetsDir, { recursive: true, force: true });
  await mkdir(assetsDir, { recursive: true });

  for (const { from, to } of SOURCES) {
    await cp(resolve(repoRoot, from), resolve(assetsDir, to), {
      recursive: true,
    });
    console.log(`copied ${from}/ -> assets/${to}/`);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
