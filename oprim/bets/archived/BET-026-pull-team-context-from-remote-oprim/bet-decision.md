# Decision: BET-026 Pull team context from remote oprim stores
<!-- Naming tip: verb + object [for context] — e.g. "Improve bet naming for scannability" not "Naming" -->

## Status
- Decision: Build now
- Date: 2026-07-27
- Owner: Eshane
- Review date: 2026-09-30
- Note: Flipped from Defer to Build now on 2026-07-27 — blockers BET-024 and BET-025 have both landed (archived, Build now).

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)
- [ ] 1-way door (hard to reverse — requires higher confidence before committing)

## Risk profile
- **Value risk**: Medium — strong conceptual fit (product decisions are naturally org-level), but only teams with multiple repos benefit; solo users see little gain
- **Usability risk**: High — store / reference / workset concepts are the most unfamiliar in this slate and risk overwhelming users if not carefully introduced
- **Feasibility risk**: High — the heaviest lift here: git-native store resolution, read-only references, context assembly across roots, and a doctor to validate registration
- **Business viability risk**: Low — git-native and open; no vendor lock-in

## Why now
- Product decisions (PDRs / bets / strategy) are naturally org- or team-level, not repo-level — a referenceable store arguably fits oprim better than it does OpenSpec
- Stated requirement: pull company/team context from remote spec repos without cloning, avoiding local↔remote mismatch (remote is the source of truth)
- OpenSpec shipped Stores (v1.5 beta) with a proven design to adapt: a store is just a git repo with a `store.yaml` identity, read-only `references`, worksets, and a `doctor` — "declarations, not automation," it never auto-syncs
- Deferred: depends on a defined oprim spec/dir model (BET-024) and a config `store:` key (BET-025), both Build-now — sequence this after they land

## Alternatives considered
- Git submodules or manual clone of context repos (exactly the mismatch risk this bet avoids)
- Copy-paste company context into each repo's CLAUDE.md (drifts from source immediately)
- Centralize everything in a single monorepo

## Expected outcomes
- A code repo can reference a remote oprim decisions/spec store read-only and surface its context to agents without cloning
- The remote store remains the single source of truth; local repos never fork a stale copy
- Each store repo carries its own agent-readable oprim structure

## Kill criteria / rollback trigger
- Remote resolution proves unreliable or slow in practice
- Teams don't adopt shared stores after a trial → drop back to per-repo context

## Links
- PDRs: None
- OpenSpec change: openspec/changes/archive/2026-07-27-bet-026-remote-context/ (implemented and archived)
- Blocked by: BET-024 (spec dir model, archived), BET-025 (config store: key, archived)
- Criteria: none (no criteria.yaml authored for this bet)
- Reference: https://github.com/Fission-AI/OpenSpec/blob/main/docs/stores-beta/user-guide.md
