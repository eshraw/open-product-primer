# Decision: BET-002 Add a visual sequencing view

## Status
- Decision: Build now
- Date: 2026-05-27
- Owner: Eshane
- Review date: 2026-06-27

## Why now
- The sequencing board only exists as YAML — reading raw text or querying the agent is the only way to understand what's queued and in what order
- New contributors can't quickly orient to the product roadmap without CLI knowledge or agent access
- Planning meetings need a shareable, human-readable artifact rather than a YAML file

## Alternatives considered
- Mermaid diagram auto-generated from sequence.yaml — dependency graph committed alongside the YAML, renderable in GitHub
- HTML / web view — static HTML file or local server to render the board interactively
- Agent-rendered summary only (rejected) — not a static artifact; requires agent every time

## Expected outcomes
- sequence.yaml has a human-readable visual within 4 weeks (baseline: none)

## Kill criteria / rollback trigger
- No one references the view in planning within 30 days — remove it

## Links
- PDRs: None
- OpenSpec change: openspec/changes/bet-002-visual-sequencing-view/
