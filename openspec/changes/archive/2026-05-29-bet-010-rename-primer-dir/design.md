## Context

The oprim workspace currently lives in `primer/` — a name chosen early in the project that predates the `oprim` brand. After BET-004 consolidated all CLI strings to `oprim`, the directory name is the last remaining disconnect. The change touches four CLI commands (init, doctor, update, and new migrate), internal path construction in multiple files, and requires a one-time migration path for existing repos.

## Goals / Non-Goals

**Goals:**
- `oprim init` creates `oprim/` as the workspace root going forward
- `oprim doctor` validates `oprim/` scaffold
- All internal path strings updated from `primer/` to `oprim/`
- `oprim migrate` renames `primer/` → `oprim/` in place for existing repos
- Rename `primer/` to `oprim/` in this repo

**Non-Goals:**
- Renaming internal variable identifiers (`primerDir`, `primerConfig`, `primerTemplate`) — only path strings change
- Supporting both `primer/` and `oprim/` simultaneously (no dual-directory fallback)
- Auto-detecting and migrating on `oprim init` — migration is an explicit opt-in command

## Decisions

### Path string replacement, not variable rename
Only the string `'primer'` in path construction changes to `'oprim'`. Internal identifiers (`primerDir`, `primerConfig`) stay unchanged. This limits the diff surface and keeps the change mechanical and reviewable.

**Alternative considered**: Rename variables too for full consistency. Rejected — higher risk of introducing bugs, no user-facing benefit.

### Explicit `oprim migrate` command, not auto-detect on init/doctor
Migration is a destructive rename. An explicit command makes the user aware and in control. `oprim doctor` will report a warning when `primer/` is detected but `oprim/` is absent, and suggest running `oprim migrate`.

**Alternative considered**: Auto-rename on `oprim init` or `oprim doctor`. Rejected — surprising behavior for an operation that renames directories.

### No dual-directory fallback
After migration, only `oprim/` is supported. There is no silent fallback to `primer/` if `oprim/` is absent. This keeps the codebase clean and avoids a compatibility shim that would need to be removed later.

**Alternative considered**: Fall back to `primer/` if `oprim/` not found. Rejected — perpetuates the split and creates confusing behavior for new users who happen to have an old `primer/` directory.

## Risks / Trade-offs

- **Breaking change for existing repos** → Mitigated by `oprim migrate` command and a `oprim doctor` warning that guides users to it
- **Repo rename (`primer/` → `oprim/`)** affects all open PRs referencing `primer/` paths → Mitigated by doing this as a single commit on the base branch before feature branches diverge
- **Config path references** — `primer/config.yaml` path is hardcoded in install-agent.ts's skill content → Must audit all skill content strings, not just command files

## Migration Plan

1. Ship `oprim migrate` command in the same release as the path change
2. `oprim doctor` adds a check: if `primer/` exists and `oprim/` does not, report failure with message "Run `oprim migrate` to rename primer/ to oprim/"
3. Rename `primer/` → `oprim/` in this repo as part of the implementation commit
4. Bump minor version (0.2.0) — this is a breaking change

## Open Questions

- Should `oprim migrate` also update any hardcoded `primer/` references inside config files (e.g. CI scripts the user may have written)? Current decision: no — too broad, out of scope.
