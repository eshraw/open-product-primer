### Inbox triage (oprim-triage)
Route each open `inbox.md` item — one question per item, no product writes without confirmation.

1. Read open `- [ ]` lines in `inbox.md`, `products:` from `oprim/config.yaml` (local `path:` vs `git:` sources), and `wiki/products/*.md`.
2. Per item, ask one question: NOTE in <most likely product> (first), portfolio NOTE, personal task, discard.
3. Local product: show target `<path>/oprim/notes/NOTE-NNN-<slug>.md`, write only on confirmation. Git product: append a NOTE candidate to `outputs/handoffs/<product>.md` instead. Portfolio NOTE: create one in `oprim/notes/`. Personal task: add under `## In progress` in `STATE.md`. Discard: no other change.
4. Rewrite routed lines as `- [x] … → <destination>` (e.g. `→ checkout:NOTE-012`, `→ discarded`); touch nothing else.
5. Report destinations and open count; append `- <date> /oprim:triage` under `## Last commands` in `STATE.md`.
