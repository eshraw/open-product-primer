## Context

The bet workflow currently produces a single artifact: `bet-decision.md`. This captures the conclusion (what, why now, kill criteria) but not the research that informed it. Teams often do discovery work in Notion, Figma, or ad-hoc docs that never get linked back to the bet, making it hard to revisit or audit decisions later. A lightweight `discovery.md` co-located with the bet keeps research accessible without requiring external tooling.

## Goals / Non-Goals

**Goals:**
- Provide a structured `discovery.md` template covering problem validation, user research signals, competitive context, and open questions
- Update the `oprim bet` skill to optionally scaffold `discovery.md` at the end of bet creation
- Write the template to `primer/templates/discovery.md` on `oprim init`
- Add a non-blocking `oprim doctor` check that warns when a bet has no discovery file

**Non-Goals:**
- Making `discovery.md` required — it is always optional; the doctor check is a warning, not a failure
- Parsing or validating discovery content — it is freeform prose under structured headings
- Linking discovery to OpenSpec or Graphify

## Decisions

### Optional prompt at end of bet creation
After writing `bet-decision.md` the skill asks: "Do you want to scaffold a discovery.md now? (y/N)". If yes, writes the template. If no (or Enter), skips silently. This keeps the happy path fast while making discovery accessible.

**Alternative considered**: Always write `discovery.md` — creates noise for trivial bets where discovery isn't needed.

**Alternative considered**: Separate `/oprim:discovery` command — adds friction; collocating it in the bet flow is lower barrier.

### Doctor check is warning-only
`oprim doctor` reports `○` (yellow) for a bet missing `discovery.md`, not `✗` (red). Missing discovery doesn't break any workflow — it's a prompt to improve decision quality, not a hard gate.

**Alternative considered**: Required check — too strict; not all bets need formal discovery.

### Template in `primer/templates/`, not hardcoded
The discovery template is written to `primer/templates/discovery.md` by `oprim init` (same pattern as `pdr.md`, `bet-decision.md`). This lets teams customize it without touching the CLI.

## Risks / Trade-offs

- **Prompt fatigue** — adding a prompt at the end of bet creation could feel like friction → Mitigated by defaulting to "N" so Enter skips it
- **Template staleness** — `oprim init --refresh` would overwrite a customized template → Same trade-off exists for other templates today; acceptable

## Open Questions

- Should the doctor check scan all bet directories or only bets in `now`? Current decision: scan all bets in `primer/bets/` (keep it simple).
