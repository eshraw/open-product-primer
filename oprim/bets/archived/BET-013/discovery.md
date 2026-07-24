# Discovery: BET-013 Introduce atomic notes in oprim for lightweight thinking capture

## Problem
<!-- What specific pain or gap are we solving? Be concrete. -->
Ad-hoc observations, stray ideas, and cross-bet connections surfaced mid-session have no home smaller than a full `discovery.md` section or `bet-decision.md`. They either get lost, get force-fit into a hypothesis before they've earned it, or get duplicated in external scratch tools.

## User / Context
<!-- Who experiences this? In what workflow moment? -->
The bet owner (or Claude, co-working a session) mid-session, the moment an observation surfaces that isn't yet proven enough to belong in a discovery hypothesis or bet rationale.

## Hypotheses to test
<!-- What do we believe to be true that we need to validate? -->
- H1: A single markdown file per note, with minimal always-on frontmatter, is discoverable enough on its own to get referenced later without requiring the full OKF schema.
- H2: Coupling an "improved" frontmatter tier to `okf.enabled` reuses the opt-in mechanism from BET-022 without adding new config surface.

## Open questions
<!-- What do we not know yet that could change the direction? -->
- ~~Where do notes live?~~ Resolved — see Current thinking.
- ~~Does `tags` need a controlled vocabulary?~~ Resolved — see Current thinking.
- ~~What's the promotion path?~~ Resolved — see Current thinking.
- Does the promote skill's prefix dispatch (`NOTE-` vs `BET-`) need a shared lookup helper, or is duplicating the "scan dir, match ID" logic across `oprim-bet`/notes acceptable?
- Should a note's `tags` vocabulary be seeded from existing bet/PDR ids automatically, or authored by hand in `config.yaml`?

## Signal gathered
<!-- Research, usage data, conversations, experiments — add as you learn -->
- `openspec/specs/okf-frontmatter/spec.md` already defines the "improved" tier's field set (`type`, `title`, `description`, `tags`, `timestamp`) as the OKF opt-in pattern for `bet-decision`/`pdr`/`kpi-review` — reuse rather than reinvent.
- Decision (2026-07-24): notes carry frontmatter unconditionally, in two tiers, decoupling "notes are discoverable at all" from the OKF opt-in flag — addresses the kill criterion risk ("notes never referenced") for users who haven't opted into OKF.
- `oprim/config.yaml` already hosts sequencing/measurement config (`sequencing.wip_limits`, `measurement.amplitude`) — a `notes.tags` (or similar) controlled-vocabulary list slots into the same file rather than a new one.
- `/oprim:promote BET-042` already resolves an artifact from an ID argument as its first step (`oprim/bets/BET-XXX/bet-decision.md`) — prefix-based dispatch (`BET-` vs `NOTE-`) extends an existing pattern rather than introducing one.

## Current thinking
<!-- Working hypothesis on what to build and why -->
Two-tier frontmatter model:
- **Minimal (always-on, regardless of `okf.enabled`):** `type: note`, `title`, `tags: []`, `timestamp` — the bare fields needed to search/filter a note later.
- **Improved (when `okf.enabled: true`):** adds `description`, bringing a note's frontmatter to parity with the full field set already used by `bet-decision`/`pdr`/`kpi-review`.

Storage and linking: notes live in their own top-level directory (`oprim/notes/`), not nested under a bet. A note relates to a bet via an explicit mention (e.g. a `Bets: BET-NNN` reference in the note, or a linked note listed in the bet-decision's `## Links` section) rather than by directory placement — a note can predate, outlive, or span multiple bets.

Tags use a controlled vocabulary, defined in `oprim/config.yaml` (new `notes.tags` list or similar) rather than freeform strings — keeps note tags consistent with (and greppable against) bet/PDR ids and domain terms.

Promotion (note → bet) reuses the existing `/oprim:promote` skill rather than adding a new command. `/oprim:promote <ID>` dispatches on ID prefix: `BET-` keeps today's bet → OpenSpec-change behavior, `NOTE-` promotes a note into a new bet (pre-filling `bet-decision.md`'s `Why now` from the note's body). The ID itself disambiguates which path runs, so there's no risk of invoking the "wrong" promotion — notes → bets → OpenSpec changes forms one consistent three-tier promotion ladder (informal capture → owned decision → executable spec).

## Next steps
<!-- Concrete actions to advance discovery -->
- [ ] Draft the two note template variants (minimal / OKF) in `lib/templates.ts`, mirroring the existing `bet-decision.md` pattern
- [ ] Define a note file naming/id convention (`NOTE-NNN`, to match the `BET-NNN` pattern the promote dispatch relies on)
- [ ] Add `notes.tags` controlled vocabulary to `lib/templates.ts`'s `config.yaml` template and to `oprim/config.yaml` itself
- [ ] Extend `promoteContent()` in `install-agent.ts` with ID-prefix dispatch and the note → bet path
- [ ] Check whether `oprim/index.md` (OKF bundle) should link to `oprim/notes/` when `okf.enabled`
