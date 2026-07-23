# Analysis: OKF fit for open-product-primer

Related: [BET-012](./bet-decision.md)

## What OKF actually specifies

Open Knowledge Format (OKF, Google Cloud, published June 2026) represents knowledge as a
directory of markdown files, each with a small YAML frontmatter block:

```yaml
---
type: BigQuery Table       # only required field
title: Orders
description: One row per completed customer order.
resource: https://...      # optional link to the canonical system
tags: [sales, revenue]
timestamp: 2026-05-28T14:30:00Z
---
# prose body — schema tables, descriptions, cross-links to other files
```

Design stance: frontmatter carries the few fields you'd filter/index on; the markdown body
carries the prose, schemas, and detail an LLM or human actually reads. No proprietary API,
no SDK — "just files."

## Current state of this repo

`oprim/` and `openspec/` already store every artifact as a directory of markdown files
(`oprim/bets/BET-NNN/`, `openspec/specs/<name>/spec.md`), which is OKF's core structural
convention. But none of the existing templates use YAML frontmatter:

| Artifact | Format today |
|---|---|
| `oprim/templates/bet-decision.md` | Plain markdown, `# Decision: BET-NNN <title>` heading, `## Status` section carries decision/date/owner/review date as bullet text |
| `oprim/templates/pdr.md` | Plain markdown, `# PDR-XXX` heading, `## Status` as free text (`Proposed \| Accepted \| ...`) |
| `oprim/templates/kpi-review.md` | Plain markdown |
| `oprim/templates/criteria.yaml` | **Pure YAML, no markdown body at all** — structured metric definitions only |
| `openspec/specs/*/spec.md` | Plain markdown, `## ADDED Requirements` / `### Requirement:` / `#### Scenario:` structure |

Cross-references (`Bets: BET-IDs`, `OpenSpec: change paths`) are plain text, not markdown
links — OKF's cross-linking convention (`[customers](/tables/customers.md)`) isn't used.

## Fit, mapped field by field

- **`type`** — maps cleanly. Every artifact already has an implicit type from its directory
  (`bet-decision`, `pdr`, `kpi-review`, `spec`). Promoting this to frontmatter costs nothing
  semantically; it's already encoded in the filename/path.
- **`title`** — already present as the H1 heading in every markdown artifact; would be
  duplicated, not added, if lifted into frontmatter.
- **`description`** — no direct equivalent today. Would need a new one-line summary field
  (PDRs have `## Context` but it's prose-length, not a one-liner).
- **`resource`** — weak fit. OKF's `resource` typically points at an external system
  (a BigQuery console link, a dataset). This repo's artifacts don't reference external
  systems — the closest analogue is a GitHub path to the artifact itself, which is redundant.
- **`tags`** — no direct equivalent today; would be a genuinely new, useful axis (e.g.
  tagging bets/specs by domain: `sequencing`, `kpi`, `agent-support`).
- **`timestamp`** — partial overlap. `bet-decision.md` already has a `Date:` field in the
  `## Status` body; lifting it to frontmatter is a small, safe change.

**`criteria.yaml` is the one structural mismatch.** OKF assumes markdown-with-frontmatter;
`criteria.yaml` is standalone structured data with no prose body to separate from. Forcing
it into OKF's shape (wrapping metric definitions as frontmatter with an empty body) doesn't
buy anything — it's not "the few fields to index vs. the prose to read," it's all structured
data. This one artifact type doesn't want to be OKF.

## Where OKF would plausibly pay off

- **Agent context assembly** — Claude (via this CLI's skills) and `graphify --wiki` both
  already do the job OKF is designed for: assembling curated markdown into agent-readable
  context. `graphify --wiki` builds an "agent-crawlable wiki" (`index.md` + one article per
  community) that is conceptually the closest existing overlap — it's already producing an
  OKF-shaped artifact in spirit, just without the frontmatter contract. Standardizing on
  OKF's `type`/`tags` fields would let an agent filter oprim/openspec artifacts by kind
  without re-parsing markdown headers to infer it, which is exactly the "solve
  context-assembly from scratch" problem OKF names as its reason for existing.
- **Portability** — if oprim/openspec content is ever exported, indexed by an external
  search tool, or shared outside this repo's own tooling, OKF frontmatter is a
  vendor-neutral contract for that, versus the current implicit convention that only this
  CLI's own commands understand.

## Recommendation: Go, scoped

Adopt OKF frontmatter as an **additive convention on markdown artifacts only**
(`bet-decision.md`, `pdr.md`, `kpi-review.md`, `spec.md`), not as a wholesale format
migration:

- Add `type`, `title`, `description`, `tags`, `timestamp` frontmatter to the four markdown
  templates in `lib/templates.ts` / `install-agent.ts`. `resource` is optional and likely
  blank for most artifacts — don't force it.
- Leave `criteria.yaml` as pure YAML; it doesn't fit OKF's markdown+frontmatter shape and
  gains nothing from being forced into it.
- Treat this as forward-compatible, not a retrofit requirement — existing BET-005 and other
  archived artifacts don't need to be rewritten; new artifacts and template updates adopt it
  going forward.

This does **not** meet the kill criterion set in the bet decision ("irreconcilable schema
conflict") — the conflict is scoped to one artifact type (`criteria.yaml`), not the whole
schema. The markdown-based artifacts (the majority of oprim/openspec content) map onto OKF
cleanly with low migration cost.

## Next steps if this bet proceeds

1. Add frontmatter blocks to the four markdown templates.
2. Update `install-agent.ts` (source of truth for skill-generated content) to emit
   frontmatter when scaffolding new bets/PDRs/reviews.
3. Prototype exporting one existing bet directory as a standalone OKF bundle to sanity-check
   the end-to-end shape.
4. Leave `criteria.yaml` out of scope.
