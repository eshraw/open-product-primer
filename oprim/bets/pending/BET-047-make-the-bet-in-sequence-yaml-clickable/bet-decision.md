# Decision: BET-047 Make the bet in sequence.yaml clickable to open the file in my IDE directly

## Status
- Decision: Build now
- Date: 2026-08-17
- Owner: Eshane
- Review date: 2026-09-14

## Why now
- sequence.yaml is plain YAML — there's no native way to make an `id`/`title` pair "clickable". But bets already live at a predictable path (`oprim/bets/pending/BET-NNN-<slug>/bet-decision.md`). Tooling that renders the sequence board (e.g. `oprim doctor`/`oprim validate` output, or a future `oprim sequence show`) could emit that path as an OSC 8 terminal hyperlink or a `file://` URI next to each entry, so clicking it in a terminal that supports OSC 8 (iTerm2, VS Code's integrated terminal, etc.) opens the bet file directly in the IDE. This is a rendering/tooling change, not a change to the YAML data itself — sequence.yaml stays plain data.

## Alternatives considered
- <alternative + reason>

## Expected outcomes
- <metric: baseline -> target in timeframe>

## Kill criteria / rollback trigger
- <condition and action>

## Links
- PDRs: None
- OpenSpec change: <to be filled when promoted>
