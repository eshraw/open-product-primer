# Design: PDR surfacing default flip (pdr-proactive-surfacing)

## Approach
Flip the hardcoded default in `promptPdrSurfacing()` (`packages/cli/src/lib/install-agent.ts:83-86`) from `default: false` to `default: true`, and change the prompt copy from `(y/N)` to `(Y/n)` so the shown default matches the new behavior. `init.ts` and `update.ts` already thread the returned `pdrSurfacing` boolean through `installAgentSkills(...)` unchanged — this is a one-line behavioral flip, not a new code path.

## Alternatives considered
- Keep opt-in (status quo) — preserves user choice but the feature stays invisible; most installs never enable it today
- Improve the prompt description without changing the default — better UX, same adoption ceiling
- Remove the prompt and always enable — maximizes adoption but removes user control entirely; rejected in favor of keeping a prompt (this bet only flips its default)

## Risks
- Users who don't read the prompt get PDR surfacing on unintentionally — accepted risk, covered by the bet's kill criteria (revert the default if this generates confirmed confusion/complaints)
- No persisted per-project setting exists yet: `oprim update` re-prompts fresh every run with the same `default: true`, so a user who declined once must decline again on each `update` — this is existing re-prompt behavior, unchanged by this bet

## Out of scope
- Persisting the opt-in/opt-out choice across `update` runs
- Any change to `oprim:context`'s keyword-matching logic
