## 1. Reference grammar

- [ ] 1.1 Create `lib/portfolio/refs.ts` with `parseRef()` for `BET|PDR|OBJ|NOTE`, qualified and unqualified
- [ ] 1.2 Tests: qualified/unqualified parse, invalid qualifier chars, unknown kind, YAML flow-list round trip (`[checkout:BET-012]` stays a string)

## 2. Resolver

- [ ] 2.1 Implement `RefResolver` over `resolveFull()` with per-source memoisation
- [ ] 2.2 Artifact lookup per kind (pending → archived for BET; decisions/objectives/notes by ID prefix) returning state read at resolution time
- [ ] 2.3 Tests with local-path fixtures: found pending, found archived, missing, unknown source; git fixture (local bare repo) for stale-cache fallback; one fetch per source for 20 refs

## 3. Reference collection and checks

- [ ] 3.1 `collectRefs()` over `sequence.yaml` fields and bet `## Links` lines
- [ ] 3.2 `checkCrossProductRefs()` with the severity mapping from design.md; wire into `doctor` and `validate`
- [ ] 3.3 Tests: required vs non-required outcomes; product-mode workspace citing a portfolio PDR

## 4. Integrity change

- [ ] 4.1 Skip qualified entries in `checkSequenceIntegrity` dangling checks
- [ ] 4.2 Hint when a `blocked_by`/`unlocks` entry parsed as a YAML map (`checkout: BET-012`)
- [ ] 4.3 Tests for the ADDED doctor-sequence-integrity scenarios; existing integrity tests unchanged

## 5. Product registry

- [ ] 5.1 `lib/portfolio/products.ts` with `readProducts()` and `checkProductRegistry()` (unregistered source, forbidden `git`/`path` fields)
- [ ] 5.2 Wire into doctor/validate in portfolio mode only; tests

## 6. Identity mode

- [ ] 6.1 Add optional `mode` to `RemoteContextIdentity`; write it in `oprim context init` when in portfolio mode
- [ ] 6.2 Label portfolio sources in `oprim context list`; tests

## 7. Performance + docs

- [ ] 7.1 Benchmark test fixture: 5 local products, ~50 refs, assert < 10s warm
- [ ] 7.2 README + CLAUDE.md: reference syntax, where it is valid, severity table
