# Decision: BET-030 Add list, show, and status JSON commands
<!-- Naming tip: verb + object [for context] — e.g. "Improve bet naming for scannability" not "Naming" -->

## Status
- Decision: Build now
- Date: 2026-08-20
- Owner: Eshane
- Review date: 2026-09-30

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)
- [ ] 1-way door (hard to reverse — requires higher confidence before committing)

## Risk profile
- **Value risk**: Medium — scriptable board inspection helps automation and integrations, but casual users are well served by the existing human-readable sequence view
- **Usability risk**: Low — standard `list` / `show` / `status` with `--json` is a familiar CLI idiom
- **Feasibility risk**: Low — reads existing `oprim/` artifacts and `sequence.yaml`; a bounded, additive command surface
- **Business viability risk**: Low — no licensing or ops concerns

## Why now
- oprim lacks machine-readable inspection of bets/decisions/board; `sequence-view.md` is human-only markdown
- OpenSpec's `list` / `show` / `status --json` make the workspace scriptable (CI, dashboards, integrations)
- Enables downstream tooling and directly supports the validate/CI work (BET-028)
- Deferred: a supporting capability, lower priority than the core spec/config bets

## Alternatives considered
- Keep `sequence-view.md` as the only inspection surface
- Expect consumers to parse the YAML/markdown artifacts directly

## Expected outcomes
- `oprim list` / `show` / `status` emit `--json` for bets, decisions, and board state
- The sequencing board becomes scriptable for CI and external dashboards

## Kill criteria / rollback trigger
- No consumers use the JSON output after release

## Links
- PDRs: None
- OpenSpec change: to be filled when promoted
- Supports: BET-028 (validate)
- Reference: https://github.com/Fission-AI/OpenSpec/blob/main/docs/cli.md
- Spec (delta): oprim/bets/pending/BET-030-add-list-show-and-status-json-commands/specs/list-show-status-commands/spec.md
