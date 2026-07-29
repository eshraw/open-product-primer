## Context

`oprim/sequence.yaml` is the source of truth for the roadmap sequencing board. It stores bets organized into `now`, `next`, `later`, and `backlog` buckets, with explicit `blocked_by`, `unlocks`, and `requires_pdrs` dependency fields. Currently the only way to read the board is to open the YAML file directly or ask the agent.

The goal is a committed, static visual that renders in GitHub without any tooling — so contributors and stakeholders can orient to the roadmap in seconds.

## Goals / Non-Goals

**Goals:**
- Generate a static visual from `sequence.yaml` renderable in GitHub
- Show bets grouped by bucket and dependency relationships
- Regenerate automatically when `/oprim:sequence` runs

**Non-Goals:**
- Interactive or web-based views
- Real-time or watch-mode regeneration
- Hosting the view anywhere other than the repo

## Decisions

### Mermaid over HTML

**Decision**: Use a Mermaid `graph TD` diagram embedded in a Markdown file (`oprim/sequence-view.md`).

**Rationale**: GitHub renders Mermaid natively in `.md` files. No build step, no extra dependencies, no server. The diagram is version-controlled alongside `sequence.yaml` and diffs cleanly in PRs.

**Alternative rejected**: Static HTML — requires opening locally or serving; doesn't render inline on GitHub.

### Output location: `oprim/sequence-view.md`

**Decision**: Commit the view as `oprim/sequence-view.md` (a Markdown file wrapping the Mermaid block).

**Rationale**: Keeps it co-located with `sequence.yaml`. A `.md` file gets GitHub rendering for free; a standalone `.mmd` file does not.

### Regeneration hook: extend `/oprim:sequence`

**Decision**: Extend the `/oprim:sequence` skill to regenerate `sequence-view.md` after every sequence update, not as a separate command.

**Rationale**: Keeps view and data in sync without requiring users to remember a second step. The sequence skill already validates the board state — regenerating the view is a natural final step.

### Dependency rendering

**Decision**: Render `blocked_by` edges as directed arrows in the diagram. Bets with no dependencies are standalone nodes.

**Rationale**: The most actionable information for planning is "what is blocked and by what." `unlocks` is the inverse and is derivable, so rendering `blocked_by` arrows is sufficient.

## Risks / Trade-offs

- **Mermaid complexity at scale** → Mitigation: Limit the diagram to active buckets (now/next/later); backlog rendered as a simple list below the diagram to avoid clutter.
- **View drift if sequence skill is not always run** → Mitigation: Add a note in `sequence-view.md` header indicating it is auto-generated; document regeneration step in CLAUDE.md or README.
- **Mermaid label length** → Mitigation: Truncate bet titles to ~40 characters in diagram labels; full titles remain in `sequence.yaml`.
