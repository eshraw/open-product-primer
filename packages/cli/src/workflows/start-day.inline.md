### Start the day (oprim-start-day)
Plan today from what is written down; calendar/chat tools are optional.

1. Read `STATE.md` (Focus, In progress, Blockers, Last commands), count open `inbox.md` items, and read the boards via `oprim ovw --portfolio --json` — falling back to `oprim/sequence.yaml` silently if unavailable.
2. If calendar or chat tools are available, read today's meetings and new mentions; otherwise skip silently.
3. Reply with Focus today (1–3), Meetings (if known), Unblock, Inbox count (suggest triage if > 10 or stale).
4. Update only those four `STATE.md` sections; append `- <date> /oprim:start-day` under `## Last commands`.
