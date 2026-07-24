## Context

`oprim/config.yaml` is written once by `init` (`writeFileIfAbsent`) and never touched by `update` today — "preserved on update" simply means nothing writes to it after creation, not that any merge logic exists. The schema is thin: `project`, `integrations` (openspec, graphify), `measurement`, `sequencing`, `agents`. OpenSpec's own config (`context:` free text + per-artifact `rules:`) is the model being adapted. `BET-026` (remote stores, deferred) needs a `store:` key that this bet should reserve space for but not implement.

## Goals / Non-Goals

**Goals:**
- Let a team declare language, tech stack, and project conventions in `context:`, and per-artifact `rules:` that generated bet/PDR/spec/review content honors
- Give `oprim update` a real, additive merge step: introduce schema keys a project doesn't yet have, with defaults, never touching what's already set
- Reserve a `store:` key (present but inert) so BET-026 has a landing spot without this bet implementing store resolution

**Non-Goals:**
- Implementing remote store resolution itself (BET-026's scope)
- The declarative workflow-schema refactor (BET-027) — this bet expands config data, not how skill content is generated from it
- Retrofitting `BET-023`'s `integrations.spec_framework` key onto this mechanism (that's a follow-up cleanup once both land, noted in BET-023's design.md)

## Decisions

**1. Schema additions**: `context: <free text>`, `rules: { bet: <text>, pdr: <text>, spec: <text>, review: <text> }` (per-artifact, all optional/empty by default), `store: { enabled: false }` (placeholder only). Alternative considered: a single global `rules:` string applied to everything — rejected, per-artifact rules match OpenSpec's demonstrated pattern and let a team scope guidance (e.g., "PDRs must cite a Slack thread" without forcing that onto bet generation).

**2. Merge algorithm**: parse existing `oprim/config.yaml`, walk the current template's key structure, and for any key path absent from the existing file, insert it with its default value at the corresponding position; any key path already present is left completely untouched, including its formatting/comments where feasible. Alternative considered: regenerate the whole file from the template and re-apply user overrides — rejected, higher risk of subtly dropping or reordering unknown/manually-added user content (the bet's own kill criterion is exactly this failure mode).

**3. Where rules get consumed**: `install-agent.ts`'s skill content for bet/PDR/spec/review authoring reads `rules.<artifact>` (when non-empty) and appends it as additional guidance in the generated instructions, rather than templates.ts's static templates being parameterized per-project. Keeps the change localized to the same place that already assembles skill content.

**4. `store:` is inert in this bet**: written to config with `enabled: false` and no other keys, so `BET-026` has a stable place to extend into without a schema migration of its own.

## Risks / Trade-offs

- [Risk] The merge step corrupts, reorders, or silently drops user content (explicit bet kill criterion) → Mitigation: merge is strictly additive (only ever adds missing key paths, never rewrites or reorders existing ones); tests assert byte-for-byte preservation of pre-existing keys across an update.
- [Risk] Expanded config surface goes unused (explicit bet kill criterion) → Mitigation: keep all new keys optional with inert defaults; nothing behaves differently for a project that never sets `context:`/`rules:`.
- [Risk] Divergence between this bet's merge mechanism and BET-023's one-off `integrations.spec_framework` addition if they ship out of order → Mitigation: BET-023's design.md already flags this as an open question to reconcile at whichever bet ships second; no action needed in this change beyond making the merge mechanism itself easy to reuse for a single extra key.

## Migration Plan

- Existing projects: next `oprim update` run adds `context: ""`, empty `rules: {}`, and `store: {enabled: false}` to their `oprim/config.yaml`, preserving every existing value untouched
- Rollback: revert the template/merge code; already-added keys are harmless no-ops if left in place, or can be manually removed with no dependency on them existing

## Open Questions

- Whether `rules:` should support nested project-specific keys beyond the four artifact types (bet/pdr/spec/review) — deferred until a concrete need arises
- Final default shape of `store: {enabled: false}` vs. an empty `store: {}` — left to BET-026 to finalize when it implements store resolution
