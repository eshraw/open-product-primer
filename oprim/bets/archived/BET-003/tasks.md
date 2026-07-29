## 1. Remove Command Files

- [x] 1.1 Delete `.claude/commands/oprim/bet.md`
- [x] 1.2 Delete `.claude/commands/oprim/criteria.md`
- [x] 1.3 Delete `.claude/commands/oprim/pdr.md`
- [x] 1.4 Delete `.claude/commands/oprim/review.md`

## 2. Update Documentation References

- [x] 2.1 Grep `.claude/` for `/oprim:bet`, `/oprim:criteria`, `/oprim:pdr`, `/oprim:review` references
- [x] 2.2 Update any stale command references in skill files to use the `oprim-*` skill name instead
- [x] 2.3 Update any stale command references in CLAUDE.md or onboarding docs

## 3. Verify

- [x] 3.1 Confirm `.claude/commands/oprim/` contains only `promote.md` and `sequence.md`
- [x] 3.2 Confirm `oprim-bet`, `oprim-criteria`, `oprim-pdr`, `oprim-review` skills still invoke correctly
