# Decision: BET-081 Add PM prioritization, comms and reviewer persona workflows
<!-- Naming tip: verb + object [for context] — e.g. "Improve bet naming for scannability" not "Naming" -->

## Status
- Decision: Build now
- Date: 2026-11-21
- Owner: Eshane Rawat
- Review date: 2027-01-22

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)
- [ ] 1-way door (hard to reverse — requires higher confidence before committing)

## Risk profile
- **Value risk**: Medium — stakeholder updates and roadmap comms are recurring PM chores, but only worth automating if the boards they read from are kept current (BET-079/080 prove that first).
- **Usability risk**: Medium — audience selection and output formats must match how the PM actually communicates.
- **Feasibility risk**: Low — workflows over already-deterministic inputs (portfolio view `--json`, reviews); personas are plain `.claude/agents/*.md` files.
- **Business viability risk**: Medium — outbound comms drafted by an agent can misstate commitments; drafts must stay drafts in `outputs/`.

## Why now
- Completes R5 once the inputs exist: `/oprim:prioritize` and comms workflows read `ovw --portfolio --json` (BET-079) and depend on the PM-workflow install mechanism (BET-080).
- Reviewer personas give fast critique on bets/specs/criteria without a human reviewer — cheap to add once the install path is mode-aware.

## Alternatives considered
- Let `/oprim:prioritize` apply board changes directly — rejected: board is the owner's opinion; it proposes, never applies.
- Two-way Notion sync for `/oprim:publish` — out of scope; git stays the source of truth, publish renders a one-way Notion-ready PRD.
- Personas for every agent — rejected for now: only Claude has a first-class subagent location (`.claude/agents/`).

## Expected outcomes
- `/oprim:prioritize` ranks by OKR fit, risk profile and door type and outputs a proposed `sequence.yaml` diff without applying it.
- `/oprim:stakeholder-update` and `/oprim:roadmap-comms` write audience-specific drafts to `outputs/` from boards and reviews; `/oprim:publish <BET|PDR>` writes a Notion-ready PRD to `outputs/publish/`.
- `c-level`, `eng-lead`, `data-eng` agents installed under `.claude/agents/` in portfolio mode; each appends a `## <persona> perspective` section to the reviewed file.

## Kill criteria / rollback trigger
- First 3 stakeholder updates each need > 50% rewriting before sending → drop the comms workflows and keep prioritize only.
- Persona sections are deleted or ignored on most reviewed files → stop installing personas by default.

## Links
- PDRs: PDR-001
- Objectives: None
- OpenSpec change: <to be filled when promoted>
