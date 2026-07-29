## 1. Create oprim:archive skill (bet-only, no openspec knowledge)

- [x] 1.1 Create the `oprim:archive` skill file accepting a bet ID
- [x] 1.2 Implement directory move: `oprim/bets/BET-NNN/` → `oprim/bets/archived/BET-NNN/` (create `archived/` if missing)
- [x] 1.3 Implement `sequence.yaml` entry removal for the archived bet ID across all buckets
- [x] 1.4 Add dependency check: warn if bet ID appears in any other entry's `blocked_by` or `unlocks`, prompt confirmation before proceeding
- [x] 1.5 Add error handling for non-existent bet ID

## 2. Wire UserPromptSubmit + Stop hooks for co-archival coordination

- [x] 2.1 Create `.claude/hooks/on-prompt-submit.sh` — reads framework from `config.json`, matches archive slash commands in the submitted prompt, writes change name to `.archive-pending` flag file; exits silently for non-archive prompts
- [x] 2.2 Create `.claude/hooks/on-stop.sh` — reads flag file, resolves change name (or infers from most recent archive entry when no-arg), extracts Bet ID from archived `proposal.md`, outputs `{"decision":"block","reason":"..."}` to inject co-archive prompt; exits silently when flag absent or no Bet ID found
- [x] 2.3 Register `UserPromptSubmit` and `Stop` hooks in `.claude/settings.json`

## 3. Wire installer and doctor

- [x] 3.1 Add `oprim-archive` to `CLAUDE_SKILLS` in `install-agent.ts`
- [x] 3.2 Add `archive.md` to `CLAUDE_COMMANDS` in `install-agent.ts`
- [x] 3.3 Add `promptFrameworkSelection()` to `install-agent.ts` — reads existing `config.json` or prompts user on first install; call from `init.ts` and `update.ts` before installing claude skills
- [x] 3.4 Embed `hooksConfig()`, `ON_PROMPT_SUBMIT_HOOK`, `ON_STOP_HOOK` in `install-agent.ts`; write hook files + chmod + `config.json` in `installAgentSkills`; add tombstone to remove legacy `on-skill-archive.sh`
- [x] 3.5 Replace `mergeClaudeSettingsHook()` with `mergeClaudeSettingsHooks()` — registers UserPromptSubmit + Stop entries, removes legacy PostToolUse/Skill entry
- [x] 3.6 Update `checkClaudeHooks()` in `doctor.ts` — checks `on-prompt-submit.sh`, `on-stop.sh`, and their settings.json registrations

## 4. Verify spec compliance

- [x] 4.1 Run `oprim:archive` directly on a bet — confirm bet is archived and hook does not re-trigger
- [x] 4.2 Run `oprim:archive` when the bet has active dependents — confirm warning and confirmation prompt appear
- [x] 4.3 Confirm all other `sequence.yaml` entries are unchanged after a successful archive
- [ ] 4.4 Invoke `/opsx:archive` on a change linked to a bet — confirm `UserPromptSubmit` sets flag, `Stop` hook fires and Claude invokes `oprim:archive` for the linked bet
- [ ] 4.5 Invoke `/opsx:archive` on a change with no bet link — confirm `Stop` hook fires but exits silently (no bet action)
- [ ] 4.6 Invoke `/opsx:archive` with no args — confirm `Stop` hook infers the most recent archive entry and acts correctly
