## 1. Capture and triage

- [ ] 1.1 `capture` schema/template/inline (`modes: [portfolio]`)
- [ ] 1.2 `triage` schema/template/cursor-command/inline — one AskUserQuestion per item, confirm before product writes, handoff for git products
- [ ] 1.3 Tests: both installed for every agent in portfolio mode, absent in product mode

## 2. Ingest

- [ ] 2.1 `ingest` schema/template/cursor-command/inline — append-only wiki updates, destination proposals, two-level confirmation
- [ ] 2.2 Test: rendered template contains the append-only and confirmation instructions

## 3. Start-day and plan-week

- [ ] 3.1 `start-day` and `plan-week` workflows reading STATE.md, inbox, `ovw --portfolio --json` with `sequence.yaml` fallback
- [ ] 3.2 Optional calendar/Slack steps phrased as "if such tools are available"; no failure path when absent
- [ ] 3.3 STATE.md section contract (`Focus`, `In progress`, `Blockers`, `Last commands`) in the scaffold template (BET-075) and both workflows

## 4. Ask-first rule

- [ ] 4.1 Renderer strips `<!-- oprim:portfolio:start/end -->` blocks in product mode unless `rules.<id>.ask_first: true`
- [ ] 4.2 Accept `rules.<id>` as string or `{ text, ask_first }`; existing string rules keep working
- [ ] 4.3 Add ask-first blocks to `bet`, `pdr`, `criteria` templates and variants
- [ ] 4.4 Tests: product install parity snapshot unchanged; portfolio render includes block; `ask_first: false` removes it; `ask_first: true` in product keeps it

## 5. Docs

- [ ] 5.1 README: PM daily loop (capture → triage → start-day → plan-week)
