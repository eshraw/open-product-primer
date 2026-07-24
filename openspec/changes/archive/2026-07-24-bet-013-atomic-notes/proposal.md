## Context

Promoted from [BET-013](../../../oprim/bets/BET-013/bet-decision.md) ("Introduce atomic notes in oprim for lightweight thinking capture"), decision: Build now, 2026-06-27.

## Why

Ad-hoc observations, stray ideas, and cross-bet connections surfaced mid-session currently have no home smaller than a full `discovery.md` section or `bet-decision.md` — they get lost, get force-fit into a hypothesis before they've earned it, or get duplicated in external scratch tools. A lightweight, always-discoverable capture layer reduces that friction and lets bets accumulate more useful thinking over time.

## What Changes

- Add a new `oprim/notes/` top-level directory holding one markdown file per note (`NOTE-NNN-<slug>.md`), separate from `oprim/bets/`.
- Give every note a two-tier YAML frontmatter model:
  - **Minimal (always-on, regardless of `okf.enabled`)**: `type: note`, `title`, `tags: []`, `timestamp`.
  - **Improved (when `okf.enabled: true`)**: adds `description`, matching the field set already used by `bet-decision`/`pdr`/`kpi-review` (see `openspec/specs/okf-frontmatter/spec.md`).
- Notes relate to bets by explicit mention (a `Bets: BET-NNN` reference in the note, or a link in the bet-decision's `## Links` section), not by directory nesting — a note can predate, outlive, or span multiple bets.
- Add a `notes.tags` controlled-vocabulary list to `oprim/config.yaml` (alongside existing `sequencing`/`measurement` config) so note tags stay consistent instead of freeform.
- Add a new `oprim-note` skill (mirroring `oprim-bet`) that scaffolds `oprim/notes/NOTE-NNN-<slug>.md` with the correct frontmatter tier.
- Extend `/oprim:promote` with ID-prefix dispatch: `BET-` keeps today's bet → OpenSpec-change behavior unchanged; `NOTE-` promotes a note into a new bet, pre-filling `bet-decision.md`'s `Why now` from the note's body and registering the new bet in `oprim/sequence.yaml`. The ID prefix is the sole disambiguator, so there is no new command surface and no risk of invoking the wrong promotion path.

## Capabilities

### New Capabilities
- `note-authoring`: Scaffolding a new atomic note in `oprim/notes/`, including the two-tier frontmatter model (minimal always-on, improved when OKF is enabled) and the `notes.tags` controlled vocabulary.

### Modified Capabilities
- `openspec-promotion-contract`: `/oprim:promote` gains ID-prefix dispatch so a `NOTE-` id promotes a note into a new bet (instead of only accepting `BET-` ids for bet → OpenSpec-change promotion).

## Impact

- `packages/cli/src/lib/templates.ts` — new note template (minimal/OKF variants); `config.yaml` template gains a `notes.tags` list.
- `packages/cli/src/lib/install-agent.ts` — new `oprim-note` skill content; `promoteContent()` gains ID-prefix dispatch and the note → bet path.
- `oprim/config.yaml` — new `notes.tags` vocabulary.
- No changes to `criteria.yaml` or the existing `bet-decision`/`pdr`/`kpi-review` templates.
- Reversible: additive-only, no breaking changes to existing bet/PDR/KPI-review workflows or to users who haven't opted into OKF.
