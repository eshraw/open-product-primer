## Why

Native mode's `oprim-spec` skill only produces a requirements+scenarios delta (`spec.md`) — there is no equivalent to OpenSpec's `design.md` (technical approach/trade-offs) or `tasks.md` (implementation checklist). Without a `tasks.md`, there's no structured, inspectable signal of implementation progress for a native-mode bet — exactly the completion signal BET-032's new `oprim/bets/pending/` → `oprim/bets/archived/` split needs in order to mean "actually built," not just "someone ran archive." (OpenSpec's `proposal.md` is deliberately not mirrored here — native mode's `bet-decision.md` already captures why-now and expected outcomes; a `proposal.md` sourced from that same content would only restate it.)

## What Changes

- Extend the `oprim-spec` skill so that, alongside the existing `specs/<capability>/spec.md` delta, it also generates `design.md` and `tasks.md` under the bet's directory (`oprim/bets/pending/BET-NNN-<slug>/`) — generated once per bet, the first time `oprim-spec` runs for that bet, and left alone on subsequent capability-delta passes
- `tasks.md` uses the same `- [ ] N.M Task description` checkbox convention OpenSpec's own `tasks.md` uses, so completion is a simple parse, not a new format to learn
- Add a soft-warning gate to `oprim:archive`: if the bet directory contains a `tasks.md` with any unchecked `- [ ]` items, the skill warns and asks for confirmation before archiving (mirroring the existing "referenced by other active bets" warning pattern) rather than hard-blocking the archive
- No change to OpenSpec-based bets — this is native-mode-only, since OpenSpec-based bets already get `proposal.md`/`design.md`/`tasks.md` for free via `/openspec-propose`

## Capabilities

### New Capabilities
- `bet-task-tracking`: native-mode bets gain `design.md` and `tasks.md` alongside their spec delta, and `tasks.md`'s checkbox completion state is inspected by `oprim:archive` as a soft implementation-complete gate

### Modified Capabilities
- `bet-archiving`: `oprim:archive` additionally checks the bet directory for a `tasks.md` with unchecked items and warns (with a confirmation prompt) before archiving if any remain

## Impact

- `packages/cli/src/workflows/spec-authoring.template.md` — add design/tasks generation steps, gated on "first `oprim-spec` invocation for this bet"
- `packages/cli/src/workflows/archive.template.md` (and `archive.inline.md`) — add the tasks.md completion check before the move step
- `packages/cli/src/lib/install-agent.ts` — no new files installed (this only changes instructional template content already covered by existing skill installation), but skill-version-drift detection will pick up the updated `oprim-spec` and `oprim:archive` skill content
- No new dependencies; purely additive to native-mode workflow templates (2-way door)

## Context

- Bet: BET-033 (`oprim/bets/BET-033-add-proposal-design-and-tasks-artifacts/bet-decision.md`, to be relocated under `oprim/bets/pending/` once BET-032 is implemented) — Add proposal, design, and tasks artifacts to native oprim specs
- Blocked by: BET-032 (`openspec/changes/bet-032-bets-pending-subdir/`) — this change assumes bets live under `oprim/bets/pending/`, per BET-032's directory restructuring
