// BET-078 / PDR-001 — two-way delegation links between a portfolio bet and the product bets it
// was delegated to.
//
// The `/oprim:delegate` workflow does the drafting and writing; this module only *reads* both sides
// and checks the invariants afterwards. A portfolio bet stores the qualified reference
// (`- Delegated to: checkout:BET-031`, or `checkout:pending-handoff` while a git product's handoff
// file has not been applied); the product bet stores `- Delegated from: <portfolio>:BET-004`. The
// delegated bet's status is never copied into the portfolio — callers read it at resolution time.
import * as fs from 'fs';
import * as path from 'path';
import type { Check } from '../integrity';
import { extractLinks } from '../bet-meta';
import {
  readIdentity,
  readRemoteContextConfig,
  findSourceByName,
  isPathSource,
  resolveIdentityOnly,
} from '../remote-context';
import { readProducts } from './products';
import { parseRef, lookupArtifact, RefResolver, type ParsedRef } from './refs';

export const PENDING_HANDOFF = 'pending-handoff';

const PENDING_HANDOFF_TOKEN = /^([a-z0-9][a-z0-9-]*):pending-handoff$/;

export type DelegationTarget = ParsedRef | { source: string; pendingHandoff: true };

export interface Delegation {
  /** The portfolio bet's ID (unqualified — it lives in this workspace). */
  portfolioBet: string;
  target: DelegationTarget;
}

export function isPendingHandoff(t: DelegationTarget): t is { source: string; pendingHandoff: true } {
  return 'pendingHandoff' in t;
}

/** Display form of a target: `checkout:BET-031` or `search:pending-handoff`. */
export function targetLabel(t: DelegationTarget): string {
  return isPendingHandoff(t) ? `${t.source}:${PENDING_HANDOFF}` : t.raw;
}

/**
 * Parse `Delegated to:` tokens. Only qualified BET refs and `<product>:pending-handoff` count — an
 * unqualified ID or prose ("None") is not a delegation.
 */
export function parseDelegatedTo(tokens: string[] | undefined): DelegationTarget[] {
  const out: DelegationTarget[] = [];
  for (const token of tokens ?? []) {
    const handoff = token.match(PENDING_HANDOFF_TOKEN);
    if (handoff) {
      out.push({ source: handoff[1], pendingHandoff: true });
      continue;
    }
    const ref = parseRef(token);
    if (ref && ref.source !== null && ref.kind === 'BET') out.push(ref);
  }
  return out;
}

/** `- Delegated from:` refs in a bet-decision.md (qualified BET refs only). */
export function parseDelegatedFrom(content: string): ParsedRef[] {
  return (extractLinks(content).get('delegated from') ?? [])
    .map((t) => parseRef(t))
    .filter((r): r is ParsedRef => r !== null && r.source !== null && r.kind === 'BET');
}

function pendingDecisions(projectRoot: string): Array<{ id: string; content: string }> {
  const dir = path.join(projectRoot, 'oprim', 'bets', 'pending');
  if (!fs.existsSync(dir)) return [];
  const out: Array<{ id: string; content: string }> = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const id = entry.isDirectory() ? entry.name.match(/^BET-\d+/)?.[0] : undefined;
    const file = id ? path.join(dir, entry.name, 'bet-decision.md') : '';
    if (id && fs.existsSync(file)) out.push({ id, content: fs.readFileSync(file, 'utf-8') });
  }
  return out;
}

/** Every `Delegated to:` target on the portfolio's pending bets, in bet order. */
export function findDelegations(projectRoot: string): Delegation[] {
  const out: Delegation[] = [];
  for (const { id, content } of pendingDecisions(projectRoot)) {
    for (const target of parseDelegatedTo(extractLinks(content).get('delegated to'))) {
      out.push({ portfolioBet: id, target });
    }
  }
  return out;
}

/** `- Decision: <value>` from a bet-decision.md, or undefined. */
export function extractDecision(content: string): string | undefined {
  return content.match(/^\s*[-*]\s*Decision:\s*(.+?)\s*$/im)?.[1];
}

function readDecisionFile(betPath: string): string | null {
  const file = path.join(betPath, 'bet-decision.md');
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf-8') : null;
}

// ─── Does a product's qualifier name this portfolio? ────────────────────────

/**
 * A product writes `Delegated from: <qualifier>:BET-NNN`, where `<qualifier>` is the name *it*
 * registered the portfolio under — which may differ from the portfolio's identity name. Compare by
 * resolving the qualifier through the product's own `remote_context.sources` to an identity (or,
 * for a path source, to the portfolio directory), never by string alone.
 */
export function qualifierNamesPortfolio(productRoot: string, qualifier: string, portfolioRoot: string): boolean {
  const portfolioName = readIdentity(portfolioRoot)?.name ?? null;
  if (portfolioName !== null && qualifier === portfolioName) return true;

  let source;
  try {
    source = findSourceByName(readRemoteContextConfig(productRoot), qualifier);
  } catch {
    return false;
  }
  if (!source) return false;

  if (isPathSource(source)) {
    const dir = path.resolve(productRoot, source.path);
    if (fs.existsSync(dir) && fs.realpathSync(dir) === fs.realpathSync(portfolioRoot)) return true;
    return portfolioName !== null && readIdentity(dir)?.name === portfolioName;
  }
  if (portfolioName === null) return false;
  const resolved = resolveIdentityOnly(source);
  return resolved.identity?.name === portfolioName;
}

// ─── doctor / validate check ────────────────────────────────────────────────

/**
 * Portfolio mode only. For every `Delegated to:` line:
 *  - `<product>:pending-handoff` → pass, annotated `pending handoff`;
 *  - unknown product source / product bet missing / back-link missing or pointing elsewhere → required failure;
 *  - product unreachable → non-required (as for any cross-product ref).
 * Then the reverse direction: a product bet saying `Delegated from: <portfolio>:BET-NNN` whose
 * portfolio bet does not list it back is a required failure (a pair present on only one side).
 */
export function checkDelegationLinks(
  projectRoot: string,
  checks: Check[],
  resolver: RefResolver = new RefResolver(projectRoot)
): void {
  const delegations = findDelegations(projectRoot);
  const forward = new Set<string>(); // `<product>:BET-MMM|BET-NNN` pairs the portfolio declares
  const handoffs = new Set<string>(); // `<product>|BET-NNN` pairs still pending a handoff

  for (const { portfolioBet, target } of delegations) {
    const product = target.source as string;
    const workspace = resolver.resolveWorkspace(product);
    if (workspace === null) {
      checks.push({
        name: `delegation: ${portfolioBet} delegated to unknown source "${product}"`,
        pass: false,
        note: "Register the product with 'oprim context register' and list it under products:",
        required: true,
      });
      continue;
    }

    if (isPendingHandoff(target)) {
      handoffs.add(`${product}|${portfolioBet}`);
      checks.push({
        name: `delegation: ${portfolioBet} → ${product} (pending handoff)`,
        pass: true,
        note: `once the product applies outputs/handoffs/${product}-${portfolioBet}.md, run /oprim:delegate ${portfolioBet} --to ${product} --link BET-MMM`,
        required: true,
      });
      continue;
    }

    forward.add(`${target.raw}|${portfolioBet}`);
    if (workspace.error) {
      checks.push({
        name: `delegation: ${target.raw} could not be checked — source ${product} unreachable`,
        pass: false,
        note: workspace.error,
        required: false,
      });
      continue;
    }

    const hit = lookupArtifact(workspace.workspaceRoot, target);
    const content = hit ? readDecisionFile(hit.path) : null;
    if (!hit || content === null) {
      checks.push({
        name: `delegation: ${target.raw} not found in ${product}${workspace.stale ? ' (stale)' : ''}`,
        pass: false,
        note: `${portfolioBet} says "Delegated to: ${target.raw}"`,
        required: true,
      });
      continue;
    }

    const backLinks = parseDelegatedFrom(content);
    const matching = backLinks.find(
      (r) => r.id === portfolioBet && qualifierNamesPortfolio(workspace.workspaceRoot, r.source as string, projectRoot)
    );
    if (matching) {
      checks.push({
        name: `delegation: ${portfolioBet} ↔ ${target.raw} (${hit.state})${workspace.stale ? ' (stale)' : ''}`,
        pass: true,
        required: true,
      });
    } else if (backLinks.length === 0) {
      checks.push({
        name: `delegation: ${target.raw} has no back-link to ${portfolioBet}`,
        pass: false,
        note: `add "- Delegated from: <portfolio>:${portfolioBet}" to its ## Links`,
        required: true,
      });
    } else {
      checks.push({
        name: `delegation: ${target.raw} back-links to ${backLinks.map((r) => r.raw).join(', ')}, not ${portfolioBet}`,
        pass: false,
        note: `${portfolioBet} says "Delegated to: ${target.raw}"; one side is wrong`,
        required: true,
      });
    }
  }

  // Reverse: product bets that claim a portfolio bet which does not claim them back.
  for (const p of readProducts(projectRoot).filter((e) => e.status !== 'sunset')) {
    const workspace = resolver.resolveWorkspace(p.source);
    if (!workspace || workspace.error) continue; // reported by the product registry / ref checks
    for (const { id, content } of pendingDecisions(workspace.workspaceRoot)) {
      for (const from of parseDelegatedFrom(content)) {
        if (!qualifierNamesPortfolio(workspace.workspaceRoot, from.source as string, projectRoot)) continue;
        const productRef = `${p.source}:${id}`;
        if (forward.has(`${productRef}|${from.id}`)) continue;
        if (handoffs.has(`${p.source}|${from.id}`)) {
          checks.push({
            name: `delegation: ${productRef} applied the ${from.id} handoff but the portfolio still says pending-handoff`,
            pass: false,
            note: `run /oprim:delegate ${from.id} --to ${p.source} --link ${id}`,
            required: false,
          });
          continue;
        }
        checks.push({
          name: `delegation: ${productRef} says "Delegated from: ${from.raw}" but ${from.id} does not delegate to it`,
          pass: false,
          note: `add "- Delegated to: ${productRef}" to ${from.id}'s ## Links, or remove the product's back-link`,
          required: true,
        });
      }
    }
  }
}
