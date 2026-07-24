## 1. Config scaffolding

- [x] 1.1 ~~Add `notes.tags` to the `config.yaml` template~~ — superseded by the resolved lazy-write decision: `notes.tags` is written by the `oprim-note` skill on first use (task 3.3), not scaffolded by `init`/`update`
- [x] 1.2 ~~Seed this repo's own `oprim/config.yaml`~~ — superseded for the same reason; this repo's `notes.tags` self-seeded via NOTE-001 in task 6.2

## 2. Note templates

- [x] 2.1 Add a minimal note frontmatter helper (`type`, `title`, `tags`, `timestamp` — no `description`) and a note body template to `packages/cli/src/lib/templates.ts`
- [x] 2.2 Wire `oprim init` to scaffold `oprim/templates/note.md`, using the existing `okfFrontmatter()` helper when `okf.enabled` and the new minimal helper otherwise — same conditional already used for `bet-decision`/`pdr`/`kpi-review`
- [x] 2.3 Add `oprim/notes/` (with `.gitkeep`) to the directories `oprim init` creates, alongside `bets/`/`decisions/`/`reviews/`

## 3. oprim-note skill

- [x] 3.1 Add `oprim-note` skill content to `packages/cli/src/lib/install-agent.ts`, mirroring the `oprim-bet` skill's structure
- [x] 3.2 Implement `NOTE-NNN` id assignment: scan `oprim/notes/NOTE-(\d+)` files, take max + 1, zero-padded to 3 digits
- [x] 3.3 Prompt for note title, tags, and optional `Bets:` reference(s). Tags are checked against `oprim/config.yaml`'s `notes.tags`; if a tag isn't present (including when the list is empty/absent), accept it and append it to `notes.tags` — the vocabulary self-seeds from usage rather than blocking
- [x] 3.4 Write `oprim/notes/NOTE-NNN-<slug>.md` with the correct frontmatter tier
- [x] 3.5 Register the `oprim-note` skill/command wrapper for Claude and Cursor agents (mirroring how `oprim-bet` is registered)
- [x] 3.6 Add the `oprim-note` workflow section to the Codex/Gemini inline instructions (`oprimWorkflowsInline()`)

## 4. Promote dispatch

- [x] 4.1 Refactor `promoteContent()` in `packages/cli/src/lib/install-agent.ts` to branch on ID prefix (`BET-` vs `NOTE-`) as its first step
- [x] 4.2 Implement the note → bet path: create `oprim/bets/BET-NNN/bet-decision.md` with `Why now` pre-filled from the note body, other sections left as template placeholders
- [x] 4.3 Register the new bet in `oprim/sequence.yaml` backlog (same shape `oprim-bet` already writes)
- [x] 4.4 Link the promoted note to the resulting bet (append a `Bets: BET-NNN` reference to the note, or update its `## Links`-equivalent section)
- [x] 4.5 Add an explicit "unrecognized ID prefix" error path instead of a silent no-op

## 5. Tests

- [x] 5.1 Add tests for the `noteMinimalFrontmatter` template helper and the `oprim init` note scaffold (minimal vs OKF tier) in `templates.test.ts` / `integration.test.ts`
- [x] 5.2 ~~Unit-test `NOTE-NNN` id assignment~~ — not applicable: like `BET-NNN`/`PDR-NNN` assignment, this logic lives in agent-executed skill prose, not TS code, and this codebase doesn't unit-test that pattern elsewhere either. Covered instead by a content spot-check that the skill text contains the `NOTE-(\d+)-` scanning instruction
- [x] 5.3 Add a content spot-check that the `oprim-note` skill instructs self-seeding tag behavior (accept + append, never reject)
- [x] 5.4 Add content-assertion tests for `promoteContent()`'s ID-prefix dispatch: `BET-`/`NOTE-` branches and the unrecognized-prefix error both present

## 6. Verification

- [x] 6.1 Run `npm test` in `packages/cli/` and confirm all suites pass — 136/136 passing
- [x] 6.2 Manually scaffolded NOTE-001 (minimal tier, self-seeded `notes.tags`, linked to BET-013), promoted it to BET-032 (`Why now` pre-filled, other sections left as placeholders, registered in `sequence.yaml`, bidirectionally linked) to confirm the pipeline, then removed the synthetic BET-032 — NOTE-001 and its link from BET-013 are kept as a real artifact
