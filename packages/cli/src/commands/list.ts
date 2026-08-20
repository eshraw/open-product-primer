import { Command } from 'commander';
import chalk from 'chalk';
import {
  type BetSummary,
  type DecisionSummary,
  type NoteSummary,
  listBets,
  listDecisions,
  listNotes,
} from '../lib/artifacts';

function printTable<T>(label: string, rows: T[], columns: (row: T) => string[]): void {
  console.log(chalk.bold.cyan(`\n── ${label} ──`));
  if (rows.length === 0) {
    console.log('  (none)');
    return;
  }
  for (const row of rows) {
    console.log(`  ${columns(row).join('  ')}`);
  }
}

export function listCommand(): Command {
  return new Command('list')
    .description('Enumerate oprim artifacts (bets, decisions, notes) by type')
    .option('-b, --bets', 'list bets')
    .option('-d, --decisions', 'list decisions (PDRs)')
    .option('-n, --notes', 'list notes')
    .option('--json', 'print machine-readable JSON instead of the human-readable table')
    .action((opts) => {
      const projectRoot = process.cwd();
      const anyTypeRequested = !!(opts.bets || opts.decisions || opts.notes);
      const showBets = anyTypeRequested ? !!opts.bets : true;
      const showDecisions = !!opts.decisions;
      const showNotes = !!opts.notes;

      const bets: BetSummary[] | undefined = showBets ? listBets(projectRoot) : undefined;
      const decisions: DecisionSummary[] | undefined = showDecisions ? listDecisions(projectRoot) : undefined;
      const notes: NoteSummary[] | undefined = showNotes ? listNotes(projectRoot) : undefined;

      if (opts.json) {
        const result: Record<string, unknown> = {};
        if (bets) result.bets = bets;
        if (decisions) result.decisions = decisions;
        if (notes) result.notes = notes;
        console.log(JSON.stringify(result));
        return;
      }

      if (bets) printTable('BETS', bets, (b) => [b.id, b.status ?? '-', b.title]);
      if (decisions) printTable('DECISIONS', decisions, (d) => [d.id, d.status ?? '-', d.title]);
      if (notes) printTable('NOTES', notes, (n) => [n.id, n.tags.join(',') || '-', n.title]);
    });
}
