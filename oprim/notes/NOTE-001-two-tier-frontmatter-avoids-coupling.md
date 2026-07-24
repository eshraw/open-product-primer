---
type: note
title: "Two-tier frontmatter avoids coupling note discoverability to OKF opt-in"
tags: [okf, promotion]
timestamp: 2026-07-24T00:00:00Z
---

# Note: Two-tier frontmatter avoids coupling note discoverability to OKF opt-in

Notes need to stay discoverable (searchable by tag/type) even in projects that declined the OKF opt-in — so unlike `bet-decision`/`pdr`/`kpi-review`, notes always carry a minimal frontmatter tier (`type`/`title`/`tags`/`timestamp`). Only the upgrade to a `description` field is gated behind `okf.enabled`. This decouples "can this note be found later" from an unrelated feature flag, directly addressing BET-013's kill criterion ("notes are never referenced").

## Bets
- BET-013
