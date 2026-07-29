#!/usr/bin/env bash
# Stop hook: archive co-archival coordination and sequencing nudges.

archive_flag=".claude/hooks/.archive-pending"
nudge_flag=".claude/hooks/.sequence-nudge"

# --- Archive co-archival block ---
if [ -f "$archive_flag" ]; then
  change=$(tr -d '[:space:]' < "$archive_flag")

  if [ -z "$change" ]; then
    latest=$(ls openspec/changes/archive/ 2>/dev/null | sort -r | head -1)
    [ -n "$latest" ] && change=$(echo "$latest" | sed -E 's/^[0-9]{4}-[0-9]{2}-[0-9]{2}-//')
  fi

  if [ -n "$change" ]; then
    archive_dir=$(ls openspec/changes/archive/ 2>/dev/null | grep -F "$change" | sort -r | head -1)
    if [ -n "$archive_dir" ]; then
      rm -f "$archive_flag"
      proposal="openspec/changes/archive/$archive_dir/proposal.md"
      if [ -f "$proposal" ]; then
        bet_id=$(grep -oE 'BET-[0-9]+' "$proposal" | head -1)
        if [ -n "$bet_id" ]; then
          printf '{"decision":"block","reason":"The openspec change '''%s''' was just archived. Its proposal.md references %s. Please invoke `/oprim:archive %s` to co-archive the linked bet."}\n' "$change" "$bet_id" "$bet_id"
          exit 0
        fi
      fi
    fi
  fi
fi

# --- Sequencing nudge from lifecycle event ---
if [ -f "$nudge_flag" ]; then
  context=$(cat "$nudge_flag")
  rm -f "$nudge_flag"

  case "$context" in
    bet-created)
      printf '\n💡 A new bet was added to your backlog. Run `/oprim:sequence` to check if it should be pulled into Now or Next.\n'
      ;;
    bet-promoted)
      printf '\n💡 A bet was promoted to an OpenSpec change. Run `/oprim:sequence` to verify the board reflects this.\n'
      ;;
  esac
fi

# --- Open Now slot check ---
if [ -f "oprim/sequence.yaml" ]; then
  wip_limit=$(awk '/^wip_limits:/{in_wip=1} in_wip && /^  now:/{print $2; exit} /^[^ ]/{in_wip=0}' oprim/sequence.yaml 2>/dev/null)
  now_count=$(awk '/^now:/{in_now=1; next} in_now && /^[^ ]/{in_now=0} in_now && /^  - id:/{count++} END{print count+0}' oprim/sequence.yaml 2>/dev/null)
  next_count=$(awk '/^next:/{in_next=1; next} in_next && /^[^ ]/{in_next=0} in_next && /^  - id:/{count++} END{print count+0}' oprim/sequence.yaml 2>/dev/null)

  if [ -n "$wip_limit" ] && [ -n "$now_count" ] && [ -n "$next_count" ]; then
    if [ "$now_count" -lt "$wip_limit" ] 2>/dev/null && [ "$next_count" -gt 0 ] 2>/dev/null; then
      printf '\n💡 Now lane has capacity (%s/%s). Run `/oprim:sequence` to pull something from Next.\n' "$now_count" "$wip_limit"
    fi
  fi
fi
