### Stakeholder update (oprim-stakeholder-update)
Draft an update for one audience and period into `outputs/`. Portfolio mode only. Never send, post, publish or upload anything; cite every bet as `<source>:BET-NNN` (portfolio bets with this workspace's identity name); never invent commitments — write `[TBD — confirm with <owner>]`.

1. Ask audience (exec / eng / sales / customers / other) and period (default: current month).
<!-- oprim:portfolio:start -->
1b. Before drafting, ask 2–3 questions about what this audience believes and needs, and wait for the answers (skip if `rules.stakeholder-update.ask_first` is false).
<!-- oprim:portfolio:end -->
2. Read `oprim ovw --portfolio --json`, Active objectives, KPI reviews in each workspace's `oprim/reviews/` within the period (products via `oprim context --source`), bet decisions and bets archived in the period; apply `rules.stakeholder-update` text.
3. Write `outputs/<last day of period>-stakeholder-update-<audience>.md`, starting with `> DRAFT — verify before sending.`; sections TL;DR, Outcomes vs objectives, Shipped and learned, Now and next, Risks and asks; depth tuned to the audience.
4. Report the path, cited refs and TBDs.
