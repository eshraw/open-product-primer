## 1. Delta spec authoring

- [ ] 1.1 Extend the native spec-authoring skill (BET-023) with bet-context detection: while `BET-NNN` is active, write to `oprim/bets/BET-NNN-<slug>/specs/<capability>/spec.md`; there is no direct-write-to-`oprim/specs/` path anymore outside of archive
- [ ] 1.2 Ensure delta files use `## ADDED Requirements` / `## MODIFIED Requirements` / `## REMOVED Requirements` headers with `### Requirement:` / `#### Scenario:` entries, matching OpenSpec's own delta format

## 2. Merge-on-archive logic

- [ ] 2.1 Extend `oprim:archive`'s implementation to detect an `oprim/bets/BET-NNN.../specs/` directory before moving the bet dir
- [ ] 2.2 Implement requirement matching by `### Requirement:` header text (whitespace-insensitive) between a bet's delta file and `oprim/specs/<capability>/spec.md`
- [ ] 2.3 Implement fold logic for `ADDED` (append new requirement), `MODIFIED` (replace matched requirement block in place), and `REMOVED` (delete matched requirement block) deltas
- [ ] 2.4 Create `oprim/specs/<capability>/spec.md` if it doesn't yet exist and the bet's delta is entirely `ADDED`
- [ ] 2.5 Preserve existing `oprim:archive` behavior unchanged when no `specs/` directory is present on the bet

## 3. Concurrency handling

- [ ] 3.1 Extend the existing `blocked_by`/`unlocks` dependency warning in `oprim:archive` to also warn when the archiving bet's delta touches a requirement another still-active bet has also modified in its own delta file
- [ ] 3.2 Confirm last-write-wins behavior on overlapping requirement deltas across sequential archives (no 3-way merge attempted)

## 4. Tests

- [ ] 4.1 Add/extend tests (real temp directories, no filesystem mocking, per repo convention) covering: delta written to bet dir while bet is active; merge-on-archive folds ADDED/MODIFIED/REMOVED correctly; archive with no `specs/` dir behaves exactly as before; two bets with overlapping deltas archive in sequence with correct last-write-wins result; concurrent-delta warning fires correctly

## 5. Documentation

- [ ] 5.1 Update `oprim/bets/BET-024.../bet-decision.md` `## Links` if any design decisions here narrow or change the bet's original scope
- [ ] 5.2 Note in this repo's own CLAUDE.md (if dogfooded) that `oprim/specs/` is current truth and `oprim/bets/BET-NNN/specs/` holds in-flight deltas
