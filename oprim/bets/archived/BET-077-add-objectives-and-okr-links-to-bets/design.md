# Design: BET-077 objectives and OKR links

## Context
PDR-001 makes objectives first-class under `oprim/objectives/` so they are citable through remote context and resolvable deterministically. Portfolio bets and portfolio PDRs need nothing new: same `BET-NNN`/`PDR-NNN` namespaces, qualified across workspaces (BET-076).

## Decisions

### 1. Artifact shape
Markdown with fixed `##` sections (like PDRs), not YAML — objectives carry rationale prose, and Dataview/Notion read frontmatter anyway when OKF is on. `period` and `status` are duplicated into frontmatter only when OKF is enabled, matching how `type`/`title` are duplicated for other artifacts today.

### 2. Workflow `objective`
`workflows/objective.{schema.yaml,template.md}` plus `objective.cursor-command.md` and `objective.inline.md`; `modes: [portfolio]` (mechanism from BET-075). Structure mirrors `pdr.template.md`: ID scan, `rules.objective`, OKF check against `oprim/templates/objective.md`, supersession. Scaffolded template `oprim/templates/objective.md` added by `scaffoldPortfolio()`.

### 3. Checks: `lib/portfolio/objectives.ts`
```ts
export function listObjectives(workspaceRoot: string): Array<{ id: string; status: string; period: string; path: string }>;
export function checkObjectiveLinks(projectRoot: string, checks: Check[]): void;
```
- Dangling refs are already reported by BET-076's `checkCrossProductRefs` (kind `OBJ`); this module only adds the *missing-link* and *inactive-objective* warnings, so no reference is reported twice.
- "Has a portfolio" = `readWorkspaceMode() === 'portfolio'` OR any source whose identity has `mode: portfolio` (identity-only resolution — cheap).

### 4. `## Links` parsing
Reuse `collectRefs()` from BET-076; the `- Objectives:` line is already in its list. `oprim-bet`'s template gains an optional `- Objectives:` line — in product mode only when a portfolio source is registered, so product-mode bet output is otherwise unchanged (the template instruction is conditional, the installed skill text changes once for everyone — see Risks).

## Alternatives considered
- Objectives as YAML (`objectives.yaml`) — rejected: no rationale, poor for humans, merge-conflict-prone single file.
- Warn on every unlinked bet everywhere — rejected (noise in standalone product repos).

## Risks
- Adding a conditional `- Objectives:` line to `bet.template.md` changes the installed `oprim-bet` skill text in product repos (one-time skill-drift on update). Behaviour is unchanged when no portfolio source exists. Accepted in review (2026-11-21).
