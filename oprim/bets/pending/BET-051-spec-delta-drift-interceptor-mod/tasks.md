# Tasks: BET-051

## 1. Mod registry
- [x] 1.1 Create `packages/cli/src/lib/claude-mods.ts` exporting a static array of mod entries: `{ id, title, description, hookFiles }`
- [x] 1.2 Register the spec-delta-drift interceptor as the registry's first (and currently only) entry

## 2. Shared apply logic
- [x] 2.1 Add `applyClaudeModsSelection(projectRoot, selectedIds, previousIds)` to `lib/install-agent.ts`
- [x] 2.2 Merge newly-selected mods' `hookFiles` into `.claude/settings.json` using the existing non-clobbering hook-merge convention
- [x] 2.3 Remove deselected mods' hook entries from `.claude/settings.json` without touching unrelated hooks
- [x] 2.4 Write the resulting selection to `oprim/config.yaml`'s new `claude_mods:` key
- [x] 2.5 Add `isFunctionHooksActive(projectRoot)` — checks `process.env.CLAUDE_CODE_ENABLE_FUNCTION_HOOKS` and `.claude/settings.json`'s `env` key
- [x] 2.6 Add `promptEnableFunctionHooks()` y/n prompt, run only when ≥1 mod selected and hooks not already active
- [x] 2.7 On yes: merge `env.CLAUDE_CODE_ENABLE_FUNCTION_HOOKS: "1"` into `.claude/settings.json`
- [x] 2.8 On no: still install selected mods' hook config, print manual activation instructions (shell env var or `.claude/settings.json` `env` block) plus a no-op-until-activated note

## 3. oprim init — second prompt
- [x] 3.1 Add `promptClaudeModsSelection(preChecked)` to `lib/install-agent.ts` (multi-select, same UX pattern as `promptAgentSelection`)
- [x] 3.2 In `commands/init.ts`, after agent selection, if `claude` is among the selected agents, run the mods prompt (pre-checked from `oprim/config.yaml`'s `claude_mods:` — empty on a genuinely new install, per the `init-agent-selection` delta's re-run scenario) and call `applyClaudeModsSelection`
- [x] 3.3 Skip the second prompt entirely when Claude Code is not selected

## 4. oprim claude-mods command (existing installs)
- [x] 4.1 Create `commands/claude-mods.ts`, registered in `cli.ts`
- [x] 4.2 Exit with a clear error if `claude` is not in `oprim/config.yaml`'s `agents:` list (no `.claude/` install)
- [x] 4.3 Read `claude_mods:` from config to pre-check the multi-select prompt
- [x] 4.4 On confirm, call `applyClaudeModsSelection` with old vs. new selection; support selecting zero (uninstall all mods)

## 5. Interceptor mod itself (spec-delta-drift-interceptor capability)
- [x] 5.1 Add the interceptor hook script reusing `checkSpecDeltaDrift()` from `lib/validate-checks.ts`
- [x] 5.2 Wire it as `hookFiles` in the registry entry from Task 1.2

## 6. init-agent-selection (MODIFIED)
- [x] 6.1 Update `init-agent-selection`'s spec scenarios to reflect the new second prompt firing only when Claude Code is selected
