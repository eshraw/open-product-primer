import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { buildSequenceGraph, computeLayers, renderMermaid, type SequenceBoard } from '../lib/sequence-graph';

export function sequenceMapCommand(): Command {
  return new Command('sequence-map')
    .description("Render the sequencing board's blocked_by/unlocks edges as a Mermaid dependency map")
    .option('--json', 'print { nodes, edges } instead of Mermaid text')
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

      const graph = buildSequenceGraph(board);
      const mermaid = renderMermaid(graph);

      if (opts.json) {
        const layers = computeLayers(graph);
        console.log(JSON.stringify({ ...graph, layers, mermaid }));
        return;
      }

      console.log(mermaid);
    });
}
