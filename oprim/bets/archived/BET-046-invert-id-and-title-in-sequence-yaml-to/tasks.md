# Tasks: Invert id/title field order in sequence.yaml

## 1. Field order in sequence.yaml writers
- [x] 1.1 Update `oprim-bet`'s sequence.yaml backlog-append logic to emit `title:` before `id:`
- [x] 1.2 Update `oprim-sequence` skill's board-write logic to emit `title:` before `id:`
- [x] 1.3 Update `oprim:promote`'s Note → Bet registration step to emit `title:` before `id:`

## 2. Existing entries
- [x] 2.1 Reorder fields on any bet block touched by a subsequent `oprim-sequence` move or edit, rather than bulk-rewriting the whole file
