## 1. Discovery template

- [ ] 1.1 In `packages/cli/src/lib/templates.ts`, add a `discoveryTemplate` export with sections: Problem Framing, User Research Signals, Competitive Context, Open Questions
- [ ] 1.2 In `packages/cli/src/commands/init.ts`, import `discoveryTemplate` and add a `writeFile` call to write `primer/templates/discovery.md`

## 2. Bet skill — discovery prompt

- [ ] 2.1 In `packages/cli/src/lib/install-agent.ts`, update `betSkill()` to add a step after writing `bet-decision.md`: ask "Do you want to scaffold a discovery.md now? (y/N)" and if yes, write `primer/bets/BET-NNN/discovery.md` from the discovery template
- [ ] 2.2 Update `betInlineContent()` (Cursor inline version) with the same discovery prompt step

## 3. Doctor — discovery check

- [ ] 3.1 In `packages/cli/src/commands/doctor.ts`, after the existing scaffold checks, scan `primer/bets/` for directories containing `bet-decision.md` and push a non-required check for each: pass if `discovery.md` exists, warn (yellow `○`) if absent

## 4. Verification

- [ ] 4.1 Run `npm run build` in `packages/cli/` and confirm clean compile
- [ ] 4.2 Run `oprim init` in a temp directory and confirm `primer/templates/discovery.md` is created
- [ ] 4.3 Invoke the bet skill and confirm discovery prompt appears after bet creation; confirm `discovery.md` is written on "y", skipped on "n"
- [ ] 4.4 Run `oprim doctor` in a repo with a bet missing `discovery.md` and confirm a yellow `○` warning appears (not a red `✗`)
- [ ] 4.5 Run `npm test` in `packages/cli/` and confirm all tests pass

---
## Context

`discovery.md` is always optional — doctor check is non-blocking (warning only). Default answer to the discovery prompt is "N" to keep the happy path fast.

Bet reference: `primer/bets/BET-001/bet-decision.md`
