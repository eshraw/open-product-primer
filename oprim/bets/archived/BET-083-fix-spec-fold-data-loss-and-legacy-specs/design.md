# Design: BET-083 spec fold integrity, legacy spec migration, untracked dist

## Context
`lib/spec-delta.ts` assumes current truth has one flat `## Requirements` section. 27 of 63 specs in this repo use delta headings instead, so:
- `parseCurrentTruthHeaders()` returns `[]` → false MODIFIED/REMOVED drift in `validate`;
- `foldDelta()` builds its output from `extractSection(currentTruth, 'Requirements') ?? ''` → every existing requirement in a legacy file is **dropped** on fold;
- `foldDelta()` always returns `## Requirements\n\n…` → the preamble (title, Purpose) of *every* spec is dropped on fold.
`/oprim:archive`'s prose (`archive.template.md` §4) describes the same flat-format assumption.

## Decisions

### 1. One current-truth reader, used everywhere
New `readCurrentTruth(content)` in `spec-delta.ts`:
```ts
interface CurrentTruth { preamble: string; blocks: RequirementBlock[]; legacy: boolean; headerLineCount: number }
```
- `preamble` = every line before the first `## Requirements` / `## ADDED|MODIFIED|REMOVED Requirements` heading.
- `blocks` = blocks under `## Requirements`, plus (legacy) `## ADDED` and `## MODIFIED` sections, in file order; a header that appears twice keeps the later (MODIFIED) block. `## REMOVED` blocks are ignored.
- `headerLineCount` = raw count of `^### Requirement:` lines, for the guard.
`parseCurrentTruthHeaders()` and `foldDelta()` both call it, so `validate`, `validate --diff` and the drift interceptor mod stay consistent.

### 2. Guard instead of silent loss
`foldDelta()` throws when `blocks.length + removedLegacyCount < headerLineCount`, naming the file and counts. Cheap, and catches any future format we don't know about.

### 3. Output always canonical
`foldDelta()` returns `preamble + '## Requirements\n\n' + blocks`. Folding into a legacy file therefore also migrates it — the migration command is for doing all files at once, explicitly, before anyone archives.

### 4. `oprim migrate --specs`
Lives in `commands/migrate.ts` as a flag (migrate is already the "reshape an existing workspace" command). Uses `readCurrentTruth()` + a writer; per file it re-parses the output and compares block count and normalized block content (`trim`, collapse whitespace) before writing. Reports migrated / skipped / unchanged. Run once in this repo as part of the bet, and the 27-file diff is reviewed as its own commit.

### 5. Doctor hint
`checkLegacySpecFormat()` in `validate-checks.ts`, called by doctor only (non-required). Not a validate failure: reading is now tolerant, so a legacy file is untidy, not dangerous.

### 6. Archive prose
`archive.template.md` §4 step 2 is updated to say current truth may contain legacy sections and that the fold must keep preamble and all non-modified requirements, and to stop if the requirement counts don't add up. The prose must match the TypeScript; ideally `/oprim:archive` previews via `oprim validate --diff <BET>` before writing.

### 7. Untrack dist
`git rm -r --cached packages/cli/dist` (20 files; `.gitignore` already lists `dist/`). Add a CI step `test -z "$(git ls-files packages/cli/dist)"`. `prepublishOnly` already builds before publish, so the release flow is unchanged. CLAUDE.md's `node dist/cli.js` instructions already say to build first.

## Alternatives considered
- Treat legacy `## ADDED` blocks as canonical forever (no migration) — rejected: two formats to document and reason about.
- Make the migration part of `oprim update` — rejected: `update` should not rewrite 27 human-reviewed spec files without the user asking.

## Risks
- The drift interceptor mod (BET-051) and cross-bet conflict check read headers through these functions; their tests must be re-run.
- `sequence-view-scaffold` is the only legacy file with a `## MODIFIED` section — inspect it manually after migration.
- Out of scope (already covered elsewhere): hard-coded workflow install lists → BET-075; `checkout: BET-012` YAML-map warning → BET-076.
