#!/usr/bin/env bash
#
# MPA Stop hook — ターン終了時、コードを書いたなら自己レビューを促す。
#
# 目的: 「書きっぱなしでレビューを飛ばす」を防ぐ最後の砦。
#   このターンの diff に apps/ packages/ の .ts 変更があれば、
#   before-merge（SR-1〜4 の事後チェック）を走らせるよう促す。
#
# Claude Code の hook 仕様:
#   - Stop hook は stdin に stop_hook_active 等を含む JSON を受け取る
#   - stop_hook_active=true のときは再帰防止のため何もしない（重要）
#   - exit 0 + stdout: メッセージを出して正常終了
#
# 注意: MPA は強制しない。促すだけ。実際のレビュー実行は AI / 人間に委ねる。

set -euo pipefail

input="$(cat)"

# 再帰防止: 既に stop hook 由来の継続中なら黙る。
if command -v jq >/dev/null 2>&1; then
  active="$(printf '%s' "$input" | jq -r '.stop_hook_active // false' 2>/dev/null || echo false)"
  if [ "$active" = "true" ]; then
    exit 0
  fi
fi

# このターンで MPA 配下の TS が変わったか（未コミット差分で判定）。
# -uall: 未追跡ディレクトリを畳まず個別ファイルまで展開する
#        （初回コミット前は git が "?? apps/" のように畳むため、これが無いと検出漏れする）。
changed=""
if command -v git >/dev/null 2>&1 && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  changed="$(git status --porcelain -uall 2>/dev/null | grep -E '(apps|packages)/.*\.(ts|tsx)$' || true)"
fi

if [ -n "$changed" ]; then
  cat <<'REMINDER'
[MPA reminder] このターンでソースを変更しました。マージ前に自己レビューを:
  /mpa-review を実行するか、constitution/checklists/before-merge.md に沿って
  SR-1（重複）/ SR-2（単一責務）/ SR-3（偽の共通化）/ SR-4（語彙汚染）を点検してください。
  根拠なき指摘はせず、グレーは人間に判断を仰ぐこと。
REMINDER
fi

exit 0
