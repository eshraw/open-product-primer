---
type: note
title: "Invert id and title in sequence.yaml to improve visibility"
tags: [usability]
timestamp: 2026-08-11
---

# Note: Invert id and title in sequence.yaml to improve visibility

sequence.yaml entries currently list `id:` before `title:` in each bet block. Since the title is the human-readable, scannable part and the ID is mostly a cross-reference key, flipping the field order (title first, then id) would make the board easier to visually parse when skimming now/next/later/backlog — especially as the list grows. This is a small formatting change to the YAML structure itself (and any tooling/templates that generate it), not a data model change.

## Bets
- None
