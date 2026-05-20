## 1. /oprim:pdr — Product Decision Record authoring

- [ ] 1.1 Create `.claude/skills/oprim-pdr/SKILL.md` with full playbook: PDR ID scan pattern `PDR-(\d+)-`, zero-padded assignment, output path formula, all PDR sections, supersession protocol (update both new and existing PDR files)
- [ ] 1.2 Create `.claude/commands/oprim/pdr.md` as thin wrapper: frontmatter + one-line description + `Use the Skill tool to invoke the oprim-pdr skill`
- [ ] 1.3 Create `.cursor/skills/oprim-pdr/SKILL.md` with the same full playbook content as 1.1
- [ ] 1.4 Create `.cursor/commands/oprim-pdr.md` with full playbook inline (Cursor has no Skill tool)
- [ ] 1.5 Add `oprim-pdr` skill template and `pdr` command wrapper to `packages/cli/src/commands/update.ts` for distribution via `oprim update`

## 2. /oprim:bet — Bet decision authoring

- [ ] 2.1 Create `.claude/skills/oprim-bet/SKILL.md` with full playbook: BET ID scan pattern `BET-(\d+)$`, zero-padded assignment, bet-decision template population, sequence.yaml append protocol (exact YAML entry structure from design), optional PDR linking
- [ ] 2.2 Create `.claude/commands/oprim/bet.md` as thin wrapper
- [ ] 2.3 Create `.cursor/skills/oprim-bet/SKILL.md` with the same full playbook content as 2.1
- [ ] 2.4 Create `.cursor/commands/oprim-bet.md` with full playbook inline
- [ ] 2.5 Add `oprim-bet` skill template and `bet` command wrapper to `packages/cli/src/commands/update.ts`

## 3. /oprim:criteria — Criteria contract authoring

- [ ] 3.1 Create `.claude/skills/oprim-criteria/SKILL.md` with full playbook: bet existence check, Amplitude source block schema, BigQuery source block schema, append-safe write protocol (read → parse → append to metrics list → write)
- [ ] 3.2 Create `.claude/commands/oprim/criteria.md` as thin wrapper
- [ ] 3.3 Create `.cursor/skills/oprim-criteria/SKILL.md` with the same full playbook content as 3.1
- [ ] 3.4 Create `.cursor/commands/oprim-criteria.md` with full playbook inline
- [ ] 3.5 Add `oprim-criteria` skill template and `criteria` command wrapper to `packages/cli/src/commands/update.ts`

## 4. /oprim:review — KPI review authoring

- [ ] 4.1 Create `.claude/skills/oprim-review/SKILL.md` with full playbook: criteria pre-fill from `criteria.yaml`, actual value prompting per metric, status logic (`actual >= target` → hit, `actual < target` → missed, not provided → pending), output path formula `primer/reviews/YYYY-MM-DD-BET-NNN-kpi.md`, follow-up actions checklist
- [ ] 4.2 Create `.claude/commands/oprim/review.md` as thin wrapper
- [ ] 4.3 Create `.cursor/skills/oprim-review/SKILL.md` with the same full playbook content as 4.1
- [ ] 4.4 Create `.cursor/commands/oprim-review.md` with full playbook inline
- [ ] 4.5 Add `oprim-review` skill template and `review` command wrapper to `packages/cli/src/commands/update.ts`

## 5. sequencing-board delta spec sync

- [ ] 5.1 Verify `primer/sequence.yaml` backlog append behavior is consistent with updated sequencing-board spec
