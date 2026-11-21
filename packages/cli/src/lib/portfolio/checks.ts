import * as fs from 'fs';
import * as path from 'path';
import type { Check } from '../integrity';
import { readSpecFramework } from '../config-merge';
import { readWorkspaceMode, validateWorkspaceMode } from '../workspace-mode';
import { PORTFOLIO_PERSONAL_PATHS } from './templates';

/**
 * Non-required: the root personal files (PDR-001 §6) exist. Existence only — their content is
 * personal and the CLI never parses it.
 */
export function checkPortfolioScaffold(projectRoot: string, checks: Check[]): void {
  const missing = PORTFOLIO_PERSONAL_PATHS.filter((rel) => !fs.existsSync(path.join(projectRoot, rel)));
  if (missing.length === 0) {
    checks.push({ name: 'portfolio: personal files present (STATE.md, inbox.md, wiki/, outputs/)', pass: true, required: false });
    return;
  }
  for (const rel of missing) {
    checks.push({
      name: `portfolio: ${rel} is missing`,
      pass: false,
      note: "Run 'oprim init --mode portfolio' to restore it (existing files are never overwritten)",
      required: false,
    });
  }
}

/** Required: a portfolio workspace never holds specs (PDR-001 §5). */
export function checkPortfolioNoSpecs(projectRoot: string, checks: Check[]): void {
  const configPath = path.join(projectRoot, 'oprim', 'config.yaml');
  const framework = fs.existsSync(configPath) ? readSpecFramework(fs.readFileSync(configPath, 'utf-8')) : null;
  let failed = false;

  if (framework !== null && framework !== 'none') {
    failed = true;
    checks.push({
      name: 'portfolio: spec_framework must be none (portfolio workspaces never hold specs — see PDR-001)',
      pass: false,
      note: `oprim/config.yaml has spec_framework: ${framework}`,
      required: true,
    });
  }

  const pendingDir = path.join(projectRoot, 'oprim', 'bets', 'pending');
  if (fs.existsSync(pendingDir)) {
    for (const entry of fs.readdirSync(pendingDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (fs.existsSync(path.join(pendingDir, entry.name, 'specs'))) {
        failed = true;
        checks.push({
          name: `portfolio: ${entry.name} has a specs/ directory (portfolio workspaces never hold specs — see PDR-001)`,
          pass: false,
          note: 'Move the spec delta into the product repo that owns the capability',
          required: true,
        });
      }
    }
  }

  if (!failed) {
    checks.push({ name: 'portfolio: no specs (spec_framework: none)', pass: true, required: true });
  }
}

/**
 * Mode checks shared by `oprim doctor` and `oprim validate`: an invalid `mode:` value always; the
 * portfolio checks only in portfolio mode. Adds nothing to a valid product workspace.
 */
export function runWorkspaceModeChecks(projectRoot: string, checks: Check[]): void {
  validateWorkspaceMode(projectRoot, checks);
  if (readWorkspaceMode(projectRoot) !== 'portfolio') return;
  checkPortfolioScaffold(projectRoot, checks);
  checkPortfolioNoSpecs(projectRoot, checks);
}
