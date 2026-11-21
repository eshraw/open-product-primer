## 1. Artifact

- [ ] 1.1 Add `oprim/templates/objective.md` (OKF and non-OKF) to the portfolio scaffold
- [ ] 1.2 `lib/portfolio/objectives.ts` `listObjectives()` parsing heading, Status, Period (frontmatter-aware)
- [ ] 1.3 Tests: OKF on/off parsing, superseded status

## 2. Workflow

- [ ] 2.1 `workflows/objective.schema.yaml` (`modes: [portfolio]`) + `objective.template.md`
- [ ] 2.2 `objective.cursor-command.md` and `objective.inline.md` variants
- [ ] 2.3 Tests: installed for every agent in portfolio mode; absent in product mode

## 3. Links and checks

- [ ] 3.1 `checkObjectiveLinks()` — missing-link and inactive-objective warnings; portfolio detection via mode or identity
- [ ] 3.2 Wire into doctor and validate
- [ ] 3.3 Tests: product without portfolio stays quiet; product with portfolio source warns; portfolio warns; dropped objective warns; dangling ref reported once (by BET-076 check only)

## 4. Bet template

- [ ] 4.1 Add conditional `- Objectives:` step/line to `bet.template.md` (and its cursor/inline variants)
- [ ] 4.2 Validate `products[].objectives` refs resolve

## 5. Docs

- [ ] 5.1 README: objectives section; CLAUDE.md source layout entry
