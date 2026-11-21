# Design: BET-079 cross-product portfolio view

## Context
Single-board `ovw` already renders deterministically (`commands/ovw.ts`). Board-vision rule: the board is the owner's opinion; the CLI renders it, agents never reinterpret it. This bet aggregates N boards via BET-076's resolver and BET-077's objectives.

## Decisions

### 1. Model first, renderers second
`lib/portfolio/view.ts`:
```ts
export interface PortfolioView {
  generatedAt: string;
  products: Array<{ name: string; owner?: string; squad?: string; stale: boolean; unreachable: boolean; now: BetRow[]; next: BetRow[]; load: { now: number; limit?: number } }>;
  dependencies: Array<{ from: string; fromLane: Lane; blocker: string; blockerState: string; problem: 'unresolved' | 'out-of-order' }>;
  coverage: { objectivesWithoutFlight: string[]; betsWithoutObjective: string[] };
  hygiene: { overdueReviews: Array<{ ref: string; date: string }>; missingCriteria: string[] };
}
export function buildPortfolioView(projectRoot: string, today: string): PortfolioView;
```
`today` is injected so tests are deterministic. Three renderers: terminal (`commands/ovw.ts` reuses `renderLane` style), JSON, markdown file.

### 2. Shared parsing
Extract `resolveBetDecisionPath`/`extractDoorType`/review-date parsing out of `commands/ovw.ts` into `lib/bet-meta.ts` so product and portfolio views share one parser (no behaviour change for `ovw`). `checkBetDefinitionOfDone`'s `isPromoted` is reused for missing criteria.

### 3. Terminal density
Default shows per product: header line with load, then Now and Next bets one line each; problem sections only when non-empty. Kill-criterion target: 5 products in ~60 lines.

### 4. Markdown file
`oprim/portfolio-view.md` mirrors `sequence-view.md` (generated, committed or not as the user likes). Lists in frontmatter keep Dataview queries trivial (`FROM "oprim" WHERE type = "portfolio-view"`). Under `oprim/` so a product can read the portfolio's latest snapshot via remote context — acceptable because it contains only references and IDs, not copied content.

### 5. WIP
`lib/portfolio/wip.ts` `checkPortfolioWip()`; reads each product's `wip_limits.now` from its own `sequence.yaml`, portfolio limit from `wip_limits.portfolio_now`.

## Alternatives considered
- Merge all boards into one virtual board and reuse `buildAdvisory` — rejected for v1: door-type advisories across teams are noisy; can be added later.

## Risks
- `--write` file includes bet titles from products — titles are short identifiers; flagged in case PDR-001's "never copy content" should be read strictly (then write IDs only).
