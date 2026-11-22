// BET-079 / PDR-001 — the cross-product portfolio view behind `oprim ovw --portfolio`.
//
// Board-vision rule: the board is each owner's opinion, rendered deterministically. This module
// only reads files (the portfolio's and each product's, via remote context) and builds a plain
// model; renderers live in commands/ovw.ts. Nothing is copied out of a product — the view holds
// references (IDs) plus titles as display labels.
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { readIdentity } from '../remote-context';
import { extractLinks, extractReviewDate } from '../bet-meta';
import { isPromoted } from '../validate-checks';
import { readProducts, type ProductStatus } from './products';
import { listObjectives, isInactiveObjectiveStatus } from './objectives';
import { parseRef, RefResolver, type ParsedRef } from './refs';
import { parseDelegatedTo, isPendingHandoff, extractDecision, type DelegationTarget } from './delegation';

export type Lane = 'now' | 'next' | 'later' | 'backlog';
const LANES: readonly Lane[] = ['now', 'next', 'later', 'backlog'];

export interface BetRow {
  id: string;
  title: string;
}

export interface WorkspaceBoard {
  name: string;
  kind: 'portfolio' | 'product';
  owner?: string;
  squad?: string;
  status?: ProductStatus;
  stale: boolean;
  unreachable: boolean;
  error?: string;
  now: BetRow[];
  next: BetRow[];
  load: { now: number; limit?: number };
}

export interface Dependency {
  from: string;
  fromLane: Lane;
  blocker: string;
  /** Lane name, `archived`, `not on board`, `missing`, `unreachable` or `unknown source`. */
  blockerState: string;
  problem: 'unresolved' | 'out-of-order';
}

/** BET-078 — a portfolio bet's delegated product bet, its status read live from the product. */
export interface DelegationRow {
  bet: string;
  /** `checkout:BET-031`, or just the product name while a handoff is pending. */
  target: string;
  /** Lane name, `archived`, `not on board`, `missing`, `unreachable`, `unknown source` or `pending handoff`. */
  state: string;
  /** The product bet's `Decision` (pending bets only). */
  decision?: string;
}

export interface PortfolioView {
  generatedAt: string;
  portfolio: WorkspaceBoard;
  products: WorkspaceBoard[];
  dependencies: Dependency[];
  delegations: DelegationRow[];
  coverage: { objectivesWithoutFlight: string[]; betsWithoutObjective: string[] };
  hygiene: { overdueReviews: Array<{ ref: string; date: string }>; missingCriteria: string[] };
}

// ─── Loading one workspace ──────────────────────────────────────────────────

interface SequenceEntry {
  id: string;
  title: string;
  blocked_by: unknown[];
}

interface PendingBet {
  objectives: ParsedRef[];
  delegatedTo: ParsedRef[];
  /** `delegatedTo` plus `<product>:pending-handoff` targets, in file order. */
  delegations: DelegationTarget[];
  delegatedFrom: ParsedRef[];
  reviewDate: string | null;
  decision?: string;
  promoted: boolean;
  hasCriteria: boolean;
}

export interface LoadedWorkspace {
  board: WorkspaceBoard;
  /** Filesystem root, or null when the product could not be resolved. */
  root: string | null;
  /** Empty for the portfolio (its IDs stay unqualified); the product's source name otherwise. */
  qualifier: string;
  lanes: Record<Lane, SequenceEntry[]>;
  laneOf: Map<string, Lane>;
  pending: Map<string, PendingBet>;
  archived: Set<string>;
  portfolioNowLimit?: number;
}

function emptyLanes(): Record<Lane, SequenceEntry[]> {
  return { now: [], next: [], later: [], backlog: [] };
}

function readSequence(root: string): { lanes: Record<Lane, SequenceEntry[]>; limit?: number; portfolioLimit?: number } {
  const lanes = emptyLanes();
  const p = path.join(root, 'oprim', 'sequence.yaml');
  if (!fs.existsSync(p)) return { lanes };
  let doc: Record<string, unknown>;
  try {
    doc = (yaml.load(fs.readFileSync(p, 'utf-8')) as Record<string, unknown>) ?? {};
  } catch {
    return { lanes }; // checkSequenceIntegrity reports the parse error
  }
  for (const lane of LANES) {
    const entries = doc[lane];
    if (!Array.isArray(entries)) continue;
    for (const e of entries as Array<Record<string, unknown>>) {
      if (!e || typeof e.id !== 'string') continue;
      lanes[lane].push({
        id: e.id,
        title: typeof e.title === 'string' ? e.title : '',
        blocked_by: Array.isArray(e.blocked_by) ? e.blocked_by : [],
      });
    }
  }
  const wip = (doc.wip_limits ?? {}) as Record<string, unknown>;
  return {
    lanes,
    limit: typeof wip.now === 'number' ? wip.now : undefined,
    portfolioLimit: typeof wip.portfolio_now === 'number' ? wip.portfolio_now : undefined,
  };
}

const betIdOf = (dirName: string): string | null => dirName.match(/^BET-\d+/)?.[0] ?? null;

function refsOf(tokens: string[] | undefined, kind: ParsedRef['kind']): ParsedRef[] {
  return (tokens ?? []).map((t) => parseRef(t)).filter((r): r is ParsedRef => r !== null && r.kind === kind);
}

function readPendingBets(root: string): Map<string, PendingBet> {
  const out = new Map<string, PendingBet>();
  const dir = path.join(root, 'oprim', 'bets', 'pending');
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const id = entry.isDirectory() ? betIdOf(entry.name) : null;
    if (!id) continue;
    const decision = path.join(dir, entry.name, 'bet-decision.md');
    const content = fs.existsSync(decision) ? fs.readFileSync(decision, 'utf-8') : '';
    const links = extractLinks(content);
    out.set(id, {
      objectives: refsOf(links.get('objectives'), 'OBJ'),
      delegatedTo: refsOf(links.get('delegated to'), 'BET'),
      delegations: parseDelegatedTo(links.get('delegated to')),
      delegatedFrom: refsOf(links.get('delegated from'), 'BET'),
      decision: extractDecision(content),
      reviewDate: extractReviewDate(content),
      promoted: content !== '' && isPromoted(content),
      hasCriteria: fs.existsSync(path.join(dir, entry.name, 'criteria.yaml')),
    });
  }
  return out;
}

function readArchived(root: string): Set<string> {
  const dir = path.join(root, 'oprim', 'bets', 'archived');
  if (!fs.existsSync(dir)) return new Set();
  return new Set(
    fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => betIdOf(e.name))
      .filter((id): id is string => id !== null)
  );
}

function loadWorkspace(
  root: string | null,
  board: Omit<WorkspaceBoard, 'now' | 'next' | 'load'>,
  qualifier: string
): LoadedWorkspace {
  const readable = root !== null && !board.unreachable;
  const seq = readable ? readSequence(root) : { lanes: emptyLanes() };
  const laneOf = new Map<string, Lane>();
  for (const lane of LANES) for (const e of seq.lanes[lane]) if (!laneOf.has(e.id)) laneOf.set(e.id, lane);
  const row = (e: SequenceEntry): BetRow => ({ id: e.id, title: e.title });
  return {
    root: readable ? root : null,
    board: {
      ...board,
      now: seq.lanes.now.map(row),
      next: seq.lanes.next.map(row),
      load: { now: seq.lanes.now.length, limit: 'limit' in seq ? seq.limit : undefined },
    },
    qualifier,
    lanes: seq.lanes,
    laneOf,
    pending: readable ? readPendingBets(root) : new Map(),
    archived: readable ? readArchived(root) : new Set(),
    portfolioNowLimit: 'portfolioLimit' in seq ? seq.portfolioLimit : undefined,
  };
}

export interface LoadedPortfolio {
  portfolio: LoadedWorkspace;
  products: LoadedWorkspace[];
  /** The portfolio's own identity name — how products qualify references to it. */
  portfolioName: string | null;
}

/** The portfolio board plus every non-sunset product's board, in `products:` order. */
export function loadPortfolio(projectRoot: string, resolver: RefResolver = new RefResolver(projectRoot)): LoadedPortfolio {
  const portfolio = loadWorkspace(projectRoot, { name: 'portfolio', kind: 'portfolio', stale: false, unreachable: false }, '');
  const products = readProducts(projectRoot)
    .filter((p) => p.status !== 'sunset')
    .map((p) => {
      const resolved = resolver.resolveWorkspace(p.source);
      const error = resolved === null ? `${p.source} is not a registered remote_context source` : resolved.error;
      return loadWorkspace(
        resolved && !resolved.error ? resolved.workspaceRoot : null,
        {
          name: p.source,
          kind: 'product',
          owner: p.owner,
          squad: p.squad,
          status: p.status,
          stale: resolved?.stale ?? false,
          unreachable: error !== undefined,
          ...(error !== undefined ? { error } : {}),
        },
        p.source
      );
    });
  return { portfolio, products, portfolioName: readIdentity(projectRoot)?.name ?? null };
}

// ─── Cross-workspace lookups ────────────────────────────────────────────────

class Lookup {
  private readonly byName = new Map<string, LoadedWorkspace>();

  constructor(private readonly loaded: LoadedPortfolio) {
    for (const p of loaded.products) this.byName.set(p.qualifier, p);
  }

  /** The workspace a reference written inside `from` points at, or null when the qualifier is unknown. */
  target(from: LoadedWorkspace, ref: ParsedRef): LoadedWorkspace | null {
    if (ref.source === null) return from;
    const product = this.byName.get(ref.source);
    if (product) return product;
    if (from.board.kind === 'product' && this.pointsAtPortfolio(ref.source)) return this.loaded.portfolio;
    return null;
  }

  /** A product's qualifier names the portfolio when it matches the portfolio's identity name (or, without one, any non-product name). */
  pointsAtPortfolio(source: string): boolean {
    if (this.byName.has(source)) return false;
    return this.loaded.portfolioName === null || this.loaded.portfolioName === source;
  }

  inFlight(ws: LoadedWorkspace, id: string): boolean {
    const lane = ws.laneOf.get(id);
    return lane === 'now' || lane === 'next';
  }

  /** Portfolio-perspective objective IDs a pending bet links to (qualified to the portfolio, or local in the portfolio). */
  portfolioObjectives(ws: LoadedWorkspace, bet: PendingBet | undefined): string[] {
    if (!bet) return [];
    return bet.objectives
      .filter((r) => (ws.board.kind === 'portfolio' ? r.source === null : r.source !== null && this.pointsAtPortfolio(r.source)))
      .map((r) => r.id);
  }
}

const qualify = (ws: LoadedWorkspace, id: string): string => (ws.qualifier ? `${ws.qualifier}:${id}` : id);

// ─── Sections ───────────────────────────────────────────────────────────────

function blockerState(target: LoadedWorkspace | null, id: string): string {
  if (target === null) return 'unknown source';
  if (target.board.unreachable) return 'unreachable';
  const lane = target.laneOf.get(id);
  if (lane) return lane;
  if (target.archived.has(id)) return 'archived';
  if (target.pending.has(id)) return 'not on board';
  return 'missing';
}

function buildDependencies(all: LoadedWorkspace[], lookup: Lookup): Dependency[] {
  const out: Dependency[] = [];
  for (const ws of all) {
    for (const lane of LANES) {
      for (const entry of ws.lanes[lane]) {
        for (const raw of entry.blocked_by) {
          const ref = typeof raw === 'string' ? parseRef(raw) : null;
          // Unqualified blockers are local and covered by checkSequenceIntegrity.
          if (!ref || ref.source === null || ref.kind !== 'BET') continue;
          const target = lookup.target(ws, ref);
          const state = blockerState(target, ref.id);
          const blocker = target ? qualify(target, ref.id) : ref.raw;
          let problem: Dependency['problem'] | null = null;
          if (['unknown source', 'unreachable', 'missing'].includes(state)) problem = 'unresolved';
          else if (lane === 'now' && ['later', 'backlog', 'not on board'].includes(state)) problem = 'out-of-order';
          if (problem) out.push({ from: qualify(ws, entry.id), fromLane: lane, blocker, blockerState: state, problem });
        }
      }
    }
  }
  return out;
}

function buildDelegations(loaded: LoadedPortfolio, lookup: Lookup): DelegationRow[] {
  const out: DelegationRow[] = [];
  for (const [id, bet] of loaded.portfolio.pending) {
    for (const t of bet.delegations) {
      if (isPendingHandoff(t)) {
        out.push({ bet: id, target: t.source, state: 'pending handoff' });
        continue;
      }
      const target = lookup.target(loaded.portfolio, t);
      const state = blockerState(target, t.id);
      const decision = target && !target.board.unreachable ? target.pending.get(t.id)?.decision : undefined;
      out.push({ bet: id, target: t.raw, state, ...(decision ? { decision } : {}) });
    }
  }
  return out;
}

function buildCoverage(loaded: LoadedPortfolio, all: LoadedWorkspace[], lookup: Lookup): PortfolioView['coverage'] {
  const covered = new Set<string>();
  const betsWithoutObjective: string[] = [];

  // Objectives a pending bet serves through a "Delegated from" portfolio bet.
  const viaDelegatedFrom = (ws: LoadedWorkspace, bet: PendingBet | undefined): string[] => {
    const out: string[] = [];
    for (const ref of bet?.delegatedFrom ?? []) {
      const target = lookup.target(ws, ref);
      if (target === loaded.portfolio) out.push(...lookup.portfolioObjectives(target, target.pending.get(ref.id)));
    }
    return out;
  };

  for (const ws of all) {
    for (const lane of ['now', 'next'] as const) {
      for (const entry of ws.lanes[lane]) {
        const bet = ws.pending.get(entry.id);
        const objectives = [...lookup.portfolioObjectives(ws, bet), ...viaDelegatedFrom(ws, bet)];
        objectives.forEach((id) => covered.add(id));
        if ((bet?.objectives.length ?? 0) === 0 && objectives.length === 0) betsWithoutObjective.push(qualify(ws, entry.id));
      }
    }
  }

  // A portfolio bet (in any lane) covers its objectives while a bet it delegated to is in flight.
  for (const bet of loaded.portfolio.pending.values()) {
    const delegateInFlight = bet.delegatedTo.some((ref) => {
      const target = lookup.target(loaded.portfolio, ref);
      return target !== null && lookup.inFlight(target, ref.id);
    });
    if (delegateInFlight) lookup.portfolioObjectives(loaded.portfolio, bet).forEach((o) => covered.add(o));
  }

  const objectivesWithoutFlight = listObjectives(loaded.portfolio.root as string)
    .filter((o) => !isInactiveObjectiveStatus(o.status) && !covered.has(o.id))
    .map((o) => o.id);

  return { objectivesWithoutFlight, betsWithoutObjective };
}

function buildHygiene(all: LoadedWorkspace[], today: string): PortfolioView['hygiene'] {
  const overdueReviews: Array<{ ref: string; date: string }> = [];
  const missingCriteria: string[] = [];
  for (const ws of all) {
    for (const [id, bet] of ws.pending) {
      if (bet.reviewDate && bet.reviewDate < today) overdueReviews.push({ ref: qualify(ws, id), date: bet.reviewDate });
      if (bet.promoted && !bet.hasCriteria) missingCriteria.push(qualify(ws, id));
    }
  }
  return { overdueReviews, missingCriteria };
}

/**
 * The whole view. `today` (YYYY-MM-DD) is injected so output is identical across runs for
 * identical inputs; nothing else in the model depends on the clock.
 */
export function buildPortfolioView(
  projectRoot: string,
  today: string,
  resolver: RefResolver = new RefResolver(projectRoot)
): PortfolioView {
  const loaded = loadPortfolio(projectRoot, resolver);
  const lookup = new Lookup(loaded);
  const all = [loaded.portfolio, ...loaded.products];
  return {
    generatedAt: today,
    portfolio: loaded.portfolio.board,
    products: loaded.products.map((p) => p.board),
    dependencies: buildDependencies(all, lookup),
    delegations: buildDelegations(loaded, lookup),
    coverage: buildCoverage(loaded, all, lookup),
    hygiene: buildHygiene(all, today),
  };
}
