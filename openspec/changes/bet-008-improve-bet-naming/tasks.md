## 1. Update oprim-bet skill

- [ ] 1.1 Add naming convention display before the title prompt (good/bad example)
- [ ] 1.2 Add soft validation: check title length (< 4 words or < 25 chars) and show warning with reformulation suggestion
- [ ] 1.3 Add confirmation prompt allowing user to proceed with original title after warning

## 2. Update bet-decision.md template

- [ ] 2.1 Add inline naming tip comment adjacent to the title field in the scaffolded template

## 3. Verify spec compliance

- [ ] 3.1 Manually invoke `oprim-bet` with a short title and confirm warning is shown with suggestion
- [ ] 3.2 Manually invoke `oprim-bet` with a qualifying title and confirm no warning appears
- [ ] 3.3 Confirm the generated `bet-decision.md` contains the naming tip comment
