// BET-076 / PDR-001 — the portfolio's product registry. A `products:` entry only *names* an
// existing `remote_context.sources` entry (one linking mechanism); owner/squad/status are metadata
// the CLI never resolves.
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import type { Check } from '../integrity';
import { readRemoteContextConfig, findSourceByName } from '../remote-context';

export type ProductStatus = 'active' | 'paused' | 'sunset';
export const PRODUCT_STATUSES: readonly ProductStatus[] = ['active', 'paused', 'sunset'];

export interface ProductEntry {
  source: string;
  owner?: string;
  squad?: string;
  objectives?: string[];
  status: ProductStatus;
}

// Raw entries as written, so the check can see fields a valid ProductEntry never has.
function readRawProducts(projectRoot: string): unknown[] {
  const p = path.join(projectRoot, 'oprim', 'config.yaml');
  if (!fs.existsSync(p)) return [];
  try {
    const parsed = yaml.load(fs.readFileSync(p, 'utf-8')) as Record<string, unknown> | undefined;
    return Array.isArray(parsed?.products) ? (parsed!.products as unknown[]) : [];
  } catch {
    return [];
  }
}

/** Well-formed product entries (those with a string `source`), with `status` defaulted to active. */
export function readProducts(projectRoot: string): ProductEntry[] {
  return readRawProducts(projectRoot)
    .filter((e): e is Record<string, unknown> => !!e && typeof e === 'object' && typeof (e as Record<string, unknown>).source === 'string')
    .map((e) => ({
      source: e.source as string,
      owner: typeof e.owner === 'string' ? e.owner : undefined,
      squad: typeof e.squad === 'string' ? e.squad : undefined,
      objectives: Array.isArray(e.objectives) ? (e.objectives as unknown[]).map(String) : undefined,
      status: (typeof e.status === 'string' ? e.status : 'active') as ProductStatus,
    }));
}

/** Portfolio mode only (called from runWorkspaceModeChecks). */
export function checkProductRegistry(projectRoot: string, checks: Check[]): void {
  const raw = readRawProducts(projectRoot);
  const remote = readRemoteContextConfig(projectRoot);
  let failed = false;
  const fail = (name: string, note: string): void => {
    failed = true;
    checks.push({ name, pass: false, note, required: true });
  };

  raw.forEach((entry, i) => {
    if (!entry || typeof entry !== 'object' || typeof (entry as Record<string, unknown>).source !== 'string') {
      fail(`products: entry ${i + 1} has no source`, 'Each products: entry needs source: <remote_context source name>');
      return;
    }
    const e = entry as Record<string, unknown>;
    const source = e.source as string;

    for (const field of ['git', 'path'] as const) {
      if (field in e) {
        fail(
          `products: ${source} has its own ${field} field`,
          `Move ${field} into remote_context.sources (one linking mechanism — see PDR-001) and keep only source: ${source} here`
        );
      }
    }

    if (!findSourceByName(remote, source)) {
      fail(
        `products: ${source} is not a registered remote_context source — run 'oprim context register'`,
        `oprim context register --git <url>|--local <path> --name ${source}`
      );
    }

    if (e.status !== undefined && !(PRODUCT_STATUSES as readonly unknown[]).includes(e.status)) {
      fail(`products: ${source} has unknown status "${String(e.status)}"`, `Expected ${PRODUCT_STATUSES.join(' | ')}`);
    }
  });

  if (!failed) {
    checks.push({ name: `products: ${raw.length} registered`, pass: true, required: true });
  }
}
