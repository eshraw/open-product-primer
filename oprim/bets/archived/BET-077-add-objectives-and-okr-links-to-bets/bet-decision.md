# Decision: BET-077 Add objectives and OKR links to portfolio and product bets
<!-- Naming tip: verb + object [for context] — e.g. "Improve bet naming for scannability" not "Naming" -->

## Status
- Decision: Build now
- Date: 2026-11-21
- Owner: Eshane Rawat
- Review date: 2026-12-19

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)
- [ ] 1-way door (hard to reverse — requires higher confidence before committing)

## Risk profile
- **Value risk**: Medium — OKR alignment is the main thing a PM reports on, but only valuable if objectives are kept current each quarter.
- **Usability risk**: Medium — one more link line per bet; a warning on every unlinked bet could become noise if it fires in product repos that have no portfolio.
- **Feasibility risk**: Low — a new artifact type with an `OBJ-NNN` ID, resolved by the BET-076 resolver; checks mirror existing `validate-checks.ts` patterns.
- **Business viability risk**: Low — additive and portfolio-scoped.

## Why now
- PDR-001 chose first-class `oprim/objectives/` so objectives are citable by products and deterministically resolvable; the artifact needs to exist before delegation (BET-078) and the portfolio view (BET-079) can report "objectives with no bet in Now/Next".
- Portfolio bets and portfolio PDRs need no new machinery beyond this (PDR-001: same `BET-NNN`/`PDR-NNN` namespace, qualified across workspaces) — objectives are the only genuinely new artifact.

## Alternatives considered
- `context/okrs.md` single file with heading-based resolution — rejected in PDR-001.
- Objectives as a field inside `config.yaml` — rejected: quarterly churn would rewrite config, and no room for rationale/key results.
- Warn on unlinked bets in every product repo — rejected: the check only runs when a workspace is a portfolio or has a portfolio source registered.

## Expected outcomes
- `oprim-objective` workflow writes `oprim/objectives/OBJ-NNN-<slug>.md` (period, key results, status), with and without OKF frontmatter.
- Bets carry `- Objectives: OBJ-001, acme-portfolio:OBJ-002` in `## Links`; `doctor`/`validate` resolve each reference.
- In portfolio mode (and in product workspaces with a portfolio source), a bet with no objective link is a non-required warning; a dangling objective reference is required.

## Kill criteria / rollback trigger
- After one quarter of dogfooding, objectives are not updated at period rollover → demote to a plain `oprim/handbook/okrs.md` and drop the checks.
- The unlinked-bet warning is suppressed or ignored on > 50% of bets → make it opt-in.

## Links
- PDRs: PDR-001
- Objectives: None (this bet creates the artifact)
- OpenSpec change: <to be filled when promoted>
