## Context

`/oprim:sequence` exists today as a command with inline steps — no skill backing. It expects users to arrive with a clear intention (e.g. "move BET-005 to Now"). When users don't have one, the command produces generic suggestions like "consider rebalancing" that require the user to interpret the board state themselves. There is also no ambient trigger that fires when a lifecycle event changes the board state, so the board drifts silently.

All skill and hook content is sourced from string constants in `install-agent.ts` and written to the target agent directories by `oprim update`. The existing hook mechanism (`on-prompt-submit.sh` + `on-stop.sh`) already handles one lifecycle event (bet archival via `/opsx:archive`), providing a proven pattern to extend.

## Goals / Non-Goals

**Goals:**
- Create an `oprim-sequence` skill that owns board health computation, triage mode, seeded mode, and YAML execution
- Extend `on-prompt-submit.sh` to detect `/oprim:bet` and `/oprim:promote` and write `.sequence-nudge` flag files
- Extend `on-stop.sh` to read `.sequence-nudge` flags and surface non-blocking contextual nudges
- Refactor `sequence.md` command to a one-line skill wrapper (consistent with `archive.md`)

**Non-Goals:**
- Changing the `sequence.yaml` schema
- Adding a visual board UI
- Addressing the criteria/outcomes feedback loop (separate initiative)
- Lowering CLI install friction for non-SWE users

## Decisions

### Skill, not command, owns sequencing logic

The current `sequence.md` command contains inline steps. For the richer triage/intention-discovery flow, a skill is the right surface — skills define multi-step workflows with conditional branching, whereas commands are thin entry points. The command becomes a one-liner: "invoke oprim-sequence skill." This matches the pattern established by `archive.md`.

Alternatives considered:
- Extend the inline command steps — no conditional branching, no way to drive rich multi-turn interaction.
- New standalone command with full inline logic — works but inconsistent with how oprim handles complex workflows.

### Non-blocking nudges, not gates

Lifecycle nudges (after bet created, after bet promoted) are informational — they appear at session stop and can be dismissed. Only the existing archive co-archival prompt is a gate. Sequencing is lower urgency; forcing a gate would create friction and reduce trust in the tool.

Alternatives considered:
- Blocking gate for all lifecycle nudges — too aggressive; sequencing is not always needed after every event.
- Inline nudge during the lifecycle command — interrupts the primary flow the user is in.

### Extend existing flag file mechanism

The `.archive-pending` flag file pattern is already in `on-prompt-submit.sh` and `on-stop.sh`. Adding `.sequence-nudge` follows the same pattern: detect command on submit, write flag with context string, read and act on stop. No new infrastructure needed.

Alternatives considered:
- A single unified flags file — harder to parse, mixing concerns.
- Polling `sequence.yaml` on every stop — slow and would fire even when nothing changed.

## Risks / Trade-offs

- **Hook script complexity grows** — each new lifecycle event adds more detection logic to `on-prompt-submit.sh`. Mitigation: keep detection patterns simple (grep for command string), with one flag file per concern.
- **Nudge fatigue** — if users create many bets or promote frequently, nudges stack up. Mitigation: nudges are non-blocking and dismissable; the flag is deleted on first read so they don't repeat.
- **Triage accuracy depends on board data quality** — if `sequence.yaml` is already stale, triage suggestions may be misleading. Mitigation: the skill reports what it finds and lets the user validate; it never silently edits.
- **`install-agent.ts` grows larger** — adding a full skill string increases the file's size. Mitigation: the file already holds large skill strings; this is consistent with existing patterns.

## Migration Plan

1. `oprim update` regenerates skill and hook files in place — existing users get the new behavior on next `oprim update` run
2. The existing `sequence.md` command is replaced with a one-liner wrapper — no user-visible change to the slash command name or invocation
3. No `sequence.yaml` schema changes — no migration needed for existing boards
4. Rollback: revert `install-agent.ts` and re-run `oprim update`

## Open Questions

- Should the `.sequence-nudge` flag carry the bet ID for `/oprim:bet` (ID not known at submit time, only after skill completes)? Current design: no — just context type. The skill reads the board fresh. May revisit if seeded mode needs more precision.
