---
name: oprim-plan-week
description: Plan the week from STATE.md, the inbox and the boards, and update STATE.md
---

Produce a plan for the coming week from `STATE.md`, the inbox and the boards, then update `STATE.md`. Calendar and chat tools are optional: when none are available this workflow completes normally and says nothing about missing integrations.

**Interactive prompts:** Use the **AskUserQuestion tool** for every question in this skill — do not write questions as plain text.

## Steps

### 1. Gather inputs — all optional except STATE.md
- Read `STATE.md` at the project root: `## Focus`, `## In progress`, `## Blockers`, `## Last commands`. If it is missing, start from an empty one with those four headings.
- Read the open items (`- [ ]` lines) in `inbox.md`. Do not triage them here; only count them and note anything urgent.
- Read the boards: run `oprim ovw --portfolio --json` from the project root. If that command or flag is not available, or it fails, read this workspace's own `oprim/sequence.yaml` (`now` / `next` lanes and their `blocked_by`) instead. Do not report the fallback as an error.
- Read the `## Last commands` dates to see which days this week `/oprim:start-day` ran.

### 2. Calendar and chat — only if such tools are available
If calendar or chat (e.g. Slack) tools are available in this session, use them to read this week's meetings (Monday–Friday) and threads waiting on the user. If no such tools are available, skip this step silently.

### 3. Ask for the week's outcome
Ask one question: "What has to be true by Friday?" Offer 2–3 candidate outcomes drawn from the `now` lane and `## Focus`, recommended one first.

### 4. Write the week plan
Reply with:
- **Outcome** — the answer from step 3
- **By day** — Monday–Friday, 1–2 focus items each; when a calendar tool was available, place them around that day's meetings and list the meetings that need preparation
- **Board moves** — `now`/`next` items to start, finish or unblock this week (suggestions only; change `oprim/sequence.yaml` only via `/oprim:sequence`)
- **Inbox** — "<N> open items"; suggest a `/oprim:triage` slot if N > 0

### 5. Update STATE.md
Rewrite only the content under the four sections, keeping the headings and any other sections untouched:
- `## Focus` — the week's outcome and its focus items
- `## In progress` — keep existing items; add the week's commitments
- `## Blockers` — current blockers with who or what they wait on
- `## Last commands` — append `- <YYYY-MM-DD> /oprim:plan-week` (append-only)
