# Design: list-show-status-commands

## Approach

Three new Commander subcommands, following the existing `commands/<name>.ts` + `program.addCommand(...)` pattern used by `validate.ts`, `doctor.ts`, etc. Each command reads existing `oprim/` artifacts directly (no new persisted state) and supports a `--json` flag alongside a human-readable default.

- **`oprim list [-b|--bets] [-d|--decisions] [-n|--notes] [--json]`** — enumerates artifacts by type. At least one type flag selects what's listed; flags are combinable (e.g. `--bets --decisions`). No type flag defaults to bets, since bets are the primary board-inspection surface most consumers want (mirrors `oprim status` scoping to the board). Each listed item includes id, title, and status/decision where applicable, plus its file path.
- **`oprim show <ID> [--json]`** — dispatches on the ID prefix (`BET-`, `PDR-`, `NOTE-`) to resolve the artifact directory/file, matching the same resolution helpers already used elsewhere (`resolveBetDirectory` in `lib/spec-delta.ts` for bets; PDR/note resolution is a straightforward filename glob since those aren't directory-scoped). Prints the full artifact content plus derived metadata (links, status). Unknown or unresolvable IDs exit non-zero with a clear error, matching `validate.ts`'s `resolveBetDirectory` failure handling.
- **`oprim status [--json]`** — reads `oprim/sequence.yaml` and renders the now/next/later/backlog lanes plus WIP limit usage (limit vs. count in `now`), the same content `sequence-view.md` and `oprim-sequence`'s triage mode already compute. This command doesn't regenerate `sequence-view.md`; it's a read-only scriptable view of the same data.

## JSON output shape

- `list --json`: `{ "bets": [...], "decisions": [...], "notes": [...] }` — only keys for requested types are present.
- `show --json`: `{ "type": "bet"|"decision"|"note", "id": ..., "path": ..., ...artifact-specific fields, "content": "<raw markdown>" }`.
- `status --json`: `{ "wip_limits": {...}, "now": [...], "next": [...], "later": [...], "backlog": [...] }` — same shape as `sequence.yaml`'s top-level structure, so it's a near-passthrough rather than a bespoke schema.

All JSON output goes to stdout with no human-readable text mixed in, so it's pipeable (`oprim status --json | jq`).

## Alternatives considered

- **Unified `list` with no type flags, listing everything at once** — rejected per user direction; type flags keep output scoped and predictable for scripting.
- **`show` restricted to bets only** — rejected; PDRs and notes are equally addressable oprim artifacts and a single dispatch-by-prefix command is simpler for consumers than three separate show commands.
- **`status` folding in doctor's health checks** — rejected; `oprim doctor` and `oprim validate` already own integrity/drift checking, and mixing that into `status` would duplicate `validate --json`'s job. `status` stays scoped to board state.

## Risks

- ID-prefix dispatch in `show` assumes prefixes stay stable (`BET-`, `PDR-`, `NOTE-`) — reasonable since these are established conventions used throughout `oprim-bet`, `oprim-pdr`, `oprim-note`.
- JSON shape becomes a de facto contract for external consumers (CI, dashboards) once shipped — keep it a close passthrough of existing YAML/frontmatter structures rather than inventing a new schema, to minimize future breaking changes.
