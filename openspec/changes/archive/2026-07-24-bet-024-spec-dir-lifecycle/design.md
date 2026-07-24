## Context

BET-023 established native spec authoring: an oprim skill writes RFC 2119 + Gherkin capability specs to `oprim/specs/<capability>/spec.md`, with no concept of "in flight" vs. "current truth" — every write lands directly in what is meant to be the truth set. `oprim:archive` today (per `bet-archiving/spec.md`) resolves a bet ID, moves `oprim/bets/BET-NNN.../` to `oprim/bets/archived/`, and removes its `sequence.yaml` entry — it explicitly has "no knowledge of OpenSpec changes" and, by extension, no knowledge of specs at all. This bet gives oprim a genuine current-vs-delta model without touching PDRs, which deliberately keep a separate truth mechanic (supersession).

## Goals / Non-Goals

**Goals:**
- Give oprim a `specs/` current-truth set plus per-bet delta specs that merge on archive, mirroring OpenSpec's proven model
- Let multiple in-flight bets carry delta specs against the same capability without file collisions
- Extend `oprim:archive` with merge-on-archive logic as a natural step in its existing flow

**Non-Goals:**
- Any change to PDR supersession — decisions and specs keep separate truth models by design
- Remote store resolution (BET-026), the declarative-schema refactor (BET-027), or `validate`/CI gating (BET-028) — later, dependent bets
- Nesting current specs under `specs/current/` — OpenSpec itself keeps `specs/` flat, and this bet follows that precedent

## Decisions

**1. Delta location**: `oprim/bets/BET-NNN-<slug>/specs/<capability>/spec.md`, using the bet's own directory rather than a separate top-level `changes/` tree. Alternative considered: reuse `openspec/changes/<name>/specs/` directly — rejected per the bet's own "Alternatives considered" (an oprim-native structure is wanted precisely so oprim's spec lifecycle doesn't require OpenSpec to exist, matching BET-023's opt-in `native` framework).

**2. Delta syntax**: reuse OpenSpec's `## ADDED Requirements` / `## MODIFIED Requirements` / `## REMOVED Requirements` headers verbatim (already familiar from the OpenSpec-delegation path), rather than inventing an oprim-specific delta vocabulary. Keeps the two frameworks' mental models compatible for anyone who's used either.

**3. Merge-on-archive lives in `oprim:archive`, not a separate command**: BET-024's own rationale says this "maps onto oprim's existing bet → archive flow" — so the merge step is added to the existing archive skill rather than introducing a new `oprim merge` or similar. `oprim:archive` remains a single command; it now does one more thing (fold spec deltas) when a bet has them.

**4. Matching algorithm for merge**: requirements are matched between a bet's delta file and the corresponding `oprim/specs/<capability>/spec.md` by exact `### Requirement:` header text (whitespace-insensitive) — same matching rule OpenSpec's own archive tooling already uses, so the merge behavior is unsurprising to anyone who's used OpenSpec.

**5. Concurrent deltas against the same capability**: each bet's delta applies independently at its own archive time; if two bets both modify the same requirement before either archives, the later archive's version wins (last-write-wins on the specific requirement, not a 3-way merge). Alternative considered: block promoting a second bet against an already-delta'd capability — rejected as too restrictive for the stated goal ("multiple in-flight changes can proceed in parallel").

## Risks / Trade-offs

- [Risk] Last-write-wins on overlapping requirement deltas can silently drop one bet's intended change if two bets edit the same requirement → Mitigation: `oprim:archive`'s dependency warning (already existing, checks `blocked_by`/`unlocks` in `sequence.yaml`) is a natural place to also warn if the archiving bet's delta targets a requirement another still-active bet has also modified; full conflict detection is out of scope for this bet and can be hardened later by BET-028 (validate).
- [Risk] Native spec-authoring (BET-023) needs new bet-context awareness to know whether to write a delta (bet active) vs. nothing (archive handles the merge) → Mitigation: keep the check simple — if invoked from within an active bet's promote flow, write to the bet's delta path; the archive skill is the only place that ever writes to `oprim/specs/` directly.
- [Risk] Introducing delta/merge ceremony that users don't perceive value from (the bet's own kill criterion) → Mitigation: ship behind the same `native` framework opt-in as BET-023; a generalist user who never selects `native` never encounters delta specs at all.

## Migration Plan

- No existing native specs exist yet (BET-023 ships first) — no data migration needed
- Rollback: if delta-merge proves too error-prone, `oprim:archive` reverts to its current behavior (move + sequence.yaml cleanup only) and bets simply keep writing directly to `oprim/specs/` as BET-023 shipped it; no structural cleanup required since the delta directory is just a subfolder of the bet directory that already gets archived wholesale

## Open Questions

- Whether `oprim:archive`'s dependency-warning step should also surface delta-conflict warnings in this bet, or be deferred entirely to BET-028 (validate) — leaning toward a lightweight warning here, full gating later
- Exact bet-context signal the native spec-authoring skill uses to choose delta vs. direct-write (e.g., presence of an active `oprim/bets/BET-NNN/` dir for the capability being edited) — left to tasks.md / implementation
