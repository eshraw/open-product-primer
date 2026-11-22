## 1. Reproduce first

- [x] 1.1 Failing test: folding an ADDED-only delta into a legacy current-truth file with 3 requirements yields 5 (today: 2)
- [x] 1.2 Failing test: folding into a file with a title + `## Purpose` keeps the preamble
- [x] 1.3 Failing test: `parseCurrentTruthHeaders()` on a legacy file returns its headers (today: `[]`)

## 2. Current-truth reader and fold

- [x] 2.1 Add `readCurrentTruth()` to `lib/spec-delta.ts` (preamble, canonical + legacy blocks, duplicate-header rule, header line count)
- [x] 2.2 Route `parseCurrentTruthHeaders()` and `foldDelta()` through it; output preamble + canonical section
- [x] 2.3 Add the unparsed-requirements guard to `foldDelta()`
- [x] 2.4 Tests: 1.1–1.3 pass; guard throws on unknown heading; REMOVED-section blocks ignored; existing spec-delta, validate, drift-interceptor and cross-bet tests unchanged

## 3. Migration command

- [x] 3.1 `oprim migrate --specs` in `commands/migrate.ts`, with per-file count/content verification before write
- [x] 3.2 Tests on temp dirs: legacy ADDED-only, mixed ADDED+MODIFIED with duplicate header, canonical untouched, idempotent re-run, plain `oprim migrate` unchanged
- [x] 3.3 Run it on this repo; check `sequence-view-scaffold` by hand; commit the spec rewrite on its own

## 4. Doctor and archive prose

- [x] 4.1 `checkLegacySpecFormat()` non-required doctor warning
- [x] 4.2 Update `workflows/archive.template.md` §4 (and `archive.inline.md`) to keep preamble and all non-modified requirements and to stop on a count mismatch; run `oprim update` so the installed skill matches

## 5. Untrack dist

- [x] 5.1 `git rm -r --cached packages/cli/dist`
- [x] 5.2 CI step failing on any tracked file under `packages/cli/dist`
- [x] 5.3 Confirm `npm pack --dry-run` still lists `dist/cli.js`, `dist/lib/claude-mods.js`, `dist/workflows/`

## 6. Verify on the portfolio bets

- [x] 6.1 `oprim validate --diff BET-075` shows 5 requirements in `workflow-schema-authoring`
- [x] 6.2 `oprim validate --strict` passes on this repo; full test suite green
- [x] 6.3 CLAUDE.md: note canonical current-truth format and `oprim migrate --specs`
