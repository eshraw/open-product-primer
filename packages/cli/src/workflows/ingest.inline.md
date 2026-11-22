### Meeting ingest (oprim-ingest)
Update `wiki/` from a meeting note and propose destinations for its decisions.

1. Read the note (path given, or ask), `products:` from `oprim/config.yaml`, and existing `wiki/` page names.
2. Extract people, products, decisions, action items.
3. Append-only (never edit or delete existing wiki lines): dated entries to `wiki/log.md`, `wiki/people/<name>.md`, `wiki/products/<product>.md`, `wiki/decisions/<date>-<slug>.md`.
4. Per decision, propose one destination — wiki log only, portfolio PDR, product PDR, note or bet candidate — and write nothing outside `wiki/` until confirmed.
5. Product destinations need a second confirmation with the exact path (local products only); git products get a line in `outputs/handoffs/<product>.md`.
6. Report; append `- <date> /oprim:ingest <path>` under `## Last commands` in `STATE.md`.
