## Context

Promoted from [BET-022](../../../oprim/bets/BET-022-align-oprim-workspace-structure-with-okf/bet-decision.md) ("Align oprim workspace structure with Open Knowledge Format"), decision: Build now, 2026-06-30.

## Why

OKF (Open Knowledge Format) v0.1 was just published by Google Cloud as a vendor-neutral, markdown+YAML-frontmatter convention for knowledge that agents can consume without bespoke tooling. oprim's `bets/`, `decisions/`, and `reviews/` artifacts are already markdown files with an implicit `type` (encoded only in directory/filename convention, not in machine-readable frontmatter). Adding OKF frontmatter lets any OKF-aware agent orient on an oprim workspace without reading CLAUDE.md or learning oprim-specific structure first — early positioning ahead of broader OKF ecosystem adoption.

## What Changes

- Add OKF-compliant YAML frontmatter (`type`, `title`, `description`, `tags`, `timestamp`) to the templates for `bet-decision.md`, `pdr.md`, and `kpi-review.md` in `packages/cli/src/lib/templates.ts`.
- Update `packages/cli/src/lib/install-agent.ts` so newly scaffolded bets, PDRs, and KPI reviews emit this frontmatter when the feature is enabled.
- Add an opt-in prompt to `oprim init` and `oprim update`, mirroring the existing PDR-proactive-surfacing opt-in pattern — OKF frontmatter emission is **off by default**.
- Add a prototype `oprim/index.md` OKF bundle entrypoint that lists and links the workspace's OKF-frontmattered artifacts, generated only when the flag is enabled.
- `oprim/templates/criteria.yaml` is explicitly **out of scope** — it stays pure YAML with no frontmatter, since it has no prose body to separate frontmatter from.
- Existing archived artifacts are **not** rewritten; frontmatter only applies to newly scaffolded artifacts going forward (forward-compatible, non-breaking).

## Capabilities

### New Capabilities
- `okf-frontmatter`: Feature flag (opt-in via `oprim init`/`oprim update`) controlling whether oprim emits OKF-compliant YAML frontmatter on newly scaffolded markdown artifacts, plus the `oprim/index.md` OKF bundle entrypoint generated when enabled.

### Modified Capabilities
- `bet-authoring`: When OKF frontmatter is enabled, `oprim-bet` SHALL prepend OKF frontmatter (`type: bet-decision`, `title`, `description`, `tags`, `timestamp`) to newly scaffolded `bet-decision.md` files.
- `pdr-authoring`: When OKF frontmatter is enabled, `oprim-pdr` SHALL prepend OKF frontmatter (`type: pdr`, `title`, `description`, `tags`, `timestamp`) to newly scaffolded PDR files.
- `kpi-review-authoring`: When OKF frontmatter is enabled, `oprim-review` SHALL prepend OKF frontmatter (`type: kpi-review`, `title`, `description`, `tags`, `timestamp`) to newly scaffolded KPI review files.

## Impact

- `packages/cli/src/lib/templates.ts` — bet-decision, pdr, kpi-review template strings gain a frontmatter block.
- `packages/cli/src/lib/install-agent.ts` — skill content generation branches on the new opt-in flag, mirroring the existing PDR-surfacing conditional pattern.
- `packages/cli/src/commands/init.ts` (and `update.ts`) — new opt-in prompt, analogous to the PDR-surfacing prompt.
- No changes to `criteria.yaml`, `openspec/` spec authoring, or any existing archived artifact.
- Reversible: 2-way door, disabled by default, no breaking changes to existing workspaces that decline the opt-in.
