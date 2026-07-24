## Context

`/oprim:promote` currently has exactly one path: bet → OpenSpec change via `/opsx:propose`, hardcoded in `promoteContent()` (`install-agent.ts`, ~lines 1124–1166). A framework-selection prompt already exists (`promptFrameworkSelection()`, offering `openspec` / `none`), surfaced from `init.ts` and `update.ts`, but its answer is only persisted to Claude's `.claude/hooks/config.json` and only consumed by `hooksConfig()` for archive-skill aliasing — it never reaches `promoteContent()`. `oprim/config.yaml` has no framework key at all today; framework selection is implemented but effectively unspecced.

## Goals / Non-Goals

**Goals:**
- Let a project choose `native` as its speccing framework at `oprim init` / `oprim update`, with no OpenSpec dependency
- Give oprim a command/skill that authors a capability spec in RFC 2119 + Gherkin syntax and writes it to `oprim/specs/<capability>/spec.md`
- Make `/oprim:promote`'s Step 4 branch on the selected framework so `native` projects never invoke `/opsx:propose`
- Persist the framework selection in `oprim/config.yaml` so all agents (not just Claude) and `oprim doctor` can read it

**Non-Goals:**
- The change/current spec dir lifecycle (delta-merge on archive, ADDED/MODIFIED/REMOVED folding into current truth) — that is BET-024, which this bet unlocks and explicitly blocks on this one landing first
- Remote store resolution, the declarative-schema refactor, or `validate`/CI gating — later bets (BET-026/027/028)
- Any change to the `openspec` delegation path's behavior or output

## Decisions

**1. Storage location for native specs**: `oprim/specs/<capability>/spec.md`, mirroring OpenSpec's flat `specs/<capability>/spec.md` convention (no `current/` nesting), consistent with the direction BET-024 has already committed to. This is a flat placeholder structure until BET-024 layers the full change/current lifecycle on top.
Alternative considered: build the full change/current lifecycle now — rejected, it's explicitly BET-024's scope and doing it here would violate the bets' own sequencing (BET-023 unlocks BET-024, not the reverse).

**2. Config persistence**: add `integrations.spec_framework: openspec | native | none` to `oprim/config.yaml`, alongside the existing `integrations.openspec.{enabled, changes_dir}` keys (which stay, unchanged, for the `openspec` case).
Alternative considered: mirror the `graphify` pattern with a separate `integrations.native.enabled` boolean — rejected, it can't cleanly express a mutually-exclusive three-way choice (`openspec` / `native` / `none`) without a second read to resolve conflicts.

**3. `promoteContent()` signature**: accepts `framework: 'openspec' | 'native' | 'none'` and branches its generated instructions accordingly. Call sites already collect the framework via `promptFrameworkSelection()` during init/update — that value is threaded through instead of being discarded after `hooksConfig()`.

**4. Native generation as its own skill**: expose native spec generation as an independently invocable skill (naming left to `tasks.md`), matching how `criteria-authoring`, `pdr-authoring`, etc. are each their own skill, rather than inlining generation logic into the promote skill. The `native` branch of `/oprim:promote` simply invokes this skill.

## Risks / Trade-offs

- [Risk] Two framework-storage locations exist mid-transition (Claude's `.claude/hooks/config.json` and `oprim/config.yaml`) → Mitigation: `oprim/config.yaml` becomes the single source of truth going forward; `hooksConfig()` reads from it rather than deriving its own copy, so there's no dual-write drift once implemented.
- [Risk] Agent-authored native Gherkin specs may be lower quality than OpenSpec's output (the bet's own kill criterion) → Mitigation: reuse the same RFC 2119 + Gherkin conventions oprim already references from OpenSpec's writing-specs guide; keep the generation skill narrowly scoped rather than inventing new conventions.
- [Risk] `promoteContent()` and `install-agent.ts` generally are already large, heavily-branched string-literal functions → Mitigation: keep the native branch additive and structurally parallel to the existing `openspec` branch rather than refactoring; the underlying maintainability problem is BET-027's scope (declarative schemas), not this bet's.

## Migration Plan

- Existing projects default to their current behavior (`openspec` if enabled, else `none`) — no config migration required, `native` is purely additive
- `oprim update` adds the new `integrations.spec_framework` key to existing configs. If BET-025's general config-merge machinery hasn't landed yet when this bet is implemented, this bet does a minimal one-off merge-safe key addition rather than depending on BET-025's broader mechanism
- Rollback: drop `native` from `promptFrameworkSelection()`'s choices and remove the config key; the `openspec` and `none` paths are untouched throughout, so rollback carries no data-loss risk

## Open Questions

- Exact skill/command name for native spec generation (e.g. `oprim-spec`) — resolved in `tasks.md` / implementation
- Whether BET-025 (config merge-on-update) lands before or after this bet in practice, which determines whether this bet can lean on shared merge machinery or needs its own one-off
