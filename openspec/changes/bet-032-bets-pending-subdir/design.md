## Context

Bets currently live flat at `oprim/bets/BET-NNN-<slug>/`, alongside `oprim/bets/archived/`. Every skill that touches bet directories (`oprim-bet`, `oprim:promote`, `oprim:archive`, native spec-authoring) scans `oprim/bets/` and `oprim/bets/archived/` to compute the next bet ID or resolve an existing one. There is no third state: a bet directory existing under `oprim/bets/` gives no signal about whether it has been implemented, only that it hasn't been archived yet.

## Goals / Non-Goals

**Goals:**
- Give an instant, file-listing-only signal for build status: `oprim/bets/pending/` = not yet folded into current truth, `oprim/bets/archived/` = done
- Keep the change purely structural — no new metadata field, no new command
- Migrate this repository's own bet directories so the workspace is left consistent after implementation

**Non-Goals:**
- Not introducing a third lifecycle state beyond pending/archived (e.g. no `in-review/`)
- Not changing `sequence.yaml`'s schema or board semantics
- Not adding automatic enforcement that a bet's `tasks.md` (if BET-033 lands) must be complete before archiving — that's BET-033's concern, this bet only prepares the directory structure

## Decisions

- **Directory name `pending/` over alternatives** (`active/`, `in-progress/`, `wip/`): "pending" reads correctly against the existing `archived/` naming and matches the bet-decision's own wording ("not yet folded into current truth")
- **Scanning spans both `pending/` and `archived/`, not just `pending/`**: bet-ID uniqueness must still be computed across the full bet history, or a freshly-archived ID could be reissued
- **No compatibility shim for the old flat path**: the bet's expected outcome is that `oprim/bets/pending/` contains *only* unarchived bets — a permanent dual-path fallback would defeat the at-a-glance signal this bet exists to create. Existing flat bet directories in any adopting project (including this repo) are migrated once, as part of this change's implementation, rather than supported indefinitely
- **`oprim/bets/archived/` destination path is unchanged**: `oprim:archive` already moves into `archived/` unconditionally; only the source side of the move changes

## Risks / Trade-offs

- [Any script or external tool hardcoding `oprim/bets/BET-NNN/` breaks] → mitigated by this being pre-1.0 internal tooling structure (per the bet's business-viability risk rating of Low), and the proposal calling out the break explicitly as **BREAKING**
- [Migrating this repo's own in-flight bets could momentarily desync `sequence.yaml` if done carelessly] → migration only moves directories; it does not touch `sequence.yaml` entries, which reference bare `BET-NNN` IDs, not paths
- [Doctor/validate checks that glob `oprim/bets/BET-*` directly would silently stop finding anything] → covered explicitly in tasks.md as its own verification step

## Migration Plan

1. Update path-resolution/scanning code and workflow template text first (this change's tasks)
2. Move this repository's existing `oprim/bets/BET-*` directories (excluding `archived/`) into `oprim/bets/pending/`
3. Run `oprim doctor` and the CLI test suite to confirm no remaining flat-path references
4. Rollback: if directory-layer path bugs outweigh the clarity gained (per the bet's kill criteria), move `oprim/bets/pending/*` back to flat `oprim/bets/` and revert the code/template changes in this change
