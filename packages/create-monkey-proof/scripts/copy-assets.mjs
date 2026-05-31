// ビルド時に「唯一の正本」(リポジトリルートの constitution/ + templates/) を
// create-monkey-proof の assets/ へ取り込む。
//
// これが MPA P2「複製しない」の物理的実装：
//   - 開発時／git 上では assets/ は存在しない（.gitignore 済み）。正本は constitution/ と templates/ だけ。
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

const SOURCES = ["constitution", "templates"];

async function main() {
  for (const name of SOURCES) {
    const src = resolve(repoRoot, name);
    if (!existsSync(src)) {
      throw new Error(
        `正本が見つかりません: ${src}\n` +
          `create-monkey-proof は同一リポジトリ内の constitution/ と templates/ を取り込みます。` +
          `repo ルートから build してください。`
      );
    }
  }

  await rm(assetsDir, { recursive: true, force: true });
  await mkdir(assetsDir, { recursive: true });

  for (const name of SOURCES) {
    await cp(resolve(repoRoot, name), resolve(assetsDir, name), {
      recursive: true,
    });
    console.log(`copied ${name}/ -> assets/${name}/`);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
