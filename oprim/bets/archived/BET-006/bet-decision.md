# Decision: BET-006 Add multi-tool agentic support (Codex, Gemini CLI, Copilot CLI, and beyond)

## Status
- Decision: Build now
- Date: 2026-05-27
- Owner: Eshane
- Review date: 2026-06-27

## Why now
- oprim's value shouldn't be locked to one tool — the product primer methodology is tool-agnostic by design, and the implementation shouldn't tie users to Claude or Cursor
- The agentic tool landscape is fragmenting fast; teams will use whichever tool fits their workflow

## Alternatives considered
- Abstract over a common skill/tool protocol — define an oprim skill interface that any tool implementing the protocol can consume; get inspired by how openspec handles multi-tool support (chosen direction)

## Expected outcomes
- oprim works in Codex and Gemini CLI within 4 weeks (baseline: Claude/Cursor only)

## Kill criteria / rollback trigger
- No user demand for non-Claude/Cursor support in 30 days — defer the multi-tool work

## Links
- PDRs: None
- OpenSpec change: `openspec/changes/bet-006-multi-tool-support-codex-gemini/`
