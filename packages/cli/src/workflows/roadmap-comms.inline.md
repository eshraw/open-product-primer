### Roadmap comms (oprim-roadmap-comms)
Draft a now / next / exploring roadmap for one audience and period into `outputs/`. Portfolio mode only. Never send, post, publish or upload anything; cite every bet as `<source>:BET-NNN` (portfolio bets with this workspace's identity name); never re-order bets or invent dates; later/backlog bets are "exploring", not commitments.

1. Ask audience (exec / eng / sales / customers / other) and period (default: current quarter).
<!-- oprim:portfolio:start -->
1b. Before drafting, ask 2–3 questions about what this audience needs from the roadmap, and wait for the answers (skip if `rules.roadmap-comms.ask_first` is false).
<!-- oprim:portfolio:end -->
2. Read `oprim ovw --portfolio --json`, later/backlog lanes (products via `oprim context --source`), Active objectives and bet decisions; apply `rules.roadmap-comms` text.
3. Write `outputs/<last day of period>-roadmap-comms-<audience>.md`, starting with `> DRAFT — verify before sending.`; sections Why — objectives, Now, Next, Exploring, Dependencies and risks; tuned to the audience.
4. Report the path, cited refs, board oddities (suggest /oprim:prioritize) and TBDs.
