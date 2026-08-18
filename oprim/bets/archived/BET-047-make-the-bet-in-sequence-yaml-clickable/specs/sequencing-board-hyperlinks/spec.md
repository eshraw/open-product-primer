## ADDED Requirements

### Requirement: Sequencing board output SHALL render each bet entry as a clickable file hyperlink
`oprim ovw` (the sequencing board display command) SHALL emit each bet entry using an OSC 8 terminal hyperlink escape sequence pointing at that bet's `bet-decision.md` path (`oprim/bets/pending/BET-NNN-<slug>/bet-decision.md`), so a terminal that supports OSC 8 (e.g. iTerm2, VS Code's integrated terminal) can open the file directly on click. `sequence.yaml` itself SHALL remain plain data — the hyperlink is applied only at render time.

#### Scenario: Bet entry rendered as clickable link
- **GIVEN** an OSC-8-capable terminal
- **WHEN** the sequencing board is rendered via `oprim ovw`
- **THEN** each bet entry is wrapped in an OSC 8 hyperlink escape sequence targeting its `bet-decision.md` path
- **AND** clicking the entry opens that file

#### Scenario: Non-OSC-8 terminal falls back gracefully
- **GIVEN** a terminal without OSC 8 support
- **WHEN** the sequencing board is rendered
- **THEN** the bet entry text still displays normally, with the unsupported escape sequence either stripped or ignored by the terminal
