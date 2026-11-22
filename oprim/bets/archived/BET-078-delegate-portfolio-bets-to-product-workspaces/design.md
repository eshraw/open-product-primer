# Design: BET-078 delegation with two-way links

## Context
PDR-001: the portfolio references, never copies; it writes into a product only with confirmation and never pushes; git products get a handoff file. The remote-context cache is `reset --hard` on fetch and therefore never a write target.

## Decisions

### 1. Workflow does the drafting, TypeScript guards the invariants
oprim is agent-native: `/oprim:delegate` is a workflow (`delegate.{schema.yaml,template.md}`, `modes: [portfolio]`, plus cursor/inline variants), not a CLI subcommand. Correctness is enforced after the fact by `lib/portfolio/delegation.ts`:
```ts
export function findDelegations(projectRoot: string): Array<{ portfolioBet: string; target: ParsedRef | { source: string; pendingHandoff: true } }>;
export function checkDelegationLinks(projectRoot: string, checks: Check[]): void;
```
The workflow resolves the product's real path by reading `remote_context.sources` itself — for git sources it must never use the cache path.

### 2. Link lines
- Portfolio bet `## Links`: `- Delegated to: checkout:BET-031` (one line per product; a portfolio bet may delegate to several products).
- Product bet `## Links`: `- Delegated from: acme-portfolio:BET-004`. The qualifier is the name the *product* registered the portfolio under, which may differ from the portfolio's own identity name — validate compares by resolving the qualifier to the portfolio's identity, not by string.
- `pending-handoff` is a reserved token in the ID position, accepted only on `Delegated to:` lines.

### 3. What the delegated bet contains
Title, Why now, Expected outcomes, Kill criteria and Objectives (qualified to the portfolio) are proposed from the portfolio bet; Owner/Review date/Risk profile are asked fresh because the product owns them. After creation the two bets evolve independently — there is no sync.

### 4. Handoff file
`outputs/handoffs/<product>-<BET-NNN>.md` with: a short note to the product owner, the complete bet-decision.md body, the YAML backlog entry, and the `/oprim:delegate … --link BET-MMM` command to run after applying it. Personal-side (`outputs/` is outside `oprim/`) so it is never exported via remote context.

## Alternatives considered
- `oprim delegate` CLI command writing files deterministically — rejected for now (agent-native convention); revisit if dogfooding shows ID-assignment mistakes.
- Patch/branch for git products — rejected in PDR-001.

## Risks
- Workflow-driven ID assignment in another repo can race with that team's own `oprim-bet`. Mitigation: re-scan immediately before writing and show the final path in the confirmation.
- Kill criterion check: a test fixture asserting the cache directory's mtime tree is unchanged after a git-product delegation run of the template's deterministic parts.
