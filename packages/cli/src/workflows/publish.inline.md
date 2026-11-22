### Publish (oprim-publish)
Render a one-way, Notion-ready PRD: `/oprim:publish <BET-NNN|PDR-NNN|<source>:BET-NNN|<source>:PDR-NNN>`. Portfolio mode only. Never call a Notion API unless the user explicitly asks to upload; never read back from Notion; write only `outputs/publish/<ref>.md`.

1. Resolve the ref: unqualified → this workspace's `oprim/bets/{pending,archived}/` or `oprim/decisions/`; qualified → a registered `remote_context.sources` name, read via `oprim context --source <source>`.
2. Gather the bet decision, `criteria.yaml`, spec deltas (or current-truth specs), `design.md`, linked PDRs/objectives — or, for a PDR, its sections and linking bets.
3. Write `outputs/publish/<ref with : → ->.md` in Notion-compatible markdown, beginning `> Source of truth: <ref> in git. This page is a one-way snapshot …`; sections from git only.
4. Offer a Notion upload only if a Notion tool is available, and do it only on an explicit yes. Report the path and sources.
