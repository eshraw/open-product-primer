// BET-079 — WIP limits per product and across the portfolio. Portfolio mode only; the portfolio's
// own `wip_limits.now` stays with checkSequenceIntegrity.
import type { Check } from '../integrity';
import type { RefResolver } from './refs';
import { loadPortfolio } from './view';

/**
 * Non-required failures: a product whose Now count exceeds its own `wip_limits.now`, and — when the
 * portfolio's sequence.yaml sets `wip_limits.portfolio_now` — a total Now count (portfolio + every
 * reachable non-sunset product) above it. Unreachable products are skipped (refs/doctor report them).
 */
export function checkPortfolioWip(projectRoot: string, checks: Check[], resolver?: RefResolver): void {
  const loaded = loadPortfolio(projectRoot, resolver);
  const products = loaded.products.filter((p) => !p.board.unreachable);
  let failed = false;

  for (const p of products) {
    const { now, limit } = p.board.load;
    if (limit !== undefined && now > limit) {
      failed = true;
      checks.push({
        name: `${p.board.name}: WIP limit exceeded (${now} active, limit ${limit})`,
        pass: false,
        note: `Move items out of now: in ${p.board.name}'s oprim/sequence.yaml`,
        required: false,
      });
    }
  }

  const limit = loaded.portfolio.portfolioNowLimit;
  if (limit !== undefined) {
    const workspaces = [loaded.portfolio, ...products];
    const total = workspaces.reduce((n, w) => n + w.board.load.now, 0);
    if (total > limit) {
      failed = true;
      checks.push({
        name: `portfolio: WIP limit exceeded (${total} active across ${workspaces.length} workspaces, limit ${limit})`,
        pass: false,
        note: 'Narrow Now across products, or raise wip_limits.portfolio_now in oprim/sequence.yaml',
        required: false,
      });
    }
  }

  if (!failed && (limit !== undefined || products.some((p) => p.board.load.limit !== undefined))) {
    checks.push({ name: 'portfolio: WIP within limits', pass: true, required: false });
  }
}
