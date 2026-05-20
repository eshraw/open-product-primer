# Open Product Primer

Open Product Primer (`open-product-primer`, short **`oprim`**) stores product decisions, sequencing, and KPI outcomes under **`primer/`** in the repo — the foundation layer before OpenSpec.

> Legacy names: `open-rmp` tool, `roadmap/` artifact root (see `openspec/changes/add-open-product-primer-decision-and-kpi-layer`).

## What it does

Open Product Primer answers **why / order / outcomes** before OpenSpec answers **what / how**:

| Layer | Tool | Artifacts |
|-------|------|-----------|
| Decision & sequencing | Open Product Primer (`oprim`) | `primer/` |
| Implementation planning | OpenSpec (`opsx`) | `openspec/changes/` |
| Semantic traceability | Graphify | `graphify-out/` |

## Installation

```bash
npm install -g @open-product-primer/cli@latest
```

## Quick start

```bash
cd your-project
open-product-primer init   # scaffold primer/ workspace
open-product-primer doctor # verify setup
open-product-primer update # install /oprim:* assistant commands
```

Short alias works everywhere:

```bash
oprim init
oprim doctor
oprim update
```

## CLI reference

### `oprim init`

Creates the project-local `primer/` workspace. Idempotent — safe to re-run; existing decision artifacts and config values are preserved.

**Creates:**

```
primer/
├── config.yaml          # project config and integration flags
├── sequence.yaml        # Now/Next/Later board
├── decisions/           # PDR artifacts
├── bets/                # bet decision artifacts
├── reviews/             # KPI review artifacts
└── templates/           # ready-to-use templates
    ├── pdr.md
    ├── bet-decision.md
    ├── criteria.yaml
    └── kpi-review.md
```

Detects OpenSpec (`openspec/`) and Graphify (`graphify-out/`) and enables integration flags in `primer/config.yaml` without requiring those tools to be present.

### `oprim update`

Refreshes `/oprim:*` assistant commands for detected AI tools (Claude Code, Cursor).

### `oprim doctor`

Reports pass/fail status for:

- primer scaffold and config
- OpenSpec and Graphify integrations (optional)
- measurement environment variables (`AMPLITUDE_API_KEY`, `GOOGLE_APPLICATION_CREDENTIALS`)
- installed assistant commands

## Key concepts

### Product Decision Records (PDRs)

Durable product policy decisions stored at `primer/decisions/PDR-XXX-name.md`. Separate from bet prioritization decisions so policy is never duplicated across initiative artifacts.

### Bet decisions

Time-bound prioritization decisions at `primer/bets/BET-XXX/bet-decision.md`. Reference PDRs by ID instead of restating policy — a bet links to the relevant PDRs.

### Sequencing board

`primer/sequence.yaml` — structured Now/Next/Later board with `blocked_by`, `unlocks`, `requires_pdrs`, and WIP limits. Use `/oprim:sequence` to validate the board state.

### Criteria contracts

`primer/bets/BET-XXX/criteria.yaml` — metric definitions with baseline, target, timeframe, and data source. Imported from Notion at bet promotion time and linked forward to OpenSpec changes.

### KPI reviews

`primer/reviews/YYYY-MM-DD-BET-XXX-kpi.md` — post-launch metric comparison and decision-quality reflection. Outcomes feed back into bet decisions, PDRs, and sequencing.

## Agent commands

Install with `oprim update`, then use in Claude Code or Cursor:

| Command | Description |
|---------|-------------|
| `/oprim:promote BET-XXX` | Promote a prioritized bet to an OpenSpec change with criteria linking |
| `/oprim:sequence` | Validate the sequencing board and suggest rebalancing |

## Authority boundaries

Open Product Primer owns **why / order / outcomes**.
OpenSpec owns **what / how** for each change.

Primer artifacts never duplicate implementation requirements.
OpenSpec artifacts never duplicate prioritization rationale.
The link between the layers is the promotion contract (`/oprim:promote`).

## npm package

Package: `@open-product-primer/cli`
Bin aliases: `open-product-primer`, `oprim`
Source: `packages/cli/`
