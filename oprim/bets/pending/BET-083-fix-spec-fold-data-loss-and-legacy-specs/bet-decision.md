# Decision: BET-083 Fix spec fold data loss, migrate legacy current-truth specs and untrack dist
<!-- Naming tip: verb + object [for context] — e.g. "Improve bet naming for scannability" not "Naming" -->

## Status
- Decision: Build now
- Date: 2026-11-21
- Owner: Eshane Rawat
- Review date: 2026-12-01

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)
- [ ] 1-way door (hard to reverse — requires higher confidence before committing)

## Risk profile
- **Value risk**: Low — the bug silently deletes spec content on archive; every native-mode user with an old-format spec is exposed.
- **Usability risk**: Low — one migration command plus a doctor hint; normal archive behaviour is unchanged for well-formed specs.
- **Feasibility risk**: Low — the parsing lives in one module (`lib/spec-delta.ts`); the migration is a mechanical rewrite checked by requirement counts. Medium edge: `sequence-view-scaffold` mixes `## ADDED` and `## MODIFIED` sections.
- **Business viability risk**: Low — internal correctness fix; no external surface.

## Why now
- Found while speccing portfolio mode (PDR-001). `foldDelta()` reads current truth only from a flat `## Requirements` section. 27 of 63 specs in `oprim/specs/` still use delta headings (`## ADDED Requirements`, one also `## MODIFIED Requirements`), so the parser finds **zero** requirements in them.
- Consequence, verified with `oprim validate --diff BET-075`: folding BET-075's 2 ADDED requirements into `workflow-schema-authoring` outputs only those 2 and **drops its 3 existing requirements**. MODIFIED/REMOVED against these files can never match, and `validate` reports false drift (it did for BET-076).
- Every fold also drops anything above `## Requirements` (the `# <capability> Specification` title and `## Purpose`); verified against `note-authoring`.
- BET-075 and BET-076 both fold into legacy files (`workflow-schema-authoring`, `doctor-sequence-integrity`); they must not be archived before this ships.
- `packages/cli/dist/` is in `.gitignore` but 20 stale files are still tracked from old commits. A fresh checkout's `node dist/cli.js` crashes (`Cannot find module './claude-mods'`) and each local build dirties the working tree. Publishing is unaffected (`prepublishOnly` rebuilds).

## Alternatives considered
- Hand-edit the 27 files only — rejected: fixes this repo, not other users' repos with the same legacy shape, and leaves the fold dropping content on the next malformed file.
- Make parsing tolerant only, no migration — rejected: two current-truth formats forever; the archive prose and `oprim-spec` already assume the flat format.
- Keep `dist/` tracked and add a CI freshness check — rejected: `prepublishOnly` already builds; tracked output has no consumer and only goes stale.

## Expected outcomes
- `foldDelta()` never drops a requirement or the preamble: folding an ADDED-only delta into a spec with N requirements yields N + added; preamble lines above `## Requirements` are kept byte-for-byte.
- Folding refuses (throws, archive stops) when current truth contains `### Requirement:` headers but none were parsed — a guard against the next unknown format.
- `oprim migrate --specs` rewrites legacy current-truth specs to the flat format with identical requirement blocks (checked by count and content); this repo ends with 0 legacy specs; `oprim doctor` hints when a legacy spec exists.
- `oprim validate --diff BET-075` shows 5 requirements for `workflow-schema-authoring`.
- `packages/cli/dist/` untracked; `git status` stays clean after `npm run build`; all existing tests pass.

## Kill criteria / rollback trigger
- The migration cannot be made lossless (any spec's requirement count or normalized block content differs before vs after) → stop the automated migration, migrate by hand, keep only the fold guard.
- `sequence-view-scaffold`'s MODIFIED blocks turn out to modify requirements from a *different* spec → migrate that one file by hand and record the decision in its design note.

## Links
- PDRs: None (correctness fix; found under PDR-001 work)
- Objectives: None
- OpenSpec change: <to be filled when promoted>
- Spec (delta): oprim/bets/pending/BET-083-fix-spec-fold-data-loss-and-legacy-specs/specs/current-truth-spec-format/spec.md
- Spec (delta): oprim/bets/pending/BET-083-fix-spec-fold-data-loss-and-legacy-specs/specs/project-migration/spec.md
- Spec (delta): oprim/bets/pending/BET-083-fix-spec-fold-data-loss-and-legacy-specs/specs/release-packaging/spec.md
- Criteria: none yet (deferred by owner, 2026-11-21)
