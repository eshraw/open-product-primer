# Design: BET-076 product registry and cross-product references

## Context
PDR-001: one linking mechanism (`remote_context`), reference never copy, qualified `<source>:<ID>` across workspaces, `BET-NNN` namespace kept. This is the initiative's 1-way door — the syntax ends up in other teams' repos.

## Decisions

### 1. Syntax: `<source>:<KIND>-<NNN>`
- Separator `:` — not valid in any current bet ID, YAML-safe unquoted in flow lists (`[checkout:BET-012]` parses as a string because there is no space after the colon).
- Qualifier = `remote_context.sources[].name` (already validated against the source's identity name by `withNameMismatch`).
- Kinds: `BET`, `PDR`, `OBJ`, `NOTE`. `OBJ` is reserved here so BET-077 does not change the grammar.
- Rejected: `@checkout/BET-012` (looks like an npm scope; `@` needs quoting in YAML), URLs (machine-specific).

### 2. Module: `lib/portfolio/refs.ts`
```ts
export type RefKind = 'BET' | 'PDR' | 'OBJ' | 'NOTE';
export interface ParsedRef { source: string | null; kind: RefKind; id: string; raw: string }
export function parseRef(raw: string): ParsedRef | null;
export interface RefResolution { ref: ParsedRef; status: 'found' | 'missing' | 'unknown-source' | 'unreachable'; state?: string; stale?: boolean; path?: string }
export class RefResolver { constructor(projectRoot: string); resolve(ref: ParsedRef): RefResolution }
export function collectRefs(projectRoot: string): Array<{ ref: ParsedRef; origin: string }>;
export function checkCrossProductRefs(projectRoot: string, checks: Check[]): void;
```
`RefResolver` memoises `resolveFull()` per source name → one clone/fetch per source per invocation (kill-criterion: performance). Despite the `portfolio/` directory, the resolver runs in product mode too — products cite portfolio PDRs.

### 3. Where references are collected from
- `sequence.yaml`: `blocked_by`, `unlocks`, `requires_pdrs` across all lanes.
- Bet `## Links` lines: `- PDRs:`, `- Objectives:`, `- Delegated to:`, `- Delegated from:`, `- Cross-product:` — comma-separated values parsed with `parseRef`; non-matching tokens ignored (keeps prose like "None" working).

### 4. Severity mapping
| Outcome | required |
|---|---|
| unknown qualifier | yes |
| reachable source, artifact missing | yes |
| unreachable, no cache | no (network is not the repo's fault) |
| unreachable, stale cache | pass, annotated `(stale)` |

### 5. `integrity.ts` change is minimal
`checkSequenceIntegrity` skips entries where `parseRef(x)?.source` is non-null. That is the only edit to existing product-mode logic; no existing workspace contains `:` references, so no existing output changes.

### 6. Product registry
`lib/portfolio/products.ts`: `readProducts(projectRoot)`, `checkProductRegistry(projectRoot, checks)` — only runs in portfolio mode. Status/owner/squad are metadata only; nothing resolves them.

### 7. Identity `mode`
`RemoteContextIdentity` gains optional `mode?: 'product' | 'portfolio'`; `readIdentity` passes it through; `oprim context init` writes it from `readWorkspaceMode()` (BET-075). `context list` prints a `portfolio` label.

## Alternatives considered
- Resolve via `assembleOprimWorkspaceContent` text — rejected: it concatenates everything; direct path lookups are cheaper and give a file path for hyperlinks.
- Separate resolution cache — rejected: `remote-context.ts` already throttles fetches; in-process memoisation is enough.

## Risks
- Identity-only clones are sparse (`.oprim-context` only), so resolution needs the full clone — first run on a cold cache is slow. Measure against the 10s kill criterion on a 5-product fixture.
- Users writing `checkout: BET-012` (with a space) get a YAML map, not a string — `checkSequenceIntegrity` should emit a targeted hint when an entry is a map.
