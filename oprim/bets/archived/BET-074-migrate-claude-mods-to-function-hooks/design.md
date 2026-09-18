# Design: claude-mods → function-hooks migration

## Scope
Covers the `claude-mods` capability only: how `CLAUDE_MODS_REGISTRY` entries are shaped and how `oprim init`/`oprim claude-mods` install them. UI behavior for the drift-interceptor mod specifically is covered by the `spec-delta-drift-interceptor` capability delta in this same bet.

## Problem
`CLAUDE_MODS_REGISTRY` (`packages/cli/src/lib/claude-mods.ts`) already checks and offers to activate `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS`, but every entry still installs as a classic `PreToolUse|PostToolUse|UserPromptSubmit|Stop` shell-command hook in `.claude/settings.json`. The env-var gate currently has no effect on *how* a mod actually runs — it's dead weight. Classic hooks are text-only (`{decision, reason}` over stdout) and structurally cannot render UI.

## Approach
Extend the registry entry shape so a mod can declare either:
- the existing `ClaudeModHookFile` shape (classic shell-command hook), for backward compatibility, or
- a plugin shape: a plugin manifest + `hooks.json` (+ optional `$.ui`-based hooks module), which installs into Claude Code's plugin engine instead of `.claude/settings.json`'s classic `hooks` block.

`oprim init`'s mod-selection prompt and `oprim claude-mods` both already gather the same registry; the install/uninstall path in `install-agent.ts` (or a new sibling module) branches on which shape an entry declares. A plugin-shaped mod's install writes its manifest/`hooks.json` into the project's plugin directory rather than merging into `.claude/settings.json`'s `hooks` key; removal deletes only that mod's plugin directory, leaving other mods and oprim's own `on-prompt-submit.sh`/`on-stop.sh` hooks untouched.

## Alternatives considered
- Keep a single `ClaudeModHookFile` shape and special-case the drift interceptor mod's install path outside the registry. Rejected: doesn't give BET-052–073 a reusable pattern, defeats the point of a shared registry.
- Require every registry entry to migrate to the plugin shape immediately. Rejected: unnecessary churn for existing working classic-hook mods; the registry should support both shapes side by side.

## Risks
- Plugin manifest/`hooks.json` wiring is untested in this codebase; function hooks are early access and may change shape between Claude Code releases (per the bet's kill criteria, revert to the classic-hook implementation if this proves too unstable).
