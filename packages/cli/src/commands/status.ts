import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';
import * as yaml from 'js-yaml';

interface SequenceBet {
  id: string;
  title: string;
  [key: string]: unknown;
}

interface SequenceBoard {
  wip_limits?: { now?: number };
  now?: SequenceBet[];
  next?: SequenceBet[];
  later?: SequenceBet[];
  backlog?: SequenceBet[];
}

export function statusCommand(): Command {
  return new Command('status')
    .description('Show sequencing board state (now/next/later/backlog) and WIP limit usage')
    .option('--json', 'print machine-readable JSON instead of the human-readable report')
    .action((opts) => {
      const projectRoot = process.cwd();
      const sequencePath = path.join(projectRoot, 'oprim', 'sequence.yaml');

      if (!fs.existsSync(sequencePath)) {
        console.error("No oprim/sequence.yaml found — run 'oprim init' first");
        process.exitCode = 1;
        return;
      }

      let board: SequenceBoard;
      try {
        board = (yaml.load(fs.readFileSync(sequencePath, 'utf-8')) as SequenceBoard) ?? {};
      } catch {
        console.error('Failed to parse oprim/sequence.yaml');
        process.exitCode = 1;
        return;
      }

      const now = board.now ?? [];
      const next = board.next ?? [];
      const later = board.later ?? [];
      const backlog = board.backlog ?? [];

      if (opts.json) {
        console.log(JSON.stringify({ wip_limits: board.wip_limits ?? {}, now, next, later, backlog }));
        return;
      }

      console.log(chalk.bold('oprim status') + '\n');

      const wipLimit = board.wip_limits?.now;
      const wipLine = wipLimit !== undefined ? `${now.length}/${wipLimit}` : `${now.length}`;
      console.log(chalk.dim(`WIP (now): ${wipLine}`));

      const lanes: Array<[string, SequenceBet[]]> = [
        ['now', now],
        ['next', next],
        ['later', later],
        ['backlog', backlog],
      ];

      for (const [label, bets] of lanes) {
        console.log(chalk.bold.cyan(`\n── ${label.toUpperCase()} ──`));
        if (bets.length === 0) {
          console.log('  (empty)');
          continue;
        }
        for (const bet of bets) {
          console.log(`  ${bet.id}  ${bet.title}`);
        }
      }
    });
}
