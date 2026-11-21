// BET-075 / PDR-001 — portfolio-only scaffold templates. Kept out of lib/templates.ts so the
// product templates' diff stays zero.
import { configTemplate, okfFrontmatter } from '../templates';

/**
 * Product config + `mode: portfolio` (right after `version:`) + `products: []`. The portfolio
 * never holds specs, so spec_framework is always `none`.
 */
export function portfolioConfigTemplate(
  projectName: string,
  openspecEnabled: boolean,
  graphifyEnabled: boolean,
  okfEnabled: boolean
): string {
  const base = configTemplate(projectName, openspecEnabled, graphifyEnabled, okfEnabled, 'none');
  return base.replace(/^version: 1\n/, 'version: 1\nmode: portfolio\n') + 'products: []\n';
}

function withFrontmatter(okfEnabled: boolean, type: string, title: string, body: string): string {
  return okfEnabled ? okfFrontmatter(type, title) + body : body;
}

const handbookOverviewBody = `# Overview

<!-- Human-written. Every PM workflow loads oprim/handbook/ as context, and products can cite it
     through remote context — keep it to what is true company-wide. -->

## What we do
<one paragraph: the company, its customers, the problem it solves>

## Products
<one line per product; the registry of linked product repos lives in oprim/config.yaml under products:>

## How we work
<planning cadence, who decides what, where decisions are recorded>
`;

const handbookPrinciplesBody = `# Principles

<!-- Product principles every bet in every product is weighed against. Short, opinionated,
     each with the trade-off it settles. -->

1. **<principle>** — <the trade-off it settles, e.g. "we prefer X over Y because...">
`;

const handbookGlossaryBody = `# Glossary

<!-- Shared vocabulary. One term per row; link to the PDR that fixed a definition when there is one. -->

| Term | Meaning |
|---|---|
| <term> | <definition> |
`;

const stateBody = `# State

<!-- Personal, never exported (lives outside oprim/). Your current working picture: what you are
     focused on, what is waiting on whom. PM workflows read and update this file; the CLI never
     parses it. -->

## Focus
-

## Waiting on
-

## Open loops
-
`;

const inboxBody = `# Inbox

<!-- Personal, never exported. Capture first, triage later: one line per item. -->

-
`;

const wikiLogBody = `# Wiki log

<!-- Append-only. One dated entry per meeting, conversation or finding. People notes go in
     wiki/people/, per-product notes in wiki/products/, decision context in wiki/decisions/. -->
`;

export interface PortfolioScaffoldFile {
  /** Path relative to the project root, POSIX separators. */
  path: string;
  content: string;
}

/** Every file the portfolio scaffold writes (never overwriting) on top of the product scaffold. */
export function portfolioScaffoldFiles(okfEnabled: boolean): PortfolioScaffoldFile[] {
  return [
    { path: 'oprim/handbook/overview.md', content: withFrontmatter(okfEnabled, 'handbook', 'Overview', handbookOverviewBody) },
    { path: 'oprim/handbook/principles.md', content: withFrontmatter(okfEnabled, 'handbook', 'Principles', handbookPrinciplesBody) },
    { path: 'oprim/handbook/glossary.md', content: withFrontmatter(okfEnabled, 'handbook', 'Glossary', handbookGlossaryBody) },
    { path: 'oprim/objectives/.gitkeep', content: '' },
    { path: 'STATE.md', content: withFrontmatter(okfEnabled, 'pm-state', 'State', stateBody) },
    { path: 'inbox.md', content: withFrontmatter(okfEnabled, 'inbox', 'Inbox', inboxBody) },
    { path: 'wiki/log.md', content: withFrontmatter(okfEnabled, 'wiki-log', 'Wiki log', wikiLogBody) },
    { path: 'wiki/people/.gitkeep', content: '' },
    { path: 'wiki/products/.gitkeep', content: '' },
    { path: 'wiki/decisions/.gitkeep', content: '' },
    { path: 'outputs/.gitkeep', content: '' },
  ];
}

/** Root-level personal paths (outside oprim/) whose existence `oprim doctor` checks in portfolio mode. */
export const PORTFOLIO_PERSONAL_PATHS = ['STATE.md', 'inbox.md', 'wiki/', 'outputs/'];
