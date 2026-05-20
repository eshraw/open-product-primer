## 1. OpenSpec change scaffolding and documentation

- [ ] 1.1 Finalize proposal scope and capability mapping for installation, decision, sequencing, KPI, and promotion contract capabilities
- [ ] 1.2 Finalize design document with architecture decisions, boundaries, phased rollout, and installation model
- [ ] 1.3 Review and align all capability specs with proposal vocabulary and requirements language

## 2. CLI distribution and project installation

- [ ] 2.1 Create CLI package skeleton with `init`, `update`, and `doctor` commands
- [ ] 2.2 Implement idempotent `open-rmp init` scaffold for `roadmap/` directories, config, sequence file, and templates
- [ ] 2.3 Implement OpenSpec/Graphify detection and write integration flags to `roadmap/config.yaml`
- [ ] 2.4 Implement `open-rmp update` to install/refresh `/rmp:*` assistant commands for supported tools
- [ ] 2.5 Implement `open-rmp doctor` health checks for scaffold, config schema, integrations, and measurement env readiness
- [ ] 2.6 Add installation guide (`README` + docs) with reproducible setup: global install, per-project init, doctor, update

## 3. Roadmap artifact model and templates

- [ ] 3.1 Create `roadmap/decisions/` and `roadmap/bets/` structure with ready-to-use PDR and bet-decision templates
- [ ] 3.2 Create `roadmap/sequence.yaml` template including WIP limits, blockers, unlocks, and PDR preconditions
- [ ] 3.3 Create KPI criteria and KPI review templates under bet and review artifact paths

## 4. Promotion contract and workflow commands

- [ ] 4.1 Define `/rmp:promote` behavior for linking bets to OpenSpec changes and importing criteria contracts
- [ ] 4.2 Define authority-boundary checks that prevent overlap between roadmap artifacts and OpenSpec implementation artifacts
- [ ] 4.3 Define `/rmp:sequence` validation behavior for blockers, PDR preconditions, and WIP limits

## 5. KPI automation integration surface

- [ ] 5.1 Define criteria-to-measurement mapping for Amplitude and BigQuery sources
- [ ] 5.2 Define generated output format for metric definitions and measurement runs
- [ ] 5.3 Define review artifact update flow for bet outcomes, PDR updates, and sequencing recommendations
