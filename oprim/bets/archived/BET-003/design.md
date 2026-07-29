## Context

The oprim agent surface currently exposes each workflow (bet authoring, criteria authoring, PDR creation, KPI review) via two entry points: a `/oprim:*` slash command in `.claude/commands/oprim/` and an `oprim-*` skill in `.claude/skills/`. The four commands (`bet.md`, `criteria.md`, `pdr.md`, `review.md`) are pure delegation stubs — their entire body is "invoke the skill". They add no logic, no shortcuts, and no ergonomic benefit; they exist only as an alias that creates discovability and confusion.

## Goals / Non-Goals

**Goals:**
- Remove the four command files that are pure skill wrappers
- Ensure the canonical `oprim-*` skills remain fully functional as the sole entry point
- Update any prose documentation or CLAUDE.md references that direct users to the removed commands
- Leave `promote.md` and `sequence.md` untouched — they contain workflow logic and have no corresponding skill

**Non-Goals:**
- Renaming or consolidating the remaining skills
- Changing the behavior of any oprim workflow
- Removing `promote.md` or `sequence.md`
- Adding discoverability mechanisms to skills (out of scope for this change)

## Decisions

### Decision: Delete command files, do not replace or redirect

The commands are stubs that say "invoke the skill." Deleting them is the complete implementation. There is no need for a redirect mechanism — users who relied on the slash command surface will use the skill directly. The kill criteria in BET-003 handles the rollback case if discoverability suffers.

*Alternative: Convert commands to no-op stubs that print "use the skill instead."* Rejected — adding more surface to reduce surface is contradictory and still leaves two entry points.

### Decision: Retain promote.md and sequence.md as-is

These commands contain substantive workflow content and have no corresponding skill counterpart. They are not duplicates — removing them would delete functionality, not reduce it.

## Risks / Trade-offs

- [Risk] Users who relied on `/oprim:bet` as a discovery mechanism may not find `oprim-bet` → Mitigation: Covered by BET-003's kill criteria — if this surfaces, restore a lightweight hint layer
- [Risk] Cross-references in documentation or other skill files point to the old command names → Mitigation: Grep for all `/oprim:bet`, `/oprim:criteria`, `/oprim:pdr`, `/oprim:review` references in `.claude/` and update them as part of this change

## Migration Plan

1. Delete `.claude/commands/oprim/bet.md`
2. Delete `.claude/commands/oprim/criteria.md`
3. Delete `.claude/commands/oprim/pdr.md`
4. Delete `.claude/commands/oprim/review.md`
5. Grep for stale command references in `.claude/` (skills, commands, CLAUDE.md) and update each to reference the skill name
6. No rollback needed — git history preserves the files if the kill criteria triggers
