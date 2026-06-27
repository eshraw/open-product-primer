## 1. README rewrite

- [ ] 1.1 Rewrite the README opening section to lead with concrete value framing — what oprim does for the developer before mentioning workspace structure or terminology
- [ ] 1.2 Add a concrete example scenario (e.g. "you're deciding whether to rebuild X") before the formal definition of a bet
- [ ] 1.3 Review remaining README sections for methodology jargon that appears before it has been defined; fix any occurrences

## 2. init next-step guidance

- [ ] 2.1 Add a next-step output line at the end of the `oprim init` success path in `packages/cli/src/commands/init.ts`
- [ ] 2.2 Write the line text: defines "bet" in one sentence, tells the user to run `/oprim:bet` in their agent, uses plain language
- [ ] 2.3 Confirm the line is suppressed when init exits with an error

## 3. oprim-bet skill context block

- [ ] 3.1 Add a context block to the `oprim-bet` skill in `packages/cli/src/lib/install-agent.ts` — placed before the existing naming convention tip
- [ ] 3.2 Write the context block text: 1–2 sentences defining a bet functionally, no methodology jargon
- [ ] 3.3 Run `npm run build` and verify the updated skill content is written correctly on `oprim update`

## 4. Link artifacts

- [ ] 4.1 Add the OpenSpec change path to `oprim/bets/BET-018-improve-new-user-onboarding-from-first-contact-to-first-bet/bet-decision.md` Links section
