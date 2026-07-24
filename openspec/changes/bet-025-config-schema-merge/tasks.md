## 1. Schema expansion

- [ ] 1.1 Add `context: ""`, `rules: {}`, and `store: {enabled: false}` to the `oprim/config.yaml` template in `lib/templates.ts`
- [ ] 1.2 Update `oprim init` (`commands/init.ts`) to write the expanded schema on fresh init

## 2. Merge-on-update mechanism

- [ ] 2.1 Implement a generic key-path diff between the current template schema and a project's existing `oprim/config.yaml`
- [ ] 2.2 Insert any missing key path with its default value; leave every existing key path (value, nesting, formatting) untouched
- [ ] 2.3 Update `oprim update` (`commands/update.ts`) to run this merge step on every invocation
- [ ] 2.4 Ensure the merge is idempotent — running `oprim update` twice in a row produces no further changes the second time

## 3. Rule consumption in generated content

- [ ] 3.1 Update the bet-authoring skill content in `install-agent.ts` to read `rules.bet` and include it in generated guidance when non-empty
- [ ] 3.2 Update the PDR-authoring skill content to read `rules.pdr` likewise
- [ ] 3.3 Update the spec-authoring skill content (BET-023) to read `rules.spec` likewise
- [ ] 3.4 Update the review-authoring skill content to read `rules.review` likewise
- [ ] 3.5 Confirm generation behaves identically to today when `rules:` is empty

## 4. Tests

- [ ] 4.1 Add/extend tests (real temp directories, no filesystem mocking, per repo convention) covering: fresh init writes expanded schema; update on an old config adds only the missing keys; update on a current config is a no-op; user-set `context`/`rules` values survive an update unchanged; generated bet/PDR/spec/review content reflects non-empty rules

## 5. Documentation

- [ ] 5.1 Document the `context:`/`rules:`/`store:` schema additions in this repo's own README or CLAUDE.md if dogfooded
