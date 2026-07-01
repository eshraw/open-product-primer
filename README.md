# Open Product Primer

Every developer hits the same moment: you're about to build something and haven't written down why — what problem it solves, why now, and what would make you stop. **`oprim`** gives that decision a home in your repo.

Install `oprim`, run `oprim init` to set up your workspace, then use `/oprim:bet` in your AI coding agent to capture your first decision. That's the core loop.

## What it does

oprim stores the decisions that precede implementation — why you're building something, in what order, and whether it worked. It sits alongside your implementation planning tool (OpenSpec) and traceability tool (Graphify) as the layer that answers **why / order / outcomes**:

| Layer | Tool | Artifacts |
|-------|------|-----------|
| Decision & sequencing | oprim | `oprim/` |
| Implementation planning | OpenSpec (`opsx`) | `openspec/changes/` |
| Semantic traceability | Graphify | `graphify-out/` |

## Installation

```bash
npm install -g @open-product-primer/cli@latest
```

## Quick start

```bash
cd your-project
oprim init    # scaffold oprim/ workspace
oprim doctor  # verify setup
oprim update  # install /oprim:* assistant commands
```

## CLI reference

### `oprim init`

Creates the project-local `oprim/` workspace. Idempotent — safe to re-run; existing decision artifacts and config values are preserved. Existing repos with `primer/` should run `oprim migrate` first.

**Creates:**

```
oprim/
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

Detects OpenSpec (`openspec/`) and Graphify (`graphify-out/`) and enables integration flags in `oprim/config.yaml` without requiring those tools to be present.

### `oprim update`

Refreshes `/oprim:*` assistant commands for detected AI tools (Claude Code, Cursor).

### `oprim doctor`

Reports pass/fail status for:

- oprim/ scaffold and config
- OpenSpec and Graphify integrations (optional)
- measurement environment variables (`AMPLITUDE_API_KEY`, `GOOGLE_APPLICATION_CREDENTIALS`)
- installed assistant commands

## Key concepts

### Product Decision Records (PDRs)

Durable product policy decisions stored at `oprim/decisions/PDR-XXX-name.md`. Separate from bet prioritization decisions so policy is never duplicated across initiative artifacts.

### Bet decisions

Say you're deciding whether to rewrite a legacy service, cut a feature that isn't landing, or invest in a new capability. Before you build, you write a *bet*: what's the problem, why tackle it now, and what outcome would tell you it worked. That artifact lives at `oprim/bets/BET-XXX/bet-decision.md` and links to relevant policy decisions (PDRs) so you're not restating policy each time.

### Sequencing board

`oprim/sequence.yaml` — structured Now/Next/Later board with `blocked_by`, `unlocks`, `requires_pdrs`, and WIP limits. Use `/oprim:sequence` to validate the board state.

### Criteria contracts

`oprim/bets/BET-XXX/criteria.yaml` — metric definitions with baseline, target, timeframe, and data source. Imported from Notion at bet promotion time and linked forward to OpenSpec changes.

### KPI reviews

`oprim/reviews/YYYY-MM-DD-BET-XXX-kpi.md` — post-launch metric comparison and decision-quality reflection. Outcomes feed back into bet decisions, PDRs, and sequencing.

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
Bin aliases: `oprim`, `open-product-primer`
Source: `packages/cli/`

Releases are published via GitHub Actions on `v*` tags using [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) (see `.github/workflows/release.yml`).
