## Context

oprim onboards new users through two touch points before they get value: the README (pre-install) and `oprim init` (post-install). Both currently introduce oprim's structure before they earn the user's understanding.

**Current state:**
- README leads with what oprim *is* (a workspace, a tool for structured decisions) rather than what it *does for you* — developers without Shape Up / product methodology background disengage before installing
- `oprim init` exits with "Run oprim doctor" — no mention of what to do next, no definition of a bet, no invitation to act
- The `oprim-bet` skill jumps straight to naming convention and title prompt — assumes the user knows what they're creating

**Constraint:** oprim is deliberately lightweight. No onboarding wizard, no multi-step setup flow, no interactive tutorial.

## Goals / Non-Goals

**Goals:**
- README communicates oprim's value to a methodology-naive developer in the first paragraph
- `oprim init` exit tells users exactly what to do next and defines "bet" in one sentence
- `oprim-bet` skill briefly contextualises what a bet is before asking for a title — the methodology earns itself through the act of creating

**Non-Goals:**
- Full onboarding wizard or interactive tutorial
- In-agent walkthrough beyond the skill's existing prompting
- Telemetry or instrumentation (out of scope for this bet)
- Changing what `oprim doctor` outputs

## Decisions

### 1. README: Rewrite the opening, preserve the rest

**Decision:** Rewrite only the first section of the README (value framing) to lead with a concrete story — "you have a product decision to make; here's how oprim captures it" — before introducing workspace structure and terminology.

**Why:** The README is a conversion artifact. Users scan the first 3–5 sentences to decide whether to install. Everything after that is reference. Rewriting only the opening minimises diff noise and avoids disrupting existing structure.

**Alternative considered:** Add a "Quick Start" section above existing content. Rejected — this layers new content onto a broken foundation rather than fixing the foundation.

### 2. `oprim init` exit: single next-step line defining "bet"

**Decision:** After init completes, output one line that names the next action and defines "bet" inline:

> `Next: create your first bet — a product decision you're committing to explore. Run \`oprim bet\` to start.`

**Why:** The definition must appear at the moment of highest intent (right after setup), not in docs the user won't read. One line respects the tool's lightweight ethos. Putting the definition inline means the user doesn't need to look anything up.

**Alternative considered:** Link to README for definition. Rejected — the README was the drop-off point; sending users back there isn't a fix.

### 3. `oprim-bet` skill: one-sentence context before title prompt

**Decision:** Add a brief context block at the start of the `oprim-bet` skill — before the naming convention tip — that defines what a bet is in one sentence and frames the question the user is about to answer.

> `A bet is a product decision you're committing to explore: a problem worth solving, a hypothesis worth testing, or a direction worth taking. You'll name it, explain why now, and set a kill criterion.`

**Why:** Users who arrive at `oprim-bet` via the init exit guidance may still be uncertain. The context block removes the last ambiguity before they commit to a title. It mirrors how good forms work — tell people what they're filling in before asking.

**Why not in the skill's existing naming tip:** The naming tip is about *how to write* a title. Context about *what a bet is* comes first — these are different concerns and should be separated.

## Risks / Trade-offs

- **README changes are hard to measure** → Mitigation: treat the rewrite as a content hypothesis; revisit at the BET-018 review date (2026-07-27) with qualitative signal from new user conversations
- **"Bet" terminology may still feel off to some users regardless of context** → Mitigation: the context block normalises it by framing it functionally ("a decision you're committing to explore") rather than relying on prior familiarity with Shape Up
- **One-line init exit may be missed by users who scroll past output** → Mitigation: acceptable; the line is there for users who read output; those who don't were unlikely to be converted by any footer
