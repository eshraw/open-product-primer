### Plan the week (oprim-plan-week)
Plan the week from `STATE.md`, the inbox and the boards; calendar/chat tools are optional.

1. Read `STATE.md` (Focus, In progress, Blockers, Last commands), count open `inbox.md` items, and read the boards via `oprim ovw --portfolio --json` — falling back to `oprim/sequence.yaml` silently if unavailable.
2. If calendar or chat tools are available, read this week's meetings and waiting threads; otherwise skip silently.
3. Ask "What has to be true by Friday?" with 2–3 candidates.
4. Reply with Outcome, By day (Mon–Fri), Board moves (suggestions; change the board via oprim-sequence), Inbox count.
5. Update only those four `STATE.md` sections; append `- <date> /oprim:plan-week` under `## Last commands`.
