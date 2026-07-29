# oprim example: todo-app-demo

A pre-scaffolded `oprim/` workspace for a small mock product (a todo app), ready to explore with no setup. Nothing here is a simulation — every artifact is a real oprim artifact, and the guided tutorial drives the real `oprim-bet` / `oprim-spec` / `oprim-archive` skills against real files in this directory.

## What's here

- `oprim/decisions/` — two Product Decision Records (`PDR-001`, `PDR-002`) recording early product policy for the todo app
- `oprim/bets/archived/BET-001-.../` — a completed bet that shipped the core task loop (add / complete / delete), including its `bet-decision.md`, `design.md`, `tasks.md`, and spec delta
- `oprim/specs/task-management/spec.md` — current-truth spec for that shipped functionality, folded from `BET-001`
- `oprim/bets/pending/BET-002-.../` — a backlog bet not yet started (task lists / grouping)
- Agent-facing skills/commands already installed for every AI tool oprim supports — no `oprim init`/`oprim update` needed after cloning:
  - `.claude/` — Claude Code skills, commands, and hooks
  - `.cursor/` — Cursor skills and commands
  - `.poolside/` — Poolside skills
  - `AGENTS.md` — Codex and Poolside inline instructions
  - `GEMINI.md` — Gemini CLI inline instructions

## Try it

Open this directory in Claude Code, Cursor, or Poolside and run the **`oprim-tutorial`** skill. It walks you through adding a new feature — "add due dates to tasks" — through one full oprim cycle: create a bet, spec it, and archive it, narrated against the existing content above.

Codex and Gemini CLI users: `AGENTS.md`/`GEMINI.md` cover bet creation and archiving inline, but the guided tutorial and native spec-delta authoring (`oprim-spec`) are currently skill-only — follow the tutorial steps manually against `oprim-bet`'s and `oprim-archive`'s inline instructions, or switch to one of the three skill-based tools above for the full guided flow.

Prefer to explore manually first? Run `oprim doctor` from this directory to confirm the workspace is healthy, then look at `oprim/bets/archived/BET-001-.../` to see what a completed bet looks like end to end.
