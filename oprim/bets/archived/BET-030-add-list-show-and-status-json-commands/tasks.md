# Tasks: list-show-status-commands

## 1. `oprim list`
- [x] 1.1 Create `packages/cli/src/commands/list.ts` with `-b/--bets`, `-d/--decisions`, `-n/--notes`, `--json` flags
- [x] 1.2 Implement bet enumeration (pending + archived) with id, title, status, path
- [x] 1.3 Implement decision (PDR) enumeration with id, title, status, path
- [x] 1.4 Implement note enumeration with id, title, tags, path
- [x] 1.5 Default to `--bets` when no type flag is passed
- [x] 1.6 Human-readable table output (default) and JSON object output (`--json`)
- [x] 1.7 Register `listCommand()` in `cli.ts`

## 2. `oprim show <ID>`
- [x] 2.1 Create `packages/cli/src/commands/show.ts` accepting an `<ID>` argument and `--json` flag
- [x] 2.2 Dispatch by ID prefix (`BET-`, `PDR-`, `NOTE-`) to the matching resolver
- [x] 2.3 Reuse `resolveBetDirectory` (`lib/spec-delta.ts`) for bet resolution
- [x] 2.4 Add PDR/note resolution helpers (filename match against `oprim/decisions/` / `oprim/notes/`)
- [x] 2.5 Human-readable output: artifact content plus derived metadata (links, status)
- [x] 2.6 JSON output: `{ type, id, path, ...fields, content }`
- [x] 2.7 Unresolvable ID: clear error message, non-zero exit
- [x] 2.8 Register `showCommand()` in `cli.ts`

## 3. `oprim status`
- [x] 3.1 Create `packages/cli/src/commands/status.ts` with `--json` flag
- [x] 3.2 Read and parse `oprim/sequence.yaml`
- [x] 3.3 Human-readable output: now/next/later/backlog lanes plus WIP limit usage
- [x] 3.4 JSON output: passthrough of `sequence.yaml`'s structure (`wip_limits`, `now`, `next`, `later`, `backlog`)
- [x] 3.5 Register `statusCommand()` in `cli.ts`

## 4. Tests
- [x] 4.1 `list` tests: type filters, default-to-bets, JSON shape
- [x] 4.2 `show` tests: each artifact type, unresolvable ID, JSON shape
- [x] 4.3 `status` tests: lane contents, WIP limit reporting, JSON shape matches `sequence.yaml`
