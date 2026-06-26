## Context

Bet directories are currently named `BET-NNN/`. The `oprim-bet` skill derives the next ID by scanning for `BET-(\d+)` directories in `oprim/bets/`. The `oprim:archive` skill moves `oprim/bets/BET-NNN/` directly by constructing the path from the bare ID.

Both skills need small, isolated changes — there is no architectural shift, no new dependency, and no data model change beyond the directory name format.

## Goals / Non-Goals

**Goals:**
- New bets get slugged directories (`BET-NNN-<slug>/`) automatically
- `oprim:archive` resolves a bare ID to its actual directory (with or without slug)
- ID scanning correctly handles both `BET-NNN/` and `BET-NNN-<slug>/` in the same directory

**Non-Goals:**
- Migrating existing `BET-NNN/` directories — old format remains valid indefinitely
- Changing the ID format in `sequence.yaml` — YAML entries stay as bare `BET-NNN`
- Adding slug scanning to `oprim doctor`

## Decisions

### Slug derivation
Derive the slug from the bet title: lowercase, strip punctuation, replace spaces with `-`, truncate to ~40 chars at a word boundary. Done inline in the skill — no helper script needed.

Example: "Add title slugs to bet directories for scannability" → `add-title-slugs-to-bet-dirs`

**Alternative considered**: Store the slug in `sequence.yaml` alongside the ID. Rejected — adds schema complexity for marginal benefit; the directory name is the canonical source.

### ID scanning regex
Change the scan pattern from `^BET-(\d+)$` to `^BET-(\d+)(-.*)?$` so both formats match. Extract group 1 as the integer. Apply to both `oprim/bets/` and `oprim/bets/archived/` (fixes the pre-existing off-by-one bug where archived bets were not counted).

### Archive resolution
In `oprim:archive`, glob for `oprim/bets/BET-NNN*/` (i.e., prefix match) instead of constructing the exact path. If exactly one match is found, use it. If zero or multiple, report an error.

## Risks / Trade-offs

- **Slug staleness**: If a bet title changes after creation, the directory name becomes misleading. Mitigation: skill warns users not to rename directories after creation; this is a known acceptable trade-off (same as PDRs and OpenSpec changes).
- **Glob ambiguity on prefix collision**: `BET-012` would match both `BET-012/` and `BET-0120/` via prefix glob. Mitigation: anchor the glob as `BET-NNN-*` (with a separator after the number), plus an exact match fallback for legacy dirs.
