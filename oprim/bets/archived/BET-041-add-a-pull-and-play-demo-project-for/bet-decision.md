# Decision: BET-041 Add a pull-and-play demo project for oprim principles
<!-- Naming tip: verb + object [for context] — e.g. "Improve bet naming for scannability" not "Naming" -->

## Status
- Decision: Build now
- Date: 2026-07-29
- Owner: Eshane Rawat
- Review date: 2026-08-15

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)
- [ ] 1-way door (hard to reverse — requires higher confidence before committing)

## Risk profile
- **Value risk**: Low — Directly requested by a real user as "the one thing missing" from the primer; strong signal of latent demand for a hands-on onboarding path.
- **Usability risk**: Medium — A guided tutorial command/skill reduces the chance of getting stuck, but the first version may not anticipate every point where users get confused.
- **Feasibility risk**: Low — Uses existing CLI/skill infrastructure (the workflow schema + template pattern already in place); no new tech required, just new content and a new skill/command.
- **Business viability risk**: Low — No revenue, legal, or ops exposure; the main ongoing cost is keeping the example and tutorial in sync with the evolving CLI, which is a maintenance consideration rather than a viability risk.

## Why now
- New users currently have to set up oprim from scratch on their own project before they can try any workflow — a ready-to-clone example removes that first hurdle and lets people evaluate the primer's principles in minutes.
- This bet exists specifically because a user said the one thing missing is the ability to pull the repo and play with the principles on a simple, ready-to-use example — directly responsive to real feedback.

## Alternatives considered
- Improve README/docs only — cheaper, but doesn't let people actually experiment hands-on with the workflows.
- Maintain a separate public example repo — rejected in favor of an in-repo `examples/` folder: less friction to discover and pull, avoids the overhead of keeping a second repo in sync with this one.

## Expected outcomes
- Time from clone to completing one guided workflow cycle (e.g. bet → spec → archive) using the in-repo example — baseline (unmeasured, likely 15–30 min setting up from an empty `oprim init`) → target under 5 minutes via `examples/` plus a guided tutorial command, measured over the next few onboarding sessions.

## Kill criteria / rollback trigger
- If, after ~1 month post-release, almost no one runs the tutorial command or engages with `examples/`, deprioritize further investment and fold learnings back into docs instead.

## Links
- PDRs: None
- OpenSpec change: N/A (native oprim spec)
- Spec (delta): oprim/bets/pending/BET-041-add-a-pull-and-play-demo-project-for/specs/demo-project/spec.md
