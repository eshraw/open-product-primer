# Design: claude-mods

## Approach

`claude-mods` is a static registry of installable Claude Code function-hook mods (`packages/cli/src/lib/claude-mods.ts`, a plain array of `{ id, title, description, hookFiles }`). Two entry points read the same registry so there is exactly one place a future mod gets registered:

1. **`oprim init`** — after `promptAgentSelection()` resolves a selected-agents list, if `claude` is in it, a second `promptClaudeModsSelection(preChecked: [])` multi-select runs (new install → nothing pre-checked, since no mods can already be installed).
2. **`oprim claude-mods`** (new command, `commands/claude-mods.ts`) — for a project that already has `.claude/` installed. Reads `oprim/config.yaml`'s `claude_mods:` list to pre-check what's already selected, re-runs the same `promptClaudeModsSelection()` prompt, and diffs old vs. new selection to know which hooks to add/remove.

Before either path writes hook config, it checks whether `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS` is already active (`process.env` or `.claude/settings.json`'s `env` key). If at least one mod was selected and it isn't active, a y/n prompt (`promptEnableFunctionHooks()`) offers to write `env.CLAUDE_CODE_ENABLE_FUNCTION_HOOKS: "1"` into `.claude/settings.json`. A "no" answer still installs the mod's hook config (it'll simply no-op per the interceptor's own graceful-degradation requirement) but prints the manual two-option activation steps (shell env var, or hand-editing the `env` block).

Both paths converge on one `applyClaudeModsSelection(projectRoot, selectedIds, previousIds)` function in `lib/install-agent.ts`:
- For each newly-selected mod, merge its `hookFiles` entries into `.claude/settings.json` the same way the existing `on-prompt-submit.sh`/`on-stop.sh` hook registration merges today (additive, keyed by hook event, never clobbers unrelated hooks).
- For each deselected mod (present in `previousIds`, absent from `selectedIds`), remove exactly that mod's hook entries from `.claude/settings.json`.
- Write the resulting `selectedIds` to `oprim/config.yaml`'s `claude_mods:` key (new top-level key, same additive-merge convention `config-merge.ts` already uses for other new schema keys).

## Alternatives considered

- **One hook file per mod, always installed, gated by a runtime env check** — rejected: every mod would run on every project regardless of opt-in, defeating the purpose of a selection UI and risking unwanted behavior (e.g. BET-053's promote gate) on projects that never asked for it.
- **A single monolithic hook script that branches per enabled mod** — rejected: couples all future mods' logic into one file/one failure domain; the registry + per-mod hookFiles approach keeps each mod independently addable/removable.
- **Store selection only in `.claude/settings.json` (no `oprim/config.yaml` entry)** — rejected: `oprim doctor`/`oprim update` need a project-level, framework-agnostic record of "what's selected" that survives a `.claude/` directory being regenerated; `oprim/config.yaml` is that record, matching how `agents:` is already stored there rather than inferred from `.claude/`.

## Risks

- `.claude/settings.json` merge/removal must be surgical — accidentally touching hook entries not owned by a mod (e.g. the existing archive co-archival hooks) would regress unrelated behavior. Reuses the existing non-clobbering merge helper rather than a new one.
- The registry currently has one entry (BET-051's interceptor); the multi-select UI must still read cleanly with a single option (no degenerate "select one of one" UX).
