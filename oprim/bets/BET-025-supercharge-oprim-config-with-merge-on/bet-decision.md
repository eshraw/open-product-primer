# Decision: BET-025 Supercharge oprim config with merge on update
<!-- Naming tip: verb + object [for context] — e.g. "Improve bet naming for scannability" not "Naming" -->

## Status
- Decision: Build now
- Date: 2026-07-23
- Owner: Eshane
- Review date: 2026-08-31

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)
- [ ] 1-way door (hard to reverse — requires higher confidence before committing)

## Risk profile
- **Value risk**: Medium — power users gain real leverage from declaring language, tech stack, and template rules; casual users may never touch the added surface
- **Usability risk**: Medium — more config surface means more to understand; mitigated by strong defaults and keeping advanced keys optional
- **Feasibility risk**: Low — config is already preserved on update (`writeFileIfAbsent` in init, untouched by update); adding new keys via a merge that preserves user values is a well-bounded change to `templates.ts`/`update.ts`
- **Business viability risk**: Low — no licensing or ops concerns

## Why now
- Config is already preserved on update today, but the schema is thin (project / integrations / measurement / sequencing / agents) — there is no place to declare language, tech stack, or custom template/artifact rules
- OpenSpec's config demonstrates the pattern: a free-text `context:` block plus per-artifact `rules:` injected into every agent prompt
- Expanding the schema without a merge strategy would strand existing users on old configs — so a merge (add missing keys, preserve user-set values, never clobber) is needed alongside the schema growth
- The `store:` key that remote stores (BET-026) needs will live in this expanded config

## Alternatives considered
- Keep config thin and push customization into CLAUDE.md free text
- Overwrite config on update from a template (rejected — clobbers user customization; explicitly unwanted)
- Jump straight to fully forkable schema/template workflows (that is BET-027; this is the lighter config-only step)

## Expected outcomes
- Users can declare language, tech stack, and custom template/artifact rules in `config.yaml` and have oprim artifacts honor them
- `oprim update` adds any newly-introduced config keys without overwriting user-set values
- Config becomes the single surface for a team to bias how oprim behaves

## Kill criteria / rollback trigger
- The config merge corrupts, reorders, or drops user content
- The expanded surface goes unused after a trial period

## Links
- PDRs: None
- OpenSpec change: to be filled when promoted
- Unlocks: BET-026 (store: key), relates to BET-027 (declarative schemas)
- Reference: https://github.com/Fission-AI/OpenSpec/blob/main/docs/customization.md
