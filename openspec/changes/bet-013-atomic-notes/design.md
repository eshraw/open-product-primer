## Context

oprim already has four markdown artifact types (`bet-decision`, `pdr`, `kpi-review`, `spec`), and one of them — the OKF frontmatter feature (`openspec/specs/okf-frontmatter/spec.md`) — established an opt-in, additive frontmatter convention (`type`, `title`, `description`, `tags`, `timestamp`) reused across templates. `/oprim:promote` currently only accepts `BET-` ids and only performs bet → OpenSpec-change promotion. BET-013's discovery (`oprim/bets/BET-013/discovery.md`) resolved the shape of atomic notes against this existing structure: own top-level directory, two-tier frontmatter, controlled tag vocabulary, and promotion via the existing promote skill rather than a new command.

## Goals / Non-Goals

**Goals:**
- A lightweight note format that is discoverable (searchable/filterable) regardless of whether a project has opted into OKF.
- Reuse existing scaffolding conventions (ID assignment, skill structure, promote dispatch) instead of introducing new ones.
- Let a note graduate into a bet through the existing `/oprim:promote` skill.

**Non-Goals:**
- Direct note → OpenSpec-change promotion. A note must go through a bet first — this preserves the existing authority boundary (oprim owns why/order/outcome; OpenSpec owns what/how).
- Changes to `criteria.yaml` or the existing `bet-decision`/`pdr`/`kpi-review` template structure.
- Note lifecycle/archival tooling (e.g. an `oprim doctor` check for orphaned or stale notes) — a candidate for a future bet, not this one.

## Decisions

1. **Notes live in `oprim/notes/` as a flat top-level directory, not nested under a bet.**
   Rationale: a note can predate a bet, span multiple bets, or never become a bet at all (accumulating as searchable substrate). Nesting under `oprim/bets/BET-NNN/notes/` would force premature commitment to a single owning bet.
   Alternative considered: per-bet nesting — rejected for the reason above.

2. **Frontmatter is two-tiered, and the minimal tier is decoupled from `okf.enabled`.**
   Rationale: BET-013's own kill criterion is "notes are never referenced." A frontmatter-less note for users who declined the OKF opt-in makes that more likely, since there's nothing to search or filter on. Minimal frontmatter (`type`, `title`, `tags`, `timestamp`) is cheap and needed regardless of OKF.
   Alternative considered: gate all note frontmatter behind `okf.enabled`, matching the other three templates exactly — rejected; it ties basic discoverability to an unrelated opt-in flag.

3. **Tags use a controlled vocabulary (`oprim/config.yaml`'s `notes.tags`), not freeform strings.**
   Rationale: notes are the one artifact type meant to be found primarily by tag rather than by title or ID, so consistent, greppable tags matter more here than for bets/PDRs.
   Alternative considered: freeform tags — rejected as it recreates the discoverability gap the frontmatter is meant to close.

4. **Notes relate to bets by explicit mention, not directory placement.**
   Rationale: allows a note to relate to zero, one, or many bets without forcing a single "owning" bet up front.

5. **Promotion (note → bet) reuses `/oprim:promote` with ID-prefix dispatch, not a new command.**
   Rationale: notes → bets → OpenSpec changes forms one three-tier promotion ladder. Dispatching on the ID prefix (`NOTE-` vs `BET-`) keeps a single mental model and lets the ID itself disambiguate the path.
   Alternative considered: a separate `/oprim:promote-note` command — rejected; a second verb just relocates the "which one do I use" decision instead of removing it.

## Risks / Trade-offs

- [Two-tier frontmatter adds branching to note-scaffolding logic] → Mitigate by mirroring the existing conditional pattern already used for bet-decision/pdr/kpi-review frontmatter in `install-agent.ts`, rather than inventing a new shape.
- [Controlled vocabulary in `config.yaml` could go stale] → Mitigate by keeping it a plain flat list the user edits directly; no separate tag-management UI in this change.
- [Note → bet promotion could produce a thin bet-decision if the source note is sparse] → Mitigate by pre-filling only `Why now` from the note body and leaving `Alternatives`, `Expected outcomes`, and `Kill criteria` as template placeholders — promotion drafts, it doesn't fabricate.
- [Prefix dispatch could silently no-op on an ID matching neither `BET-` nor `NOTE-`] → Mitigate by having the skill explicitly report an unrecognized-prefix error rather than falling through silently.

## Migration Plan

Purely additive — no existing bet/PDR/KPI-review/criteria template changes shape. `oprim/notes/` and `notes.tags` are created lazily, the first time a user scaffolds a note (or runs `oprim update` on a project that opts in). Rollback is a straightforward revert: delete `oprim/notes/` and the `promoteContent()` dispatch change; no data migration needed for existing archived bets.

## Open Questions

Resolved (2026-07-24):
- `notes.tags` is written lazily — `oprim-note` adds it to `oprim/config.yaml` the first time a note is scaffolded, if absent. `oprim update` does not retroactively add it.
- An empty/missing `notes.tags` vocabulary does not block note creation — the first tag(s) used are accepted and appended to `notes.tags`, so the vocabulary self-seeds from usage rather than requiring upfront authoring.
- No `oprim doctor` check for dangling `Bets:` references in this change — out of scope per the Non-Goals above; a candidate for a future bet if it proves to be a real problem.
