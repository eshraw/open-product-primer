## Context

The CLI has five commands (`init`, `update`, `doctor`, `migrate`, `measure`). None surface the current state of the work board or guide PM sequencing decisions. `oprim ovw` fills both gaps: it reads `sequence.yaml` for board shape and individual `bet-decision.md` files for door type and risk profile, then renders a terminal view with inline metadata and rule-based advisory nudges.

The key constraint: board state and all advisory output must be **the product owner's opinion**, deterministic and rule-encoded. No LLM involvement.

## Goals / Non-Goals

**Goals:**
- Print board state grouped by lane in under 1 second
- Show door type (2-way / 1-way) and risk profile (value / usability / feasibility / viability) inline per bet for bets in `now` and `next`
- Surface advisory nudges about door-type sequencing order, unaddressed risks, and board shape

**Non-Goals:**
- No LLM call or agent involvement of any kind
- Not a replacement for `oprim doctor` (health checks remain separate)
- Not a write operation — `oprim ovw` never modifies any file
- `later` and `backlog` bets show title only (no risk profile — too early to be actionable)

## Decisions

### Read bet-decision.md files with regex extraction, not a full markdown parser
`oprim ovw` needs two fields from each bet-decision.md: door type (2-way / 1-way) and risk ratings (Low / Medium / High per dimension). These are predictably structured sections — a targeted regex scan is sufficient. Adding a full markdown parser is unnecessary complexity.

Extraction approach:
- Door type: scan for `[x] 2-way door` or `[x] 1-way door` checkbox
- Risk ratings: scan for `**Value risk**: Low/Medium/High`, `**Usability risk**: ...`, etc.
- If a bet-decision.md is absent or fields are missing, display `[risk: unknown]` and omit that bet from risk-based advisory rules

### Bet-decision.md location convention
Bet directories follow the pattern `oprim/bets/BET-NNN-*/bet-decision.md`. `oprim ovw` resolves the directory by scanning `oprim/bets/` for a directory whose name starts with the bet ID (e.g. `BET-015`). This is resilient to slug changes.

### Board output: lane headers + per-bet rows with inline metadata
- `now` and `next` bets: `BET-NNN  Title  [2-way | value:L usability:L feasibility:L viability:L]`
- `later` and `backlog` bets: `BET-NNN  Title` only (metadata omitted — too early to act on)
- Blocked-by annotation appended after risk metadata: `[blocked by: BET-XXX]`
- Chalk used for lane headers and the Advisory section header only; bet rows remain plain text

### Advisory rule engine: hardcoded in `ovw.ts`, evaluated after board render
Rules operate on the parsed board + extracted risk profiles. Evaluated in order; all triggered rules are shown.

**Board-shape rules (sequence.yaml only):**
1. `now` lane is empty → "Now lane is empty — consider promoting from next"
2. Bet in `now` blocked by a bet not in `now` or `next` → "BET-NNN may be stuck — its blocker is not in a flight lane"
3. `now` lane has more than 3 bets → "Focus risk: now lane has N active bets — consider narrowing"

**Door-type sequencing rules (requires bet-decision.md read):**
4. 1-way door bet in `now` with no 2-way door predecessor in `now` or `next` that has it in `unlocks` → "BET-NNN is a 1-way door with no 2-way door unrisker in flight — consider sequencing a reversible spike first"
5. All bets in `now` are 1-way doors → "Your now lane has no 2-way door bets — you are in full-commitment mode with no reversible fallback"
6. A 2-way door bet is sequenced (via `blocked_by`) *after* a 1-way door bet it was intended to unrisk → "BET-NNN (2-way) is blocked by BET-MMM (1-way) — order may be inverted; 2-way doors should precede 1-way doors"

**Risk advisory rules (requires bet-decision.md read):**
7. Bet in `now` has Medium or High value risk and is a 1-way door → "BET-NNN: high commitment with unvalidated value — consider a 2-way door discovery bet first"
8. Bet in `now` has Medium or High feasibility risk → "BET-NNN: feasibility risk is elevated — ensure a spike or prototype is in plan before full build"
9. Bet in `now` has Medium or High usability risk → "BET-NNN: usability risk is elevated — plan for user testing before shipping"
10. Bet in `now` has Medium or High business viability risk → "BET-NNN: business viability risk is elevated — align with stakeholders before committing"

New rules are added by editing `ovw.ts` directly; no plugin or config system.

### bet-decision.md template update in `betSkill()` content
The `betSkill()` function in `install-agent.ts` contains the template text that the `/oprim:bet` skill uses when authoring a new bet. Add two new sections after `## Alternatives considered`:

```markdown
## Door type
- [ ] 2-way door (reversible — safe to try, easy to undo)
- [ ] 1-way door (hard to reverse — requires higher confidence before committing)

## Risk profile
- **Value risk**: [Low / Medium / High] — will users/customers actually use this?
- **Usability risk**: [Low / Medium / High] — can users figure out how to use it?
- **Feasibility risk**: [Low / Medium / High] — can we build it with current skills, time, and tech?
- **Business viability risk**: [Low / Medium / High] — does this solution work for the business?
```

### File location: `packages/cli/src/commands/ovw.ts`
Follows the one-file-per-subcommand convention.

## Risks / Trade-offs

- **bet-decision.md missing or malformed** → fields show as `unknown`; advisory rules that require risk data are skipped for that bet. Graceful degradation, no crash.
- **YAML schema drift in sequence.yaml** → low risk; schema is stable and owned by this codebase. `ovw.ts` is the only consumer.
- **Advisory rules becoming stale** → rules require a CLI release to update. Acceptable: they reflect a stable PM philosophy, not dynamic business logic.
- **Color in CI/non-TTY** → chalk auto-detects; no action needed.

## Open Questions

- Should `oprim ovw` support a `--json` flag for machine-readable output? Deferred — not needed for the initial bet.
- Should risk ratings be freeform text or constrained to Low / Medium / High in the template? Decision: constrained — enables reliable regex extraction and consistent advisory rules.
