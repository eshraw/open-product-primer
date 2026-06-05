## Context

`oprim doctor` runs two bet-related checks:

1. **Discovery check** (`doctor.ts:178-194`): reads `oprim/bets/` with `readdirSync`, iterates entries, and for each directory containing `bet-decision.md`, checks for `discovery.md`. The `archived/` entry is currently skipped implicitly because `oprim/bets/archived/bet-decision.md` doesn't exist — but this is fragile and undocumented.

2. **Criteria credential check** (`measure.ts:282-298`, called from `doctor.ts:148-149`): `scanCriteriaForSourceType` still reads from `primer/bets/` (old pre-migration path). Since that directory no longer exists after `oprim migrate`, this function silently returns `false` — effectively never detecting any credential requirements. Fixing the path means adding an explicit archived exclusion too, or archived bets' `criteria.yaml` files could trigger false credential warnings.

## Goals / Non-Goals

**Goals:**
- Explicitly guard both bet-scanning loops against the `archived/` subtree
- Fix `scanCriteriaForSourceType` to use `oprim/bets/` (the current path)

**Non-Goals:**
- Adding an `--include-archived` flag (deferred alternative from BET-011)
- Changing any other doctor check behavior

## Decisions

**Explicit string guard over path introspection**: Check `entry.name === 'archived'` (in `doctor.ts`) and `entry === 'archived'` (in `measure.ts`) rather than detecting the archived pattern dynamically. The `archived/` directory name is a convention established by `oprim archive`, so a literal string match is the simplest, most readable contract.

**Fix `scanCriteriaForSourceType` path in the same change**: The `primer/bets/` → `oprim/bets/` fix is a latent bug that would surface immediately if the path were correct. Since BET-011 touches this function anyway, correcting the path is in-scope — it's one line and avoids a separate follow-up.

## Risks / Trade-offs

- `archived/` as a hard-coded string — if the archive directory were ever renamed, the guard would silently stop working → Low risk; the name is enforced by `oprim archive`
- Fixing `scanCriteriaForSourceType` path changes behavior: previously always returned `false`, now may return `true` for active bets with criteria → Correct behavior, not a regression; any project that has migrated to `oprim/` will now get accurate credential warnings
