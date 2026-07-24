## Context

Originating bet: `BET-024` (`oprim/bets/BET-024-adopt-change-and-current-spec-dir/bet-decision.md`)
Blocked by: `BET-023` (`bet-023-native-spec-authoring`) — this change assumes native spec authoring writes RFC 2119 + Gherkin capability specs, and layers a change/current lifecycle on top of that output.

## Why

BET-023 gives oprim a native spec syntax but writes every generated spec straight into `oprim/specs/<capability>/spec.md` as if it were already current truth — there is no notion of "how did our product truth change" and no way for multiple in-flight bets to touch the same capability spec without colliding on the same file. OpenSpec's proven change/current model (current specs flat under `specs/`, per-change deltas that merge on archive) solves exactly this, and maps directly onto oprim's existing bet → archive flow.

## What Changes

- Introduce a per-bet delta spec location: `oprim/bets/BET-NNN-<slug>/specs/<capability>/spec.md`, written using the same ADDED/MODIFIED/REMOVED delta headers OpenSpec uses, populated via the native spec-authoring skill (BET-023) while a bet is in flight
- `oprim/specs/<capability>/spec.md` (flat, no `current/` nesting) becomes the current-truth set — the merge target, not a write target during an active bet
- Extend `oprim:archive` (currently: move bet dir, remove sequence.yaml entry, no knowledge of specs) with merge-on-archive logic: when archiving a bet that has an `oprim/bets/BET-NNN.../specs/` directory, fold its ADDED/MODIFIED/REMOVED deltas into the matching `oprim/specs/<capability>/spec.md` requirement (matched by header) before completing the archive
- Multiple bets may carry delta specs against the same capability concurrently; each bet's deltas apply independently to current truth at its own archive time (last-archived wins on any overlapping requirement, same as OpenSpec's model)
- Delta-merge applies to the spec layer only — PDRs continue to evolve by supersession (`Superseded by PDR-YYY`) and are untouched by this change, per the bet's explicit design constraint

## Capabilities

### New Capabilities
- `spec-dir-lifecycle`: the oprim-native change/current spec directory model — per-bet delta specs under `oprim/bets/BET-NNN.../specs/`, ADDED/MODIFIED/REMOVED delta syntax, and `oprim/specs/` as the flat current-truth set

### Modified Capabilities
- `bet-archiving`: `oprim:archive` gains merge-on-archive logic that folds a bet's spec deltas into current truth as part of the existing archive step, instead of having "no knowledge of specs"

## Impact

- oprim's archive skill/hook content (wherever `oprim:archive`'s behavior is authored — mirrors `install-agent.ts`'s pattern for other skills) gains a merge step
- Native spec-authoring skill (BET-023) needs to know whether a bet is active (write delta to bet dir) vs. archiving (nothing to do — archive handles the merge itself), so its output-location logic gains a bet-context check
- No change to the `openspec` delegation path or to PDR supersession behavior
