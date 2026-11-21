## 1. Workflow

- [ ] 1.1 `workflows/delegate.schema.yaml` (`modes: [portfolio]`, Claude command `/oprim:delegate`) + `delegate.template.md` covering local (confirm-then-write) and git (handoff) paths, `--link` follow-up
- [ ] 1.2 `delegate.cursor-command.md` and `delegate.inline.md`
- [ ] 1.3 Template explicitly forbids writing under the remote-context cache, committing, branching or pushing

## 2. Link checks

- [ ] 2.1 `lib/portfolio/delegation.ts` `findDelegations()` parsing `Delegated to:` lines incl. `pending-handoff`
- [ ] 2.2 `checkDelegationLinks()` resolving product bets and comparing `Delegated from:` via identity, not string
- [ ] 2.3 Wire into validate (required) and doctor
- [ ] 2.4 Tests with two local temp workspaces: matching pair; missing back-link; mismatched back-link; product bet missing; pending handoff passes; multi-product delegation

## 3. Read-through status

- [ ] 3.1 Expose delegated status (lane, pending/archived, Decision) via the BET-076 resolver for BET-079's view
- [ ] 3.2 Test: archiving the product bet changes displayed status without any portfolio file change

## 4. Docs

- [ ] 4.1 README: delegation section incl. git handoff flow and the never-push guarantee
