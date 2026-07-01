## 1. README corrections

- [ ] 1.1 Fix package name typo in install command: `@open-product-oprim/cli` → `@open-product-primer/cli`
- [ ] 1.2 Replace all `open-product-primer <cmd>` examples with `oprim <cmd>` throughout the README
- [ ] 1.3 Demote `open-product-primer` long-form alias to a single mention in the npm package section only
- [ ] 1.4 Verify the quickstart section is self-sufficient: install → init → doctor → update with no unexplained steps

## 2. CHANGELOG narrative

- [ ] 2.1 Audit the auto-generated entries (0.1.x → 0.14.0) to extract the major development themes
- [ ] 2.2 Write a `## Development arc (0.x)` narrative block (3–5 paragraphs) covering: initial scaffold, agent support expansion, sequencing/board work, doctor/integrity checks, onboarding improvements
- [ ] 2.3 Prepend the narrative block above the first `## [0.x.x]` auto-generated heading in `packages/cli/CHANGELOG.md`

## 3. Verification

- [ ] 3.1 Confirm `npm install -g @open-product-primer/cli@latest` resolves correctly (package name is valid on npm)
- [ ] 3.2 Read the README top-to-bottom as a first-time external developer and confirm no prior knowledge is assumed
- [ ] 3.3 Confirm the narrative block in CHANGELOG.md is above all auto-generated entries and would survive a release-please prepend
