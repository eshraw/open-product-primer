## 1. Config scaffolding

- [ ] 1.1 Add `notes.tags` (empty list by default) to the `config.yaml` template in `packages/cli/src/lib/templates.ts`
- [ ] 1.2 Add `notes.tags: []` to this repo's own `oprim/config.yaml`

## 2. Note templates

- [ ] 2.1 Add a minimal note template (`type`, `title`, `tags`, `timestamp` frontmatter + prose body) to `packages/cli/src/lib/templates.ts`
- [ ] 2.2 Add an OKF-tier note template variant (adds `description`) to `packages/cli/src/lib/templates.ts`
- [ ] 2.3 Wire template selection on the existing `okf.enabled` read (same conditional already used for `bet-decision`/`pdr`/`kpi-review`)

## 3. oprim-note skill

- [ ] 3.1 Add `oprim-note` skill content to `packages/cli/src/lib/install-agent.ts`, mirroring the `oprim-bet` skill's structure
- [ ] 3.2 Implement `NOTE-NNN` id assignment: scan `oprim/notes/NOTE-(\d+)` files, take max + 1, zero-padded to 3 digits
- [ ] 3.3 Prompt for note title, tags (validated against `oprim/config.yaml`'s `notes.tags`), and optional `Bets:` reference(s)
- [ ] 3.4 Write `oprim/notes/NOTE-NNN-<slug>.md` with the correct frontmatter tier
- [ ] 3.5 Register the `oprim-note` skill/command wrapper for Claude and Cursor agents (mirroring how `oprim-bet` is registered)
- [ ] 3.6 Add the `oprim-note` workflow section to the Codex/Gemini inline instructions (`oprimWorkflowsInline()`)

## 4. Promote dispatch

- [ ] 4.1 Refactor `promoteContent()` in `packages/cli/src/lib/install-agent.ts` to branch on ID prefix (`BET-` vs `NOTE-`) as its first step
- [ ] 4.2 Implement the note → bet path: create `oprim/bets/BET-NNN/bet-decision.md` with `Why now` pre-filled from the note body, other sections left as template placeholders
- [ ] 4.3 Register the new bet in `oprim/sequence.yaml` backlog (same shape `oprim-bet` already writes)
- [ ] 4.4 Link the promoted note to the resulting bet (append a `Bets: BET-NNN` reference to the note, or update its `## Links`-equivalent section)
- [ ] 4.5 Add an explicit "unrecognized ID prefix" error path instead of a silent no-op

## 5. Tests

- [ ] 5.1 Add tests for note scaffolding (minimal vs OKF-tier frontmatter) in `packages/cli/src/__tests__/`
- [ ] 5.2 Add tests for `NOTE-NNN` id assignment (first note, next-after-existing, gaps)
- [ ] 5.3 Add tests for tag validation against `notes.tags` controlled vocabulary
- [ ] 5.4 Add tests for promote dispatch: `BET-` path unchanged, `NOTE-` path creates a bet and links it, unrecognized prefix errors

## 6. Verification

- [ ] 6.1 Run `npm test` in `packages/cli/` and confirm all suites pass
- [ ] 6.2 Manually scaffold a note with `oprim-note`, then promote it with `/oprim:promote NOTE-001`, and confirm the resulting bet and links look correct
