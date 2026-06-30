## Context

`oprim doctor` (`packages/cli/src/commands/doctor.ts`) runs a series of existence checks and reports pass/fail. Today it only checks whether files and directories exist — it never parses `sequence.yaml` to validate its semantic state, and never compares installed skill files against the current CLI's bundled content. Both gaps allow invalid state to accumulate silently.

Constraints:
- `js-yaml` is already a dependency (used in `detect.ts`, `measure.ts`, `ovw.ts`)
- Skill content lives as string constants exported from `install-agent.ts` (`CLAUDE_SKILLS`)
- The check framework is additive: new `Check` entries pushed to the same array

## Goals / Non-Goals

**Goals:**
- Detect when `now:` entries in `sequence.yaml` exceed `wip_limits.now`
- Detect `blocked_by` / `unlocks` references that point to a bet ID not found anywhere in the sequence
- Detect when installed `.claude/skills/<name>/SKILL.md` files differ from what the current CLI would write

**Non-Goals:**
- Auto-correcting `sequence.yaml`
- Checking skill drift for Cursor, Codex, or Gemini agents (Claude-only for now)
- Reporting line-by-line diffs of drifted skill content
- Validating YAML structure/schema beyond the fields needed for the checks

## Decisions

### 1. New helper module: `lib/integrity.ts`
Extract sequence and skill check logic into `lib/integrity.ts` rather than inlining everything in `doctor.ts`. Rationale: keeps doctor.ts at its current length; integrity helpers are independently testable.

### 2. Parse sequence.yaml with js-yaml
Use the existing `js-yaml` import pattern from `detect.ts`. Parse once, pass the result to each check function. If the file is missing or malformed, push a single `warn: skipped` check and return early — no crash.

### 3. Skill drift: exact string comparison against CLAUDE_SKILLS
Import `CLAUDE_SKILLS` from `install-agent.ts` and compare installed file content against `CLAUDE_SKILLS[name]` (without the PDR-surfacing Step 0 prefix, which is an opt-in augmentation). This avoids hashing and keeps the comparison readable. The check only runs if `.claude/skills/` exists.

Tradeoff: PDR-surfacing users will see a false-positive drift warning if the installed skill has Step 0 and the comparison target does not. Mitigated by stripping the Step 0 block before comparison (reuse the existing `removeContextStep` helper).

### 4. Checks are non-required (yellow `○`)
Sequence integrity warnings and skill drift are advisory — they don't block `oprim doctor` from reporting "Core setup is healthy." Required failures are reserved for missing scaffold files.

## Risks / Trade-offs

- `sequence.yaml` malformed YAML → Mitigated by try/catch; push a warning check and skip deeper validation
- `CLAUDE_SKILLS` import from `install-agent.ts` creates a dependency between doctor and the full skill content module → Acceptable; the module is already compiled into the same binary
- Skill drift false-positives on PDR-surfacing installs → Mitigated by stripping Step 0 before comparison

## Open Questions

- Should skill drift also check Poolside (`.poolside/skills/`)? Out of scope for now; can be a follow-up.
- Should sequence integrity check the `later:` and `backlog:` WIP limits if/when those are added? Leave extensible but don't implement.
