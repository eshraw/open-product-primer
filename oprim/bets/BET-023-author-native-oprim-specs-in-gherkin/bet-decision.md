# Decision: BET-023 Author native oprim specs in Gherkin syntax
<!-- Naming tip: verb + object [for context] — e.g. "Improve bet naming for scannability" not "Naming" -->

## Status
- Decision: Build now
- Date: 2026-07-23
- Owner: Eshane
- Review date: 2026-08-31

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)
- [ ] 1-way door (hard to reverse — requires higher confidence before committing)

## Risk profile
- **Value risk**: Medium — teams already invested in OpenSpec may not want oprim to own specs, but oprim-only users gain a self-contained workflow with one fewer external dependency
- **Usability risk**: Medium — a new spec syntax is one more thing to learn, mitigated by using the industry-standard RFC 2119 + GIVEN/WHEN/THEN convention rather than a bespoke dialect
- **Feasibility risk**: Medium — oprim already owns skill/template infrastructure, but reliably agent-authoring high-quality requirements + scenarios is non-trivial
- **Business viability risk**: Low — removing the hard OpenSpec dependency is a strategic plus; no licensing or ops concerns

## Why now
- oprim currently delegates all spec authoring to OpenSpec's propose skill (`install-agent.ts` `promoteContent()` invokes `/opsx:propose`) — a hard external dependency for anyone who wants specs
- The stated goal is an oprim-only workflow; owning the spec layer removes the OpenSpec install requirement entirely
- RFC 2119 (`SHALL`/`SHOULD`/`MAY`) requirements + `#### Scenario` GIVEN/WHEN/THEN is a stable, well-understood convention (per OpenSpec's writing-specs guide) — low risk to adopt as oprim's syntax
- Specs authored this way sit naturally beneath the bet's "why" and complement the existing `criteria.yaml` discipline

## Alternatives considered
- Keep delegating spec authoring to OpenSpec (status quo) — external dependency remains
- Adopt OpenSpec's exact markdown spec syntax verbatim rather than an oprim requirements+Gherkin variant
- Author specs in YAML (like `criteria.yaml`) instead of markdown Gherkin

## Expected outcomes
- oprim generates a capability spec (requirements + scenarios) via an oprim command with no OpenSpec installed
- The promote flow produces native oprim specs instead of invoking `/opsx:propose`
- Native spec authoring available as a selectable framework alongside the existing OpenSpec option

## Design constraint: generalist-first, spec layer optional
- oprim stays product-decision-first (PDRs, bets, sequencing, reviews); the spec layer is an optional sublayer beneath a bet, never the center of gravity
- Spec authoring is **opt-in, chosen at `oprim init` / `oprim update`** (extend the existing framework selection: OpenSpec vs. native vs. none)
- A generalist user who wants only PDRs, bets, and reviews never scaffolds a `specs/` directory and never sees Gherkin syntax
- This widens the CLAUDE.md authority boundary (oprim *optionally* owns what/how) rather than replacing the product-decision layer

## Kill criteria / rollback trigger
- Agent-authored native specs are materially lower quality than OpenSpec's output
- Maintaining a parallel spec syntax proves too costly → revert to OpenSpec delegation

## Links
- PDRs: None
- OpenSpec change: to be filled when promoted
- Unlocks: BET-024 (change/current spec dir lifecycle)
- Reference: https://github.com/Fission-AI/OpenSpec/blob/main/docs/writing-specs.md
