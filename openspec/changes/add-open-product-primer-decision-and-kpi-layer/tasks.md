## 0. Rename planning (open-rmp → Open Product Primer)

- [x] 0.1 Rename git repository / workspace root from `open-rmp` to `open-product-primer` (or org-scoped equivalent)
- [x] 0.2 Rename OpenSpec change directory from `add-open-rmp-decision-and-kpi-layer` to `add-open-product-primer-decision-and-kpi-layer`
- [x] 0.3 Update `README.md` and root docs to **Open Product Primer** with CLI `open-product-primer` and short form `oprim`
- [x] 0.4 Replace remaining `open-rmp`, `/rmp:*`, `rmp-*`, and `roadmap/` references across the repo (grep audit)
- [x] 0.6 Rename artifact root from `roadmap/` to `primer/` in OpenSpec change specs and templates
- [x] 0.5 Reserve npm scope/package `@open-product-primer/cli` and document bin aliases: `open-product-primer`, `oprim`

## 1. OpenSpec change scaffolding and documentation

- [x] 1.1 Finalize proposal scope and capability mapping for installation, decision, sequencing, KPI, and promotion contract capabilities
- [x] 1.2 Finalize design document with architecture decisions, boundaries, phased rollout, and installation model
- [x] 1.3 Review and align all capability specs with proposal vocabulary and requirements language

## 2. CLI distribution and project installation

- [x] 2.1 Create CLI package skeleton with `init`, `update`, and `doctor` commands (`@open-product-primer/cli`, bin `open-product-primer` + `oprim`)
- [x] 2.2 Implement idempotent `open-product-primer init` (alias `oprim init`) scaffold for `primer/` directories, config, sequence file, and templates
- [x] 2.3 Implement OpenSpec/Graphify detection and write integration flags to `primer/config.yaml`
- [x] 2.4 Implement `open-product-primer update` to install/refresh `/oprim:*` assistant commands for supported tools
- [x] 2.5 Implement `open-product-primer doctor` health checks for scaffold, config schema, integrations, and measurement env readiness
- [x] 2.6 Add installation guide (`README` + docs) with reproducible setup: global install, per-project init, doctor, update

## 3. Roadmap artifact model and templates

- [x] 3.1 Create `primer/decisions/` and `primer/bets/` structure with ready-to-use PDR and bet-decision templates
- [x] 3.2 Create `primer/sequence.yaml` template including WIP limits, blockers, unlocks, and PDR preconditions
- [x] 3.3 Create KPI criteria and KPI review templates under bet and review artifact paths

## 4. Promotion contract and workflow commands

- [x] 4.1 Define `/oprim:promote` behavior for linking bets to OpenSpec changes and importing criteria contracts
- [x] 4.2 Define authority-boundary checks that prevent overlap between primer artifacts and OpenSpec implementation artifacts
- [x] 4.3 Define `/oprim:sequence` validation behavior for blockers, PDR preconditions, and WIP limits

## 5. KPI automation integration surface

- [x] 5.1 Define criteria-to-measurement mapping for Amplitude and BigQuery sources
- [x] 5.2 Define generated output format for metric definitions and measurement runs
- [x] 5.3 Define review artifact update flow for bet outcomes, PDR updates, and sequencing recommendations
