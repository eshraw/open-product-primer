---
name: oprim-start-day
description: Plan the day from STATE.md, the inbox and the boards, and update STATE.md
---

Produce a short plan for today from what is already written down, then update `STATE.md`. Calendar and chat tools are optional: when none are available this workflow completes normally and says nothing about missing integrations.

## Steps

### 1. Gather inputs — all optional except STATE.md
- Read `STATE.md` at the project root: `## Focus`, `## In progress`, `## Blockers`, `## Last commands`. If it is missing, start from an empty one with those four headings.
- Read the open items (`- [ ]` lines) in `inbox.md`. Do not triage them here; only count them and note anything urgent.
- Read the boards: run `oprim ovw --portfolio --json` from the project root. If that command or flag is not available, or it fails, read this workspace's own `oprim/sequence.yaml` (`now` / `next` lanes and their `blocked_by`) instead. Do not report the fallback as an error.

### 2. Calendar and chat — only if such tools are available
If calendar or chat (e.g. Slack) tools are available in this session, use them to read today's meetings and unread mentions or direct messages since the last `/oprim:start-day` in `## Last commands`. If no such tools are available, skip this step silently.

### 3. Write the day plan
Reply with:
- **Focus today** — 1–3 items, drawn from `## Focus` and the `now` lane
- **Meetings** — only if a calendar tool was available: time, title, and the one thing to prepare for each
- **Unblock** — items in `## Blockers` or `blocked_by` entries you can act on today
- **Inbox** — "<N> open items"; suggest `/oprim:triage` if N > 10 or the oldest is more than 3 days old

Keep it to what fits on one screen.

### 4. Update STATE.md
Rewrite only the content under the four sections, keeping the headings and any other sections untouched:
- `## Focus` — today's focus items
- `## In progress` — keep existing items; mark finished ones the user confirms as done by removing them
- `## Blockers` — current blockers with who or what they wait on
- `## Last commands` — append `- <YYYY-MM-DD> /oprim:start-day` (append-only)
