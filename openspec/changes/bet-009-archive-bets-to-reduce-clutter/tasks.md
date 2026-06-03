## 1. Create oprim:archive skill (bet-only, no openspec knowledge)

- [ ] 1.1 Create the `oprim:archive` skill file accepting a bet ID
- [ ] 1.2 Implement directory move: `oprim/bets/BET-NNN/` → `oprim/bets/archived/BET-NNN/` (create `archived/` if missing)
- [ ] 1.3 Implement `sequence.yaml` entry removal for the archived bet ID across all buckets
- [ ] 1.4 Add dependency check: warn if bet ID appears in any other entry's `blocked_by` or `unlocks`, prompt confirmation before proceeding
- [ ] 1.5 Add error handling for non-existent bet ID

## 2. Wire PostToolUse hook for co-archival coordination

- [ ] 2.1 Create `.claude/hooks/on-skill-archive.sh` — reads skill name from stdin JSON, outputs a co-archival prompt if skill matches `opsx:archive` or `openspec-archive-change`, exits silently otherwise
- [ ] 2.2 Add PostToolUse hook entry to `.claude/settings.json` matching on the `Skill` tool and running the hook script

## 3. Verify spec compliance

- [ ] 3.1 Run `opsx:archive` on a change linked to a bet — confirm hook fires and Claude invokes `oprim:archive` for the linked bet
- [ ] 3.2 Run `opsx:archive` on a change with no bet link — confirm hook fires but no bet action is taken
- [ ] 3.3 Run `oprim:archive` directly on a bet — confirm bet is archived and hook does not re-trigger
- [ ] 3.4 Run `oprim:archive` when the bet has active dependents — confirm warning and confirmation prompt appear
- [ ] 3.5 Confirm all other `sequence.yaml` entries are unchanged after a successful archive
