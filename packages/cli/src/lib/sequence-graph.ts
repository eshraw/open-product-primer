// Builds a node/edge graph from oprim/sequence.yaml's blocked_by/unlocks edges, and renders it as
// Mermaid `graph TD` text — shared by `oprim sequence-map` (CLI) and the sequence-map Claude mod,
// which shells out to the CLI rather than re-parsing sequence.yaml in its own sandboxed hooks
// module (no YAML library reachable there), so the two never drift apart.

export type SequenceLane = 'now' | 'next' | 'later' | 'backlog';

export interface SequenceBet {
  id: string;
  title: string;
  blocked_by?: string[];
  unlocks?: string[];
}

export interface SequenceBoard {
  now?: SequenceBet[];
  next?: SequenceBet[];
  later?: SequenceBet[];
  backlog?: SequenceBet[];
}

export interface GraphNode {
  id: string;
  title: string;
  lane: SequenceLane | 'unknown';
}

export interface GraphEdge {
  from: string;
  to: string;
}

export interface SequenceGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const LANES: SequenceLane[] = ['now', 'next', 'later', 'backlog'];

export function buildSequenceGraph(board: SequenceBoard): SequenceGraph {
  const nodesById = new Map<string, GraphNode>();
  for (const lane of LANES) {
    for (const bet of board[lane] ?? []) {
      nodesById.set(bet.id, { id: bet.id, title: bet.title, lane });
    }
  }

  const edgeKeys = new Set<string>();
  const edges: GraphEdge[] = [];
  const addEdge = (from: string, to: string): void => {
    const key = `${from}->${to}`;
    if (edgeKeys.has(key)) return;
    edgeKeys.add(key);
    edges.push({ from, to });
    // A dangling reference (task 3.2) still gets a node, styled `unknown`, so the edge is drawn
    // instead of silently dropped.
    if (!nodesById.has(from)) nodesById.set(from, { id: from, title: from, lane: 'unknown' });
    if (!nodesById.has(to)) nodesById.set(to, { id: to, title: to, lane: 'unknown' });
  };

  for (const lane of LANES) {
    for (const bet of board[lane] ?? []) {
      for (const blockerId of bet.blocked_by ?? []) addEdge(blockerId, bet.id);
      for (const unlockedId of bet.unlocks ?? []) addEdge(bet.id, unlockedId);
    }
  }

  return { nodes: [...nodesById.values()], edges };
}

// Topological layering (Kahn's algorithm) for a box-and-arrow rendering surface with no native
// line-drawing (the terminal's ui.render table has Box/Text but no Svg): nodes with no unresolved
// incoming edge form layer 0, then peel their outgoing edges and repeat. A cycle (or any node an
// earlier layer never frees) lands in one trailing layer rather than looping forever.
export function computeLayers(graph: SequenceGraph): string[][] {
  const inDegree = new Map<string, number>();
  const outgoing = new Map<string, string[]>();
  for (const node of graph.nodes) {
    inDegree.set(node.id, 0);
    outgoing.set(node.id, []);
  }
  for (const edge of graph.edges) {
    inDegree.set(edge.to, (inDegree.get(edge.to) ?? 0) + 1);
    outgoing.get(edge.from)?.push(edge.to);
  }

  const layers: string[][] = [];
  const remaining = new Set(graph.nodes.map((n) => n.id));
  const degree = new Map(inDegree);

  while (remaining.size > 0) {
    const layer = [...remaining].filter((id) => (degree.get(id) ?? 0) === 0);
    if (layer.length === 0) {
      // A cycle: nothing has in-degree zero. Dump the rest as one final layer rather than
      // looping forever.
      layers.push([...remaining]);
      break;
    }
    layers.push(layer);
    for (const id of layer) {
      remaining.delete(id);
      for (const next of outgoing.get(id) ?? []) {
        degree.set(next, (degree.get(next) ?? 0) - 1);
      }
    }
  }

  return layers;
}

function escapeMermaidLabel(text: string): string {
  return text.replace(/"/g, "'");
}

export function renderMermaid(graph: SequenceGraph): string {
  const lines = ['graph TD'];
  lines.push('  classDef now fill:#f96,stroke:#333,color:#000');
  lines.push('  classDef next fill:#ff9,stroke:#333,color:#000');
  lines.push('  classDef later fill:#9cf,stroke:#333,color:#000');
  lines.push('  classDef backlog fill:#ddd,stroke:#333,color:#000');
  lines.push('  classDef unknown fill:#fff,stroke:#f00,stroke-dasharray: 3 3,color:#000');

  for (const node of graph.nodes) {
    const label = escapeMermaidLabel(`${node.id}: ${node.title}`);
    lines.push(`  ${node.id}["${label}"]:::${node.lane}`);
  }
  for (const edge of graph.edges) {
    lines.push(`  ${edge.from} --> ${edge.to}`);
  }

  return lines.join('\n');
}
