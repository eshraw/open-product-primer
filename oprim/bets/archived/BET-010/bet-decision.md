# Decision: BET-010 Rename primer/ directory to oprim/

## Status
- Decision: Build now
- Date: 2026-05-29
- Owner: Eshane
- Review date: 2026-05-29

## Why now
- BET-004 consolidated all user-facing CLI strings to `oprim`, but the directory where bets, decisions, and reviews live is still called `primer/` — a hidden convention with no connection to the tool name
- New repo users see `primer/` and have no idea what it is without reading docs; `oprim/` would be self-describing and immediately recognizable
- The longer repos accumulate, the higher the migration cost — acting now while adoption is early minimizes blast radius

## Alternatives considered
- Keep `primer/` — avoids migration entirely, but perpetuates the two-name confusion BET-004 was meant to fix
- Use a different name (e.g. `.oprim/`, `oprim-workspace/`) — adds more options without a clear winner; `oprim/` is the simplest match to the binary

## Expected outcomes
- New users immediately understand the purpose of the directory without documentation
- No ambiguity between the tool name (`oprim`) and its workspace directory (`primer/`)

## Kill criteria / rollback trigger
- Migration tooling proves too complex to ship cleanly (e.g. config path rewriting is fragile across edge cases)
- Significant adoption already exists and migration cost to existing repos is prohibitive

## Links
- PDRs: None
- OpenSpec change: `openspec/changes/bet-010-rename-primer-dir/`
