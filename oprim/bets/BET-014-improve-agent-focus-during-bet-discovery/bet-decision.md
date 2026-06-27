# Decision: BET-014 Improve agent focus during bet discovery
<!-- Naming tip: verb + object [for context] — e.g. "Improve bet naming for scannability" not "Naming" -->

## Status
- Decision: Build now
- Date: 2026-06-27
- Owner: Eshane
- Review date: 2026-07-27

## Why now
- Agents drift off-goal when exploring bets, leading to unfocused discovery sessions
- Current bet-decision.md lacks a concise goal/focus field that agents can anchor on

## Alternatives considered
- Rely on bet title alone — keep status quo; agents use the title as the focus signal
- Add a focus/goal field to bet-decision.md — minimal change to existing artifact
- Create a separate focus.md artifact — new file per bet capturing a single guiding question
- Add a system prompt note in skills — update oprim skills to remind the agent to stay on the bet goal

## Expected outcomes
- All new bets include a focus artifact by end of July 2026

## Kill criteria / rollback trigger
- Focus artifact adds friction without improving focus — if maintaining the artifact costs more than the benefit it provides

## Links
- PDRs: None
- OpenSpec change: <to be filled when promoted>
