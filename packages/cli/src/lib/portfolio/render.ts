// BET-079 — renderers for the portfolio view model. Pure: same model in, same text out.
import chalk from 'chalk';
import * as yaml from 'js-yaml';
import type { PortfolioView, WorkspaceBoard } from './view';

function loadLabel(b: WorkspaceBoard): string {
  return `now ${b.load.now}${b.load.limit !== undefined ? `/${b.load.limit}` : ''}`;
}

function firstLine(text: string | undefined): string {
  return (text ?? '').split('\n')[0].trim();
}

function boardHeader(b: WorkspaceBoard): string {
  if (b.unreachable) return `${chalk.bold(b.name)} unreachable${b.error ? chalk.dim(` (${firstLine(b.error)})`) : ''}`;
  const extras = [
    b.owner ? `owner ${b.owner}` : null,
    b.squad ? `squad ${b.squad}` : null,
    b.status && b.status !== 'active' ? b.status : null,
  ].filter((x): x is string => x !== null);
  return `${chalk.bold(b.name)} ${loadLabel(b)}${b.stale ? ' (stale)' : ''}${extras.length ? chalk.dim(` · ${extras.join(' · ')}`) : ''}`;
}

const dependencyLine = (d: PortfolioView['dependencies'][number]): string =>
  `${d.from} (${d.fromLane}) blocked by ${d.blocker} (${d.blockerState})`;

const delegationLabel = (d: PortfolioView['delegations'][number]): string =>
  `${d.state}${d.decision ? ` · ${d.decision}` : ''}`;

const delegationLine = (d: PortfolioView['delegations'][number]): string =>
  `${d.bet} delegated → ${d.target} (${delegationLabel(d)})`;

/** Terminal lines. Colour comes from chalk, which emits no ANSI codes when stdout is not a TTY. */
export function renderPortfolioTerminal(view: PortfolioView): string[] {
  const lines: string[] = [];
  for (const b of [view.portfolio, ...view.products]) {
    lines.push(boardHeader(b));
    if (b.unreachable) continue;
    if (b.now.length === 0 && b.next.length === 0) lines.push(chalk.dim('  (nothing in now/next)'));
    for (const [lane, rows] of [['now', b.now], ['next', b.next]] as const) {
      for (const r of rows) lines.push(`  ${lane.padEnd(4)}  ${r.id}  ${r.title}`);
    }
  }

  const section = (title: string, items: string[]): void => {
    if (items.length === 0) return;
    lines.push('', chalk.bold.yellow(`── ${title} ──`), ...items.map((i) => `  ${i}`));
  };
  section('DEPENDENCIES', view.dependencies.map(dependencyLine));
  section('DELEGATIONS', view.delegations.map(delegationLine));
  section('COVERAGE', [
    ...view.coverage.objectivesWithoutFlight.map((o) => `${o} has no bet in now/next`),
    ...view.coverage.betsWithoutObjective.map((b) => `${b} has no objective`),
  ]);
  section('HYGIENE', [
    ...view.hygiene.overdueReviews.map((r) => `${r.ref} review overdue (${r.date})`),
    ...view.hygiene.missingCriteria.map((r) => `${r} promoted without criteria.yaml`),
  ]);
  return lines;
}

// ─── Markdown file (oprim/portfolio-view.md) ────────────────────────────────

const cell = (s: string): string => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');

function table(headers: string[], rows: string[][]): string {
  if (rows.length === 0) return '_None._\n';
  return [
    `| ${headers.join(' | ')} |`,
    `|${headers.map(() => '---').join('|')}|`,
    ...rows.map((r) => `| ${r.map(cell).join(' | ')} |`),
  ].join('\n') + '\n';
}

function frontmatter(view: PortfolioView): string {
  const data = {
    type: 'portfolio-view',
    title: 'Portfolio view',
    timestamp: view.generatedAt,
    products: [view.portfolio, ...view.products].map((b) => ({
      name: b.name,
      kind: b.kind,
      ...(b.owner ? { owner: b.owner } : {}),
      ...(b.squad ? { squad: b.squad } : {}),
      ...(b.status ? { status: b.status } : {}),
      now: b.now.map((r) => r.id),
      next: b.next.map((r) => r.id),
      now_count: b.load.now,
      ...(b.load.limit !== undefined ? { now_limit: b.load.limit } : {}),
      stale: b.stale,
      unreachable: b.unreachable,
    })),
    dependencies: view.dependencies.map((d) => ({
      from: d.from,
      from_lane: d.fromLane,
      blocker: d.blocker,
      blocker_state: d.blockerState,
      problem: d.problem,
    })),
    delegations: view.delegations.map((d) => ({
      bet: d.bet,
      target: d.target,
      state: d.state,
      ...(d.decision ? { decision: d.decision } : {}),
    })),
    coverage: [
      ...view.coverage.objectivesWithoutFlight.map((ref) => ({ kind: 'objective-without-flight', ref })),
      ...view.coverage.betsWithoutObjective.map((ref) => ({ kind: 'bet-without-objective', ref })),
    ],
    hygiene: [
      ...view.hygiene.overdueReviews.map((r) => ({ kind: 'overdue-review', ref: r.ref, date: r.date })),
      ...view.hygiene.missingCriteria.map((ref) => ({ kind: 'missing-criteria', ref })),
    ],
  };
  return `---\n${yaml.dump(data, { lineWidth: -1, noRefs: true })}---\n\n`;
}

/** `oprim/portfolio-view.md`: OKF frontmatter (Dataview/Notion-parseable lists) when enabled, plain tables always. */
export function renderPortfolioMarkdown(view: PortfolioView, okf: boolean): string {
  const boards = [view.portfolio, ...view.products];
  const boardRows: string[][] = [];
  for (const b of boards) {
    const state = b.unreachable ? 'unreachable' : b.stale ? 'stale' : (b.status ?? 'active');
    if (b.unreachable || (b.now.length === 0 && b.next.length === 0)) {
      boardRows.push([b.name, b.unreachable ? '' : loadLabel(b), state, '', '', '']);
      continue;
    }
    for (const [lane, rows] of [['now', b.now], ['next', b.next]] as const) {
      for (const r of rows) boardRows.push([b.name, loadLabel(b), state, lane, r.id, r.title]);
    }
  }

  const body = [
    '# Portfolio view',
    '',
    `<!-- Generated by 'oprim ovw --portfolio --write' on ${view.generatedAt}. Regenerate rather than edit. -->`,
    '',
    '## Boards',
    '',
    table(['Workspace', 'Load', 'State', 'Lane', 'Bet', 'Title'], boardRows),
    '## Dependencies',
    '',
    table(
      ['Bet', 'Lane', 'Blocked by', 'Blocker state', 'Problem'],
      view.dependencies.map((d) => [d.from, d.fromLane, d.blocker, d.blockerState, d.problem])
    ),
    '## Delegations',
    '',
    table(['Bet', 'Delegated to', 'State', 'Decision'], view.delegations.map((d) => [d.bet, d.target, d.state, d.decision ?? ''])),
    '## Coverage',
    '',
    table(['Ref', 'Gap'], [
      ...view.coverage.objectivesWithoutFlight.map((o) => [o, 'no bet in now/next']),
      ...view.coverage.betsWithoutObjective.map((b) => [b, 'no objective']),
    ]),
    '## Hygiene',
    '',
    table(['Ref', 'Issue'], [
      ...view.hygiene.overdueReviews.map((r) => [r.ref, `review overdue (${r.date})`]),
      ...view.hygiene.missingCriteria.map((r) => [r, 'promoted without criteria.yaml']),
    ]),
  ].join('\n');

  return (okf ? frontmatter(view) : '') + body;
}
