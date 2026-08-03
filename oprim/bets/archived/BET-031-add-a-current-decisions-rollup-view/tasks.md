## 1. Scaffold the script

- [x] 1.1 Write `oprim/scripts/generate-decisions-view.js` (inline parser, no external deps, mirroring `generate-sequence-view.js`)
- [x] 1.2 Wire `oprim init` to write the script into new projects
- [x] 1.3 Wire `oprim update` to overwrite the script with the current template version

## 2. Render the rollup

- [x] 2.1 Parse `Status` (and `Superseded by PDR-YYY`) out of each `oprim/decisions/PDR-*.md` file
- [x] 2.2 List Accepted PDRs as top-level current decisions in `oprim/decisions-view.md`
- [x] 2.3 Collapse superseded PDRs under their successor with a back-link
- [x] 2.4 Handle an empty `oprim/decisions/` directory with a "no decisions yet" message instead of an error

## 3. Wire regeneration into oprim-pdr

- [x] 3.1 Add a final step to the `oprim-pdr` workflow template that runs `node oprim/scripts/generate-decisions-view.js`
- [x] 3.2 Confirm Codex/Gemini/Poolside inline workflow renderings include the same step (parity with `sequence-view-scaffold`'s approach)

## 4. Tests

- [x] 4.1 Test: `oprim init` scaffolds the script
- [x] 4.2 Test: `oprim update` refreshes the script
- [x] 4.3 Test: script output correctly collapses a superseded PDR under its successor
- [x] 4.4 Test: script output on an empty decisions directory
- [x] 4.5 Test: `oprim-pdr` triggers regeneration after writing a PDR
