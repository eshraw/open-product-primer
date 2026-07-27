## Context

`oprim doctor` (`packages/cli/src/commands/doctor.ts`) builds a flat `Check[]` (from `lib/integrity.ts` plus inline checks) and prints a human-readable report; it never sets a non-zero exit code, so it cannot gate CI. Cross-bet conflict detection and spec-delta folding currently exist only as prose inside the `oprim-archive` Claude skill (`archiveSkill()` in `lib/install-agent.ts`) — an LLM agent re-derives the algorithm from natural-language instructions each time `/oprim:archive` runs, and there is no way to invoke that logic outside the interactive archive flow.

## Goals / Non-Goals

**Goals:**
- A standalone `oprim validate` command usable in CI: deterministic exit code, `--json` output.
- Reuse, not duplicate, the existing `Check` model and sequence/skill-drift check functions from `lib/integrity.ts`.
- Extract the spec-delta fold and cross-bet conflict algorithms (today only described in `archiveSkill()`'s prose) into shared, testable TypeScript functions that both `validate` and (optionally, in a later bet) `/oprim:archive` can call.
- `--strict` turns today's "warning" (`required: false`) findings into failures for the purposes of the exit code, without changing `oprim doctor`'s own (always lenient) reporting.

**Non-Goals:**
- Changing `/oprim:archive`'s interactive behavior or its y/N prompt — this bet adds an on-demand equivalent check, it does not wire `validate` into the archive flow itself (that wiring, if wanted, is a follow-up).
- A general-purpose plugin/rule system for custom validations — the check set is fixed and defined in this bet.
- Validating anything about PDRs' supersession chain (out of scope; PDRs aren't part of the spec-delta model per `spec-dir-lifecycle`).

## Decisions

**`validate` is a new command, not a `doctor --strict` flag.**
`doctor` is an interactive health/setup check (env vars, agent directories, hooks) with no CI contract. `validate` is a narrower, CI-focused definition-of-done + spec-integrity gate. Conflating them would force `doctor` to grow exit-code semantics it doesn't need and would make `--strict doctor` ambiguous about which of doctor's many checks (agent directory presence, measurement credentials) should actually fail a build. Alternative considered: `oprim doctor --strict --json` — rejected because most of doctor's checks (missing `.cursor/`, missing `AMPLITUDE_API_KEY`) are legitimately optional per-project and shouldn't be conflated with spec/board correctness.

**`validate` reuses `checkSequenceIntegrity`/`checkSkillVersionDrift` directly (same `Check[]` shape).**
No need to reinvent sequence/skill checks — `lib/integrity.ts`'s functions already push `Check` objects with a `required` flag; `validate` calls them into its own `Check[]` alongside its new checks. Exit-code logic then reads: fail if any `required` check fails, or (`--strict`) if any check fails regardless of `required`.

**Spec-delta fold and conflict-detection logic move into `lib/spec-delta.ts`, extracted from `archiveSkill()`'s prose.**
Today the fold algorithm (match `### Requirement:` headers whitespace-insensitively; ADDED→append, MODIFIED→replace-or-append-with-note, REMOVED→delete-or-note) and the conflict-detection algorithm (headers overlapping across active bets' deltas; `blocked_by`/`unlocks` dependents) exist only as instructions for an LLM agent executing `/oprim:archive`. This bet extracts both into plain TypeScript functions (`foldDelta()`, `findCrossBetConflicts()`) that `validate` calls directly and deterministically. `archiveSkill()`'s prose is left as-is (still describes the same steps for the agent) — a future bet could have the skill shell out to `oprim validate --diff`/`oprim validate --conflicts` instead of re-deriving the algorithm, but that wiring is explicitly out of scope here (see Non-Goals).

**Dry-run preview writes nothing; it reads bet deltas and current truth and prints the computed result.**
`oprim validate --diff BET-NNN` (flag/subcommand naming finalized during implementation) calls `foldDelta()` for each capability under the bet's `specs/` directory against the corresponding `oprim/specs/<capability>/spec.md`, and prints the resulting file content (or a unified diff) without touching disk.

**Bet-DoD check (`bet-definition-of-done`) is scoped to promoted bets only.**
A bet counts as "promoted" if its `bet-decision.md` has a non-placeholder `## Links` → `OpenSpec change:` entry (not "to be filled when promoted"). Only promoted bets are checked for `criteria.yaml` presence — an un-promoted bet in `backlog`/`later` isn't expected to have measurement criteria yet. Alternative considered: requiring criteria.yaml for every bet regardless of promotion status — rejected, criteria authoring naturally happens around promotion time per the bet's own "Why now" framing ("no promote without a criteria contract").

## Risks / Trade-offs

- **[Risk] Two implementations of the fold/conflict algorithm drift apart** (the new `lib/spec-delta.ts` TypeScript version and `archiveSkill()`'s prose version, since the latter isn't touched by this bet) → Mitigation: accepted short-term trade-off (explicitly a Non-Goal to rewire archive in this bet); flag as a natural follow-up once `validate` proves the extracted logic is correct.
- **[Risk] `--strict` in CI produces false-positive failures for legitimately-in-progress bets** (e.g. a bet mid-authoring with an intentionally-unlinked criteria.yaml) → Mitigation: the bet's own kill criteria already names this ("gating creates more friction than value... relax strict rules to warnings"); ship `--strict` as opt-in (not the default) so a team adopts it deliberately.
- **[Trade-off] Extracting fold/conflict logic touches code the interactive archive skill's prose describes but does not call** → Accepted: this is the seam BET-028 exists to open; `archiveSkill()` behavior is unchanged so no regression risk to the existing archive flow.

## Open Questions

- Exact CLI surface for the dry-run/conflict checks (`oprim validate --diff BET-NNN` vs. `oprim validate diff BET-NNN` subcommand) — left to implementation; either satisfies the spec's WHEN/THEN scenarios, which are written in terms of *behavior* not exact flag syntax.
