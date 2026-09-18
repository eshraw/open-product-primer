# Decision: BET-074 Migrate claude-mods to function hooks, add drift-interceptor UI, and scaffold future mod UI

## Status
- Decision: Build now
- Date: 2026-09-17
- Owner: Eshane Rawat
- Review date: 2026-10-01

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)
- [ ] 1-way door (hard to reverse — requires higher confidence before committing)

## Risk profile
- **Value risk**: Low — directly answers "shouldn't a mod display UI?"; unblocks 24 pending `-mod` bets (BET-052–073) that all depend on the same plugin pattern.
- **Usability risk**: Medium — `register(on, options)`/`$.on`/`$.ui.render` is a different, early-access mental model than the classic JSON-over-stdio hook shape; whoever writes BET-052+ needs to learn it.
- **Feasibility risk**: Medium — function hooks are early access and "move between releases" per the engine's own docs; the plugin manifest/hooks.json wiring and `ui.render` validation are untested in this codebase.
- **Business viability risk**: Low — internal dev-tooling change to this repo's own oprim install; no external users, revenue, or legal surface.

## Why now
- `CLAUDE_MODS_REGISTRY` (packages/cli/src/lib/claude-mods.ts, shipped in BET-051/PR #67) already checks and offers to enable `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS`, but its one entry (`spec-delta-drift-interceptor`) still emits a classic `PreToolUse|PostToolUse|UserPromptSubmit|Stop` shell-command hook — the env var it gates on has no effect on how that hook actually runs.
- Classic hooks are text-only (`{decision, reason}` over stdout); they structurally cannot draw UI. The real function-hooks engine (`$.ui.render`, `$.ui.toast`, `ui.render` component hooking) can, per Anthropic's plugin-authoring docs and github.com/anthropics/claude-code/issues/91870.
- BET-052 through BET-073 (24 bets) all describe future "-mod" features; none of them can get real UI until the registry and installer actually target the plugin engine instead of shell-command hooks.

## Alternatives considered
- Leave the first mod as a classic hook and only prompt-format its `reason` string better (markdown, truncation). Rejected: still no real UI (toast/panel), and doesn't unblock BET-052+.
- Write BET-052+ mods each with their own ad hoc plugin scaffolding as they come up. Rejected: duplicates manifest/hooks.json boilerplate per mod instead of extending the single shared registry the existing spec (`oprim/specs/claude-mods/spec.md`) already centralizes.

## Expected outcomes
- spec-delta drift on a bet's spec.md write: surfaced via a visible UI element (toast and/or `ui.render` panel), not just a text block reason, in 100% of drift cases → target within this bet's timeframe.
- `CLAUDE_MODS_REGISTRY` entry shape supports a `$.ui`-based mod (plugin manifest + hooks module) alongside or instead of `ClaudeModHookFile`, documented well enough that a future `-mod` bet can add an entry without re-deriving the plugin scaffolding from scratch.

## Kill criteria / rollback trigger
- If `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS`/the plugin engine proves too unstable across Claude Code releases to keep the mod working reliably, revert `spec-delta-drift-interceptor` to its current classic-hook implementation (already shipped and working) and defer the registry migration until the engine stabilizes.

## Links
- PDRs: None
- OpenSpec change: (to be filled when promoted)
- Spec (delta): oprim/bets/pending/BET-074-migrate-claude-mods-to-function-hooks/specs/claude-mods/spec.md
- Spec (delta): oprim/bets/pending/BET-074-migrate-claude-mods-to-function-hooks/specs/spec-delta-drift-interceptor/spec.md
