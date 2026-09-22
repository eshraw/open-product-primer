import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { buildSequenceGraph, computeLayers, renderMermaid, type SequenceBoard } from '../lib/sequence-graph';
import { sequenceMapCommand } from '../commands/sequence-map';

describe('buildSequenceGraph', () => {
  it('builds one node per bet across lanes, and one edge per blocked_by/unlocks relationship', () => {
    const board: SequenceBoard = {
      now: [{ id: 'BET-001', title: 'First', blocked_by: [], unlocks: ['BET-002'] }],
      backlog: [{ id: 'BET-002', title: 'Second', blocked_by: ['BET-001'], unlocks: [] }],
    };

    const graph = buildSequenceGraph(board);

    expect(graph.nodes).toEqual(
      expect.arrayContaining([
        { id: 'BET-001', title: 'First', lane: 'now' },
        { id: 'BET-002', title: 'Second', lane: 'backlog' },
      ])
    );
    // BET-001's `unlocks` and BET-002's `blocked_by` describe the same edge — deduped, not doubled.
    expect(graph.edges).toEqual([{ from: 'BET-001', to: 'BET-002' }]);
  });

  it('renders disconnected nodes for a board with no dependency edges, without erroring', () => {
    const board: SequenceBoard = {
      later: [{ id: 'BET-014', title: 'Solo' }],
    };

    const graph = buildSequenceGraph(board);

    expect(graph.nodes).toEqual([{ id: 'BET-014', title: 'Solo', lane: 'later' }]);
    expect(graph.edges).toEqual([]);
  });

  it('handles a completely empty board', () => {
    expect(buildSequenceGraph({})).toEqual({ nodes: [], edges: [] });
  });

  it('surfaces a dangling blocked_by reference as a node instead of dropping the edge', () => {
    const board: SequenceBoard = {
      now: [{ id: 'BET-001', title: 'First', blocked_by: ['BET-999'] }],
    };

    const graph = buildSequenceGraph(board);

    expect(graph.edges).toEqual([{ from: 'BET-999', to: 'BET-001' }]);
    expect(graph.nodes).toEqual(
      expect.arrayContaining([{ id: 'BET-999', title: 'BET-999', lane: 'unknown' }])
    );
  });
});

describe('computeLayers', () => {
  it('puts unblocked nodes in layer 0 and each dependency one layer after its blocker', () => {
    const graph = buildSequenceGraph({
      now: [{ id: 'BET-001', title: 'First', unlocks: ['BET-002'] }],
      backlog: [
        { id: 'BET-002', title: 'Second', unlocks: ['BET-003'] },
        { id: 'BET-003', title: 'Third' },
      ],
    });

    expect(computeLayers(graph)).toEqual([['BET-001'], ['BET-002'], ['BET-003']]);
  });

  it('puts every node with no edges in one flat layer', () => {
    const graph = buildSequenceGraph({
      later: [
        { id: 'BET-014', title: 'Solo' },
        { id: 'BET-019', title: 'Also solo' },
      ],
    });

    const layers = computeLayers(graph);
    expect(layers).toHaveLength(1);
    expect(layers[0]).toEqual(expect.arrayContaining(['BET-014', 'BET-019']));
  });

  it('terminates on a cycle by dumping the remainder as one trailing layer', () => {
    const graph = buildSequenceGraph({
      now: [{ id: 'BET-001', title: 'First', blocked_by: ['BET-002'] }],
      backlog: [{ id: 'BET-002', title: 'Second', blocked_by: ['BET-001'] }],
    });

    const layers = computeLayers(graph);
    expect(layers.flat().sort()).toEqual(['BET-001', 'BET-002']);
  });
});

describe('renderMermaid', () => {
  it('renders a graph TD diagram with a classed node per bet and an edge per relationship', () => {
    const graph = buildSequenceGraph({
      now: [{ id: 'BET-001', title: 'First', unlocks: ['BET-002'] }],
      backlog: [{ id: 'BET-002', title: 'Second' }],
    });

    const mermaid = renderMermaid(graph);

    expect(mermaid).toMatch(/^graph TD/);
    expect(mermaid).toContain('BET-001["BET-001: First"]:::now');
    expect(mermaid).toContain('BET-002["BET-002: Second"]:::backlog');
    expect(mermaid).toContain('BET-001 --> BET-002');
  });
});

describe('sequenceMapCommand', () => {
  let tmpDir: string;
  let logLines: string[];
  let errorLines: string[];

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oprim-sequence-map-command-test-'));
    vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
    logLines = [];
    errorLines = [];
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logLines.push(args.map(String).join(' '));
    });
    vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      errorLines.push(args.map(String).join(' '));
    });
    process.exitCode = undefined;
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    vi.restoreAllMocks();
    process.exitCode = undefined;
  });

  function writeSequence(content: string): void {
    const primerDir = path.join(tmpDir, 'oprim');
    fs.mkdirSync(primerDir, { recursive: true });
    fs.writeFileSync(path.join(primerDir, 'sequence.yaml'), content);
  }

  async function run(args: string[] = []): Promise<void> {
    await sequenceMapCommand().parseAsync(args, { from: 'user' });
  }

  it('errors when oprim/sequence.yaml is missing', async () => {
    await run();
    expect(process.exitCode).toBe(1);
    expect(errorLines.join('\n')).toContain('No oprim/sequence.yaml found');
  });

  it('prints Mermaid text by default', async () => {
    writeSequence('now:\n  - id: BET-001\n    title: First\nbacklog: []\n');
    await run();
    expect(logLines.join('\n')).toContain('graph TD');
    expect(logLines.join('\n')).toContain('BET-001');
  });

  it('prints { nodes, edges, layers, mermaid } JSON with --json', async () => {
    writeSequence('now:\n  - id: BET-001\n    title: First\nbacklog: []\n');
    await run(['--json']);
    const parsed = JSON.parse(logLines.join(''));
    expect(parsed.nodes).toEqual([{ id: 'BET-001', title: 'First', lane: 'now' }]);
    expect(parsed.edges).toEqual([]);
    expect(parsed.layers).toEqual([['BET-001']]);
    expect(parsed.mermaid).toContain('graph TD');
  });
});
