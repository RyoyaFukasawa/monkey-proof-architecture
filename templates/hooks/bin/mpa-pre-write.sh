#!/usr/bin/env bash
#
# MPA PreToolUse hook — Write/Edit の直前に SR-1〜4 のリマインダを差し込む。
#
# 目的: 生成時チェック（before-writing）の「自己申告すり抜け」を減らす。
#   強制はできない（AI が書き始めるのを物理的に止める手段はない）が、
#   コードを書く直前に「既存を探したか? 1ファイル1責務か?」を確実に思い出させる。
#
# Claude Code の hook 仕様:
#   - stdin に tool_input を含む JSON が渡る
#   - exit 0 + stdout: そのまま続行（stdout は AI への追加コンテキストになる）
#   - exit 2: ブロック（ここでは使わない。MPA は「気づき」を与えるだけで強制しない）
#
# settings.json での登録例は .claude/hooks/settings.example.json を参照。

set -euo pipefail

input="$(cat)"

# 編集対象パスを取り出す（jq があれば使う。無ければ素朴に grep）。
file_path=""
if command -v jq >/dev/null 2>&1; then
  file_path="$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_input.path // empty' 2>/dev/null || true)"
fi

# MPA 管理下（apps/ packages/）のソース編集のときだけリマインドする。
# ドキュメントや設定ファイルの編集では黙る（ノイズを出さない）。
case "$file_path" in
  *"/apps/"*|*"/packages/"*)
    case "$file_path" in
      *.ts|*.tsx)
        cat <<'REMINDER'
[MPA reminder] これからソースを書きます。constitution の意味的ルールを思い出してください:
  - SR-1: 新しい機能/関数を足すなら、同じものが既にないか公開 index.ts（Capability Map / 40-discovery.md）を引く。
          迷ったら find-shared Skill で意味的類似を探す。(純粋な既存修正のみなら該当しない場合あり)
  - SR-2: このファイルの責務を「接続詞なしの一文」で言えるか?
  - SR-3: 共通化しようとしているなら「同じ理由で変わるか?」を問うたか?(偶然の一致は分離)
  - SR-4: domain/entities に HTTP/DB/FW の語彙を漏らしていないか?
どの SR が該当するかは作業 intent に応じて判断（この hook は一律のリマインダ）。基準は constitution/20-semantic-rules.md。
まだ /mpa を起動していないなら、起動すると上記を対話で代行運転します。迷うなら書く前に確認を。
REMINDER
        ;;
    esac
    ;;
esac

exit 0
