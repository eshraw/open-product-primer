#!/usr/bin/env bash
# UserPromptSubmit hook: detects archive slash commands and sets a pending flag.

config_file=".claude/hooks/config.json"
flag_file=".claude/hooks/.archive-pending"

framework="openspec"
if [ -f "$config_file" ]; then
  framework=$(python3 -c "import sys,json; print(json.load(open('$config_file')).get('framework','openspec'))" 2>/dev/null || echo "openspec")
fi

prompt=$(cat | python3 -c "import sys,json; print(json.load(sys.stdin).get('prompt',''))" 2>/dev/null || true)

[ -z "$prompt" ] && exit 0

if [ "$framework" = "openspec" ]; then
  if echo "$prompt" | grep -qE '^[[:space:]]*/(opsx:archive|openspec-archive-change)([[:space:]]|$)'; then
    arg=$(echo "$prompt" | sed 's|^[[:space:]]*/[^[:space:]]* *||' | awk '{print $1}' | sed 's|^@||' | sed 's|.*/changes/||' | sed 's|/$||' | xargs 2>/dev/null || true)
    echo "$arg" > "$flag_file"
  fi
fi
