#!/usr/bin/env bash
# UserPromptSubmit hook: detects archive slash commands and sets a pending flag.

flag_file=".claude/hooks/.archive-pending"

input=$(cat)

printf '%s' "$input" | grep -qE '"prompt"[[:space:]]*:[[:space:]]*"[^"]*(opsx:archive|openspec-archive-change)' || exit 0

prompt=$(printf '%s' "$input" | grep -oE '"prompt"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*"prompt"[[:space:]]*:[[:space:]]*"//;s/"$//')

arg=$(printf '%s' "$prompt" | sed 's|^[[:space:]]*/[^[:space:]]* *||' | awk '{print $1}' | sed 's|^@||' | sed 's|.*/changes/||' | sed 's|/$||' | xargs 2>/dev/null || true)
printf '%s' "$arg" > "$flag_file"
