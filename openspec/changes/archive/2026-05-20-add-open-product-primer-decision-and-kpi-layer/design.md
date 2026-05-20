## Context

**Open Product Primer** (legacy working name: `open-rmp`) currently has no concrete decision framework despite clear intent in the repository description. The target workflow is to work alongside OpenSpec (change-level planning and delivery) and Graphify (semantic traceability), while adding PM-native decision memory and sequencing discipline.

Key constraints:
- Do not overlap with OpenSpec change artifacts (`proposal.md`, `design.md`, specs, tasks).
- Preserve one-way promotion: decisions and priorities feed OpenSpec, not vice versa.
- Support structured success criteria currently authored in Notion and measured in Amplitude + BigQuery/Metabase.

## Product naming

| Surface | Value | Notes |
|---------|-------|-------|
| Brand | **Open Product Primer** | Human-facing name in docs and README |
| npm package | `@open-product-primer/cli` | Global install target |
| CLI (full) | `open-product-primer` | `init`, `update`, `doctor` — parallel to `openspec` |
| CLI (short) | `oprim` | Bin alias for daily use — parallel to `/opsx:*` (not a separate CLI grammar) |
| Agent commands | `/oprim:*` | e.g. `/oprim:promote`, `/oprim:sequence` |
| Command files | `oprim-*.md`, `.claude/commands/oprim/` | Replaces legacy `rmp-*` paths |
| Artifact root | `primer/` | Project-local workspace (config, decisions, bets, sequence, reviews) |
| Repo folder (planned) | `open-product-primer` | Rename from `open-rmp` (tasks §0) |

**Positioning:** Open Product Primer owns **why / order / outcomes** before OpenSpec owns **what / how**. Primer = foundation layer in the repo; `oprim` = short command namespace (Open + Primer → **oprim**).

**Supersedes:** `open-rmp`, `@open-rmp/cli`, `/rmp:*`, `rmp-*` assistant command paths, and legacy artifact root `roadmap/`.

## Goals / Non-Goals

**Goals:**
- Provide repeatable per-project installation (`open-product-primer init`, `update`, `doctor`; alias `oprim`) comparable to OpenSpec and Graphify.
- Introduce two decision layers:
  - Durable Product Decision Records (PDRs)
  - Time-bound bet prioritization decisions
- Add a sequencing board with explicit blockers, unlocks, and PDR preconditions.
- Define a KPI automation pipeline that turns criteria contracts into measurable outputs.
- Keep authority boundaries explicit across Open Product Primer, OpenSpec, and Graphify.
- Provide operational templates and command patterns for immediate usage.

**Non-Goals:**
- Replace OpenSpec as the source of truth for implementation requirements.
- Replace Notion as a portfolio workspace before promotion.
- Build a full analytics orchestration service in this change.
- Auto-apply primer artifact changes without human review gates.
- Require manual copy-paste of templates for every new project (init must scaffold automatically).

## Decisions

### 1) Separate decision artifacts into PDRs and bet decisions

- **Decision**: Use `primer/decisions/PDR-*.md` for durable product decisions and `primer/bets/BET-*/bet-decision.md` for prioritization decisions.
- **Rationale**: Prevents conflating product policy with initiative ordering and enables ADR-style institutional memory for PM work.
- **Alternative considered**: Keep only bet decisions.
  - Rejected because durable product constraints would be repeatedly duplicated and re-litigated.

### 2) Keep sequencing as a first-class contract (`primer/sequence.yaml`)

- **Decision**: Store `Now/Next/Later` with `blocked_by`, `unlocks`, `requires_pdrs`, and WIP limits.
- **Rationale**: Makes order and dependency logic machine-queryable and reviewable in PRs.
- **Alternative considered**: Keep sequencing only in free-form docs.
  - Rejected due to weak consistency checks and poor agent interoperability.

### 3) Promote criteria to repo-native contracts at bet promotion time

- **Decision**: On `/oprim:promote`, import structured criteria from Notion into `criteria.yaml` in the bet folder.
- **Rationale**: Measurements should run off a stable, versioned contract close to specs and code.
- **Alternative considered**: Read metrics only from Notion at runtime.
  - Rejected due to version drift and poor reproducibility.

### 4) Explicit authority boundary with OpenSpec

- **Decision**: Open Product Primer owns why/order/outcomes; OpenSpec owns what/how for each change.
- **Rationale**: Avoids overlap while retaining strong linking between layers.
- **Alternative considered**: merge primer narrative into OpenSpec `proposal.md`.
  - Rejected because it blurs portfolio and implementation responsibilities.

### 5) Use Graphify as traceability bridge, not decision source

- **Decision**: Graphify links PDR/bet/criteria/spec/code/events; it does not replace decision artifacts.
- **Rationale**: Keeps decision edits human-reviewable while still enabling graph-powered queries.
- **Alternative considered**: graph-only decision storage.
  - Rejected due to reduced readability and governance ergonomics.

### 6) Distribute as a global CLI with project-local scaffold (OpenSpec-style)

- **Decision**: Ship `open-product-primer` as an installable CLI package with bin alias `oprim`. Projects are bootstrapped with `open-product-primer init` (or `oprim init`) and kept current with `open-product-primer update`.
- **Rationale**: Matches proven patterns from OpenSpec (`openspec init` / `update`) and Graphify (`graphify claude install`), making adoption reproducible repo-to-repo.
- **Alternative considered**: documentation-only setup (copy templates manually).
  - Rejected because it does not scale and causes drift between projects.

### 7) Idempotent init with integration detection

- **Decision**: `open-product-primer init` creates the primer scaffold, default config, starter templates, and agent command files. It detects OpenSpec (`openspec/`) and Graphify (`graphify-out/`) and writes integration flags in `primer/config.yaml` without failing when they are absent.
- **Rationale**: Supports brownfield projects and mixed toolchain adoption.
- **Alternative considered**: hard dependency on OpenSpec being installed first.
  - Rejected because teams may adopt Open Product Primer before OpenSpec in some repos.

### 8) Install surface per AI assistant

- **Decision**: `open-product-primer update` refreshes assistant-specific slash commands/skills (Cursor, Claude Code, Codex, etc.) from packaged templates, similar to `openspec update`.
- **Rationale**: Agent workflows are part of the product; installation must include command discovery, not only folders.
- **Alternative considered**: CLI-only, no assistant integration.
  - Rejected because PM workflows are agent-assisted by default in target users.

## Installation model (target UX)

```bash
# One-time (machine)
npm install -g @open-product-primer/cli@latest

# Per project (repo root)
cd your-project
open-product-primer init   # or: oprim init
open-product-primer doctor # or: oprim doctor
open-product-primer update # or: oprim update
```

**`open-product-primer init` creates:**

```
primer/
├── config.yaml
├── sequence.yaml
├── decisions/
│   └── .gitkeep
├── bets/
│   └── .gitkeep
├── reviews/
│   └── .gitkeep
└── templates/
    ├── pdr.md
    ├── bet-decision.md
    ├── criteria.yaml
    └── kpi-review.md
.cursor/commands/oprim-*.md    # when Cursor detected
.claude/commands/oprim/...     # when Claude detected
```

**`open-product-primer doctor` checks:**

- primer scaffold present and valid
- config schema version
- optional OpenSpec / Graphify directories
- optional measurement env vars (`AMPLITUDE_*`, `GOOGLE_APPLICATION_CREDENTIALS`, Metabase URL)
- agent command files in sync with installed CLI version

**`open-product-primer update`:**

- refreshes agent commands/skills from package templates
- migrates `primer/config.yaml` when schema version bumps (non-destructive)

## Risks / Trade-offs

- **Risk**: Added process overhead for PMs and engineers  
  -> **Mitigation**: Keep templates compact and enforce lightweight weekly cadence.
- **Risk**: Metric definitions drift between criteria and instrumentation  
  -> **Mitigation**: Add metric map validation and explicit source mapping checks.
- **Risk**: Boundary confusion with OpenSpec  
  -> **Mitigation**: Document clear ownership and one-way promotion contract in specs.
- **Risk**: Data access/API limits for Amplitude/Metabase  
  -> **Mitigation**: Start with generated query definitions and manual-run fallback.
- **Risk**: Premature automation complexity  
  -> **Mitigation**: phase rollout (v0 manual import, v1 generation, v2 scheduled feedback).
- **Risk**: Install drift across projects and assistant tools  
  -> **Mitigation**: versioned config schema, `doctor` checks, and `update` command to re-sync commands.
- **Risk**: Competing init conventions with OpenSpec/Graphify  
  -> **Mitigation**: detect-only integration model; never overwrite foreign tool directories.
- **Risk**: Rename churn from `open-rmp` to Open Product Primer  
  -> **Mitigation**: document mapping table above; complete repo rename in tasks §0 before CLI publish.
