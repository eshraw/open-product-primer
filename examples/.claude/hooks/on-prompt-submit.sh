#!/usr/bin/env bash
# UserPromptSubmit hook: detects lifecycle slash commands and sets pending flags.

archive_flag=".claude/hooks/.archive-pending"
nudge_flag=".claude/hooks/.sequence-nudge"

input=$(cat)

# Archive co-archival detection
if printf '%s' "$input" | grep -qE '"prompt"[[:space:]]*:[[:space:]]*"[^"]*(opsx:archive|openspec-archive-change)'; then
  prompt=$(printf '%s' "$input" | grep -oE '"prompt"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*"prompt"[[:space:]]*:[[:space:]]*"//;s/"$//')
  arg=$(printf '%s' "$prompt" | sed 's|^[[:space:]]*/[^[:space:]]* *||' | awk '{print $1}' | sed 's|^@||' | sed 's|.*/changes/||' | sed 's|/$||' | xargs 2>/dev/null || true)
  printf '%s' "$arg" > "$archive_flag"
fi

# Bet creation detection
if printf '%s' "$input" | grep -qE '"prompt"[[:space:]]*:[[:space:]]*"[^"]*oprim:bet'; then
  printf 'bet-created' > "$nudge_flag"
fi

# Bet promotion detection
if printf '%s' "$input" | grep -qE '"prompt"[[:space:]]*:[[:space:]]*"[^"]*oprim:promote'; then
  printf 'bet-promoted' > "$nudge_flag"
fi
