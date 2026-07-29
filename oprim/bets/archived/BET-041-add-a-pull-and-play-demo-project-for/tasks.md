# Tasks: demo-project

## 1. Mock product content
- [x] 1.1 Define the mock todo-app product surface (add/complete/delete tasks, lists, due dates) at a scope small enough to keep the example maintainable
- [x] 1.2 Draft 1-2 illustrative PDRs and a small backlog of bets for the todo app, including at least one archived bet with a folded spec so `oprim/specs/` isn't empty
- [x] 1.3 Write one current-truth capability spec under the example's `oprim/specs/` reflecting the todo app's already-built functionality

## 2. Example workspace scaffold
- [x] 2.1 Create `examples/` directory at repo root with a pre-initialized `oprim/` workspace (`config.yaml`, `sequence.yaml`, the todo-app PDRs/bets/specs from Section 1)
- [x] 2.2 Install agent-facing skills/commands into the example directory (e.g. `.claude/`) so no `oprim init` is needed after cloning
- [x] 2.3 Verify `oprim doctor` passes cleanly against the example workspace out of the box

## 3. Guided tutorial command
- [x] 3.1 Author the tutorial workflow schema + template pair under `workflows/` (or reuse an existing pattern) that walks through bet → spec → archive using a new todo-app feature (e.g. "add due dates to tasks") as the running example
- [x] 3.2 Wire the tutorial command into the example workspace's installed agent directory
- [x] 3.3 Verify running the tutorial end-to-end completes one full bet → spec → archive cycle without manual setup steps

## 4. Verification
- [x] 4.1 Dry-ran the full bet → spec → archive cycle mechanically (bet creation, spec-delta fold via `foldDelta`, archive move, sequence.yaml removal) and confirmed `oprim doctor` stays clean throughout, then reverted the dry-run artifacts so the example ships fresh; a real-user timed session against the 5-minute target is still open — note in Links/kill-criteria review
- [x] 4.2 Add a short pointer to `examples/` in the repo README
