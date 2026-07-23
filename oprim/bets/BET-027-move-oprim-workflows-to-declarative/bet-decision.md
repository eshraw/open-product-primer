# Decision: BET-027 Move oprim workflows to declarative schemas
<!-- Naming tip: verb + object [for context] — e.g. "Improve bet naming for scannability" not "Naming" -->

## Status
- Decision: Defer
- Date: 2026-07-23
- Owner: Eshane
- Review date: 2026-09-30

## Door type
- [ ] 2-way door (reversible — safe to try, easy to undo)
- [x] 1-way door (hard to reverse — requires higher confidence before committing)

## Risk profile
- **Value risk**: Medium — primarily an enabler (maintainability + user-forkable workflows); end-user value is indirect until someone actually forks a workflow
- **Usability risk**: Medium — forkable workflows are powerful for authors but add concepts; invisible to casual users if defaults are good
- **Feasibility risk**: High — a large refactor of the string literals in `install-agent.ts` into declarative schema + template data, plus a CLI that assembles prompt text on demand (OpenSpec's `instructions` pattern)
- **Business viability risk**: Low — no licensing or ops concerns

## Why now
- CLAUDE.md itself flags the pain: skill content lives as hard-coded string literals in `install-agent.ts` and `oprim update` regenerates them — not user-customizable
- OpenSpec's schema + template + `instructions` architecture is a proven, cleaner alternative that lets users fork/customize workflows without touching TypeScript
- Synergizes with BET-023 (spec authoring workflow) and BET-025 (config rules) — all three want declarative, customizable workflow definitions
- Deferred deliberately: it is the largest internal refactor and a 1-way door — sequence it after the Build-now spec/config bets prove the direction

## Alternatives considered
- Keep the string literals in `install-agent.ts` (status quo — not user-customizable)
- Externalize only templates while keeping instructions hard-coded (partial win)
- Adopt OpenSpec's schema files verbatim rather than an oprim-adapted variant

## Expected outcomes
- oprim workflow content (bet / PDR / spec / review) lives as declarative YAML + markdown templates users can fork without editing TypeScript
- `oprim update` regenerates per-agent adapters from schema data rather than per-tool string literals
- Reduced maintenance cost when adding a new agent or artifact

## Kill criteria / rollback trigger
- Refactor cost or regressions outweigh the customization benefit
- No users fork or customize workflows after release

## Links
- PDRs: None
- OpenSpec change: to be filled when promoted
- Relates to: BET-023 (spec authoring), BET-025 (config rules)
- Reference: https://github.com/Fission-AI/OpenSpec/blob/main/docs/customization.md
