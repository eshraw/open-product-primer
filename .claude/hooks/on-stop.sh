#!/usr/bin/env bash
# Stop hook: if an archive command was detected, find the linked bet and prompt co-archival.

flag_file=".claude/hooks/.archive-pending"
[ -f "$flag_file" ] || exit 0

change=$(tr -d '[:space:]' < "$flag_file")
rm -f "$flag_file"

if [ -z "$change" ]; then
  latest=$(ls openspec/changes/archive/ 2>/dev/null | sort -r | head -1)
  [ -z "$latest" ] && exit 0
  change=$(echo "$latest" | sed -E 's/^[0-9]{4}-[0-9]{2}-[0-9]{2}-//')
fi

[ -z "$change" ] && exit 0

archive_dir=$(ls openspec/changes/archive/ 2>/dev/null | grep -F "$change" | sort -r | head -1)
[ -z "$archive_dir" ] && exit 0

proposal="openspec/changes/archive/$archive_dir/proposal.md"
[ -f "$proposal" ] || exit 0

bet_id=$(grep -oE 'BET-[0-9]+' "$proposal" | head -1)
[ -z "$bet_id" ] && exit 0

printf '{"decision":"block","reason":"The openspec change '\''%s'\'' was just archived. Its proposal.md references %s. Please invoke `/oprim:archive %s` to co-archive the linked bet."}\n' "$change" "$bet_id" "$bet_id"
