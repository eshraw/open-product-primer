#!/usr/bin/env bash
# PostToolUse hook: fires after every Skill tool call.
# If the skill matches opsx:archive or openspec-archive-change, prompts
# Claude to co-archive the linked bet from the change's proposal.md.

set -euo pipefail

input=$(cat)

tool_name=$(echo "$input" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('tool_name', ''))" 2>/dev/null || true)

if [ "$tool_name" != "Skill" ]; then
  exit 0
fi

skill_name=$(echo "$input" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('tool_input', {}).get('skill', ''))" 2>/dev/null || true)

if [ "$skill_name" != "opsx:archive" ] && [ "$skill_name" != "openspec-archive-change" ]; then
  exit 0
fi

cat <<'EOF'
A change was just archived using an openspec archive skill. Please check the archived change's proposal.md `## Context` section for a line matching `- Bet: BET-NNN`. If a Bet ID is found, invoke `/oprim:archive` for that bet ID. If no Bet ID is found, take no action.
EOF
