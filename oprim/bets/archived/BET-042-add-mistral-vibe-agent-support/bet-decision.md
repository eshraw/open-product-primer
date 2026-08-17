# Decision: BET-042 Add Mistral Vibe agent support

## Status
- Decision: Build now
- Date: 2026-08-17
- Owner: Eshane
- Review date: 2026-09-14

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)
- [ ] 1-way door (hard to reverse — requires higher confidence before committing)

## Risk profile
- **Value risk**: Medium — product adoption is cited as needing Mistral Vibe support, but the volume of teams standardized on Vibe specifically (vs. Mistral's other tooling) isn't independently confirmed yet
- **Usability risk**: Low — install path mirrors the existing Poolside (BET-040) pattern users already understand: detect a marker directory, install skills, done
- **Feasibility risk**: Low — Vibe is a documented, first-party CLI (`mistralai/mistral-vibe`) with a clear config convention
- **Business viability risk**: Low — no revenue/legal/ops exposure; purely additive OSS tool support

## Why now
- Product adoption requires supporting Mistral Vibe (`mistralai/mistral-vibe`), Mistral's first-party CLI coding agent; teams standardized on Vibe currently can't run `oprim init`/`oprim update` because Vibe isn't in `detectAvailableAgents()` or `install-agent.ts`
- Vibe reads `AGENTS.md` (walked up from cwd — the same convention Codex/Gemini already target) *and* keeps a `.vibe/` directory holding tools/skills/agents/prompts/hooks, giving oprim a plausible path to first-class skill installation rather than only an inline instruction block

## Alternatives considered
- Treat Vibe like Codex/Gemini (inline `AGENTS.md` block only, no dedicated skills directory) — simpler, but underuses `.vibe/`'s apparent skill-hosting capability if it does in fact support SKILL.md-style loading; needs confirming against `docs.mistral.ai/vibe/code/cli/agents` during implementation before committing to either path
- Wait for an explicit user demand signal (GitHub issues, support requests) before building — rejected since this is already flagged as needed for product adoption

## Expected outcomes
- Mistral Vibe added as a supported agent type, detected via presence of `.vibe/` (and/or an existing Vibe-sourced `AGENTS.md`); `oprim init`/`oprim update` install oprim skills to the correct Vibe-native location and/or write an oprim workflow section into `AGENTS.md`
- Vibe added to `detectAvailableAgents()`, the interactive `oprim init` agent-selection prompt, and `install-agent.ts` orchestration

## Kill criteria / rollback trigger
- If implementation reveals `.vibe/`'s skill directory doesn't actually support SKILL.md-compatible loading (contradicting current docs research), fall back to Codex/Gemini-style inline-`AGENTS.md`-only support rather than killing the bet
- Kill if Mistral deprecates or renames Vibe before implementation lands

## Links
- PDRs: None
- OpenSpec change: N/A (native oprim spec)
- Spec (delta): oprim/bets/pending/BET-042-add-mistral-vibe-agent-support/specs/mistral-vibe-agent-support/spec.md
- Spec (delta): oprim/bets/pending/BET-042-add-mistral-vibe-agent-support/specs/init-agent-selection/spec.md
- Criteria: none defined yet — consider adding oprim/bets/pending/BET-042-add-mistral-vibe-agent-support/criteria.yaml before archiving
