// Static registry of installable Claude Code "mods" — see
// oprim/bets/pending/BET-074-migrate-claude-mods-to-function-hooks/design.md. Both `oprim init`'s
// mod-selection prompt and the `oprim claude-mods` command read from this single registry, so a
// future mod (BET-052–073) is added here once rather than duplicated per entry point.
//
// A registry entry declares one of two shapes:
//   - 'classic': a shell-command hook merged into .claude/settings.json's `hooks` block (text-only
//     {decision, reason} protocol — cannot draw UI).
//   - 'plugin': a Claude Code function-hooks plugin (manifest + hooks.json + a register(on) module)
//     installed at .claude/skills/<id>/, loaded via the project-scope skills-directory auto-load
//     convention. Can draw UI ($.ui.log, $.ui.render) but requires CLAUDE_CODE_ENABLE_FUNCTION_HOOKS
//     and is early access — its API may move between releases.

export interface ClaudeModHookFile {
  filename: string; // written to .claude/hooks/<filename>
  content: string;
  event: 'PreToolUse' | 'PostToolUse' | 'UserPromptSubmit' | 'Stop';
  matcher?: string;
  command: string; // registered in .claude/settings.json under hooks[event]
}

export interface ClaudeModPluginFile {
  path: string; // relative to the mod's plugin directory, .claude/skills/<mod.id>/<path>
  content: string;
}

interface ClaudeModBase {
  id: string;
  title: string;
  description: string;
}

export interface ClaudeModClassic extends ClaudeModBase {
  shape: 'classic';
  hookFiles: ClaudeModHookFile[];
}

export interface ClaudeModPlugin extends ClaudeModBase {
  shape: 'plugin';
  pluginFiles: ClaudeModPluginFile[];
}

export type ClaudeMod = ClaudeModClassic | ClaudeModPlugin;

export function isPluginMod(mod: ClaudeMod): mod is ClaudeModPlugin {
  return mod.shape === 'plugin';
}

// register(on) module: on a Write/Edit tool.call to a bet's specs/<capability>/spec.md delta,
// shells out to `oprim validate --json` (already runs checkSpecDeltaDrift()) and surfaces any
// MODIFIED/REMOVED drift for that capability as a transcript line, at write time instead of only
// at validate/CI time. Never denies the call — this is a write-time convenience on top of
// `oprim validate`, never a second source of required failures. Silently no-ops on any failure
// (oprim not resolvable, malformed report, etc.).
const SPEC_DELTA_DRIFT_INTERCEPTOR_REGISTER = `// Function-hooks module for the spec-delta-drift-interceptor mod — see claude-mods.ts.
// EARLY ACCESS: register(on)/$.ui.log/$.process.run are gated behind
// CLAUDE_CODE_ENABLE_FUNCTION_HOOKS and may change shape between Claude Code releases. A hooks
// module may only import its own files by relative path and "claude-code" — no Node builtins — so
// shelling out goes through $.process.run, not node:child_process.
//
// Surfaces the drift as a transcript line via $.ui.log rather than $.ui.toast: a toast is a
// transient overlay whose rendering depends on the session's UI surface, while $.ui.log's default
// destination ("to: transcript") always lands as a plain line every surface shows — see the
// anthropics/claude-code \`mods/diff\` example, which uses the same call for its panel-toggle
// messages ("Diff panel shown"/"Diff panel hidden").

export function register(on) {
  on('tool.call', { tool: ['Write', 'Edit'] }, async ($, e, next) => {
    const result = await next(e);

    try {
      const filePath = String(e.file_path || '').replace(/\\\\/g, '/');
      const match = filePath.match(/oprim\\/bets\\/pending\\/[^/]+\\/specs\\/([^/]+)\\/spec\\.md$/);
      if (!match) return result;
      const capability = match[1];

      let output;
      try {
        // validate exits non-zero when a required check fails — stdout still carries the report
        const res = await $.process.run(['npx', '--no-install', 'oprim', 'validate', '--json']);
        output = res.stdout;
      } catch {
        output = null;
      }
      if (!output) return result;

      const report = JSON.parse(output);
      const drift = (report.checks || []).filter(
        (c) => c.name && c.name.startsWith('spec-delta:') && c.name.includes(\`in \${capability} \`) && !c.pass
      );
      if (drift.length === 0) return result;

      const reason = drift.map((c) => \`\${c.name}\${c.note ? \` (\${c.note})\` : ''}\`).join('; ');
      $.ui.log(\`⚠ Spec-delta drift in \${capability}: \${reason}\`);
    } catch {
      // Graceful degradation — never error or block on interceptor failure.
    }

    return result;
  });
}
`;

// register(on) module: on a Write/Edit tool.call to a bet's specs/<capability>/spec.md delta,
// shells out to `oprim validate --json` (already runs checkCrossBetConflicts()) and surfaces any
// conflict involving this bet's capability as a non-blocking transcript notice, at write time
// instead of only at validate/CI time. Never denies the call, and reads as a heads-up (the other
// bet's author may not be in this session, and their delta may itself be abandoned/in-progress) —
// never an error. Silently no-ops on any failure.
const CROSS_BET_CONFLICT_LIVE_CHECK_REGISTER = `// Function-hooks module for the cross-bet-conflict-live-check mod — see claude-mods.ts.
// EARLY ACCESS: register(on)/$.ui.log/$.process.run are gated behind
// CLAUDE_CODE_ENABLE_FUNCTION_HOOKS and may change shape between Claude Code releases. A hooks
// module may only import its own files by relative path and "claude-code" — no Node builtins — so
// shelling out goes through $.process.run, not node:child_process.
//
// Reuses checkCrossBetConflicts() (via \`oprim validate --json\`) as the detection primitive rather
// than forking conflict-matching logic, so this live notice and \`oprim validate\`'s own check never
// drift apart. Surfaced via $.ui.log (always lands as a transcript line, unlike a toast) tagged with
// the check's own estimated criticality (low/medium/high, from estimateCriticality() in
// spec-delta.ts) rather than a generic "[cross-bet conflict]" label, so the author can tell a
// contradictory add-vs-remove from two edits that happen to agree without opening either delta.

const CONFLICT_LINE = /^spec-delta: (BET-\\d+) and (BET-\\d+) both touch "(.*)" in (.+) \\[criticality: (low|medium|high)\\]$/;

export function register(on) {
  on('tool.call', { tool: ['Write', 'Edit'] }, async ($, e, next) => {
    const result = await next(e);

    try {
      const filePath = String(e.file_path || '').replace(/\\\\/g, '/');
      const match = filePath.match(/oprim\\/bets\\/pending\\/([^/]+)\\/specs\\/([^/]+)\\/spec\\.md$/);
      if (!match) return result;
      const [, betDir, capability] = match;
      const betIdMatch = betDir.match(/^(BET-\\d+)/);
      const betId = betIdMatch ? betIdMatch[1] : betDir;

      let output;
      try {
        // validate exits non-zero when a required check fails — stdout still carries the report
        const res = await $.process.run(['npx', '--no-install', 'oprim', 'validate', '--json']);
        output = res.stdout;
      } catch {
        output = null;
      }
      if (!output) return result;

      const report = JSON.parse(output);
      for (const check of report.checks || []) {
        const lineMatch = check.name && check.name.match(CONFLICT_LINE);
        if (!lineMatch) continue;
        const [, betA, betB, header, cap, criticality] = lineMatch;
        if (cap !== capability) continue;
        if (betA !== betId && betB !== betId) continue;
        const otherBet = betA === betId ? betB : betA;
        $.ui.log(\`[\${criticality}] \${otherBet} also touches "\${header}" in \${capability} — heads-up, not a blocker\`);
      }
    } catch {
      // Graceful degradation — never error or block on live-check failure.
    }

    return result;
  });
}
`;

// register(on) module: registers /sequence-map, which shells out to oprim sequence-map --json
// (buildSequenceGraph()/computeLayers()/renderMermaid() in lib/sequence-graph.ts, kept as
// graph-theory internals distinct from this mod's product name) — never re-parses
// oprim/sequence.yaml itself, so the pane's diagram and the CLI's own output never drift apart. On a
// surface with Svg (desktop, mobile, vscode), draws an actual node-and-arrow diagram: a hand-built
// <svg> with nodes as <rect>+<text> positioned by computeLayers() layer/index and edges as arrowed
// <line>s. The terminal has no Svg (or any line-drawing primitive), so it falls back to a layered
// Box grid with each node's successors listed as a footer line. The Mermaid text stays available,
// unchanged, behind the "Export .mmd" button regardless of which drawing ran — one source of truth
// (the JSON graph), two presentations.
const SEQUENCE_MAP_REGISTER = `// Function-hooks module for the sequence-map mod — see claude-mods.ts.
// EARLY ACCESS: register(on)/$.ui.*/$.process.run are gated behind
// CLAUDE_CODE_ENABLE_FUNCTION_HOOKS and may change shape between Claude Code releases. A hooks
// module may only import its own files by relative path and "claude-code" — no Node builtins — so
// shelling out goes through $.process.run, not node:child_process.
//
// Shells out to oprim sequence-map --json (buildSequenceGraph()/computeLayers()/renderMermaid()
// in lib/sequence-graph.ts — kept as graph-theory internals; "sequence-map" is this mod's product
// name, not a rename of the underlying data structure) rather than re-parsing oprim/sequence.yaml in
// this sandboxed module (no YAML library reachable here), so the pane's diagram and the CLI's own
// output never drift apart.
//
// On a surface with Svg (desktop, mobile, vscode — see Elements in claude-code.d.ts), draws an
// actual node-and-arrow diagram: one hand-built <svg> document, nodes as <rect>+<text> positioned by
// computeLayers() layer/index, edges as <line> with an arrowhead marker connecting each source's
// bottom-center to each target's top-center. The terminal has no Svg (or any line-drawing
// primitive), so it falls back to a layered grid of bordered Box nodes with each node's direct
// successors listed as a footer line, since a real connecting line isn't drawable there. The Mermaid
// text (still generated, still exact) stays available as the "Export .mmd" output regardless of
// which drawing ran — one source of truth (the JSON graph), two presentations.
// Built with plain string concatenation (no nested template literals) so nothing here needs
// backtick-escaping games inside this file's own source.

const PANE_ID = 'sequence-map';
const STORE_KEY = 'sequence-map:data';

const LANE_COLOR = {
  now: 'redBright',
  next: 'yellow',
  later: 'cyan',
  backlog: 'gray',
  unknown: 'red',
};

const LANE_FILL = {
  now: '#f96',
  next: '#e0c341',
  later: '#7fb3d9',
  backlog: '#888',
  unknown: '#3a3a3a',
};

const LANE_STROKE = {
  now: '#c05a00',
  next: '#a68b00',
  later: '#2d6d9e',
  backlog: '#555',
  unknown: '#e04040',
};

function escapeXml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function truncate(text, max) {
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}

function buildSvgGraph(data) {
  const layers = data.layers && data.layers.length > 0 ? data.layers : [data.nodes.map((n) => n.id)];

  const nodeW = 200;
  const nodeH = 60;
  const gapX = 36;
  const gapY = 56;
  const subRowGapY = 16;
  const marginX = 20;
  const marginY = 20;
  const maxPerRow = 4;

  // A layer can hold many unrelated (edge-free) nodes — most boards start that way. Wrapping a wide
  // layer into several sub-rows keeps the diagram scrolling vertically (natural in a pane) instead of
  // growing arbitrarily wide (not).
  const fullWidth = maxPerRow * nodeW + (maxPerRow - 1) * gapX;

  const positions = new Map();
  let cursorY = marginY;
  for (const layerIds of layers) {
    for (let start = 0; start < layerIds.length; start += maxPerRow) {
      const rowIds = layerIds.slice(start, start + maxPerRow);
      const rowWidth = rowIds.length * nodeW + (rowIds.length - 1) * gapX;
      const startX = marginX + (fullWidth - rowWidth) / 2;
      rowIds.forEach((id, i) => {
        positions.set(id, { x: startX + i * (nodeW + gapX), y: cursorY });
      });
      cursorY += nodeH + subRowGapY;
    }
    cursorY += gapY - subRowGapY;
  }

  const width = marginX * 2 + fullWidth;
  const height = cursorY - gapY + marginY;

  const parts = [];
  parts.push(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + width + ' ' + height + '" width="' + width + '" height="' + height + '">'
  );
  parts.push(
    '<defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#9aa0a6" /></marker></defs>'
  );

  for (const edge of data.edges || []) {
    const from = positions.get(edge.from);
    const to = positions.get(edge.to);
    if (!from || !to) continue;
    const x1 = from.x + nodeW / 2;
    const y1 = from.y + nodeH;
    const x2 = to.x + nodeW / 2;
    const y2 = to.y;
    parts.push(
      '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 +
        '" stroke="#9aa0a6" stroke-width="2" marker-end="url(#arrow)" />'
    );
  }

  for (const node of data.nodes) {
    const pos = positions.get(node.id);
    if (!pos) continue;
    const fill = LANE_FILL[node.lane] || LANE_FILL.unknown;
    const stroke = LANE_STROKE[node.lane] || LANE_STROKE.unknown;
    const dash = node.lane === 'unknown' ? ' stroke-dasharray="4 3"' : '';
    parts.push(
      '<rect x="' + pos.x + '" y="' + pos.y + '" width="' + nodeW + '" height="' + nodeH +
        '" rx="8" fill="' + fill + '" stroke="' + stroke + '" stroke-width="2"' + dash + ' />'
    );
    parts.push(
      '<text x="' + (pos.x + 10) + '" y="' + (pos.y + 20) +
        '" font-family="monospace" font-size="13" font-weight="bold" fill="#000">' +
        escapeXml(node.id) + '</text>'
    );
    parts.push(
      '<text x="' + (pos.x + 10) + '" y="' + (pos.y + 36) +
        '" font-family="sans-serif" font-size="11" fill="#000">' +
        escapeXml(truncate(node.title, 26)) + '</text>'
    );
    parts.push(
      '<text x="' + (pos.x + 10) + '" y="' + (pos.y + 50) +
        '" font-family="sans-serif" font-size="10" fill="#333">(' + escapeXml(node.lane) + ')</text>'
    );
  }

  parts.push('</svg>');

  const altEdges = (data.edges || []).map((e) => e.from + ' -> ' + e.to).join('; ');
  const alt =
    'Sequence map: ' + data.nodes.length + ' bets' +
    (altEdges ? ', edges: ' + altEdges : ', no dependency edges');

  return { source: parts.join(''), alt, width, height };
}

export function register(on) {
  on('session.start', {}, async ($, e, next) => {
    try {
      await $.command.register({
        name: 'sequence-map',
        description: 'Render the sequencing board as a dependency map in a pane',
      });
    } catch {
      // Registering again on a hot reload replaces the command — never fatal.
    }
    return next(e);
  });

  on('command.run', { command: 'sequence-map' }, async ($, e, next) => {
    let parsed;
    try {
      // $.process.run's default cwd ("the session's working directory") does not reliably land on
      // the project root on every surface (observed empty/wrong-cwd runs on vscode) — pass
      // $.session.root() explicitly rather than trusting the default.
      const cwd = await $.session.root();
      const res = await $.process.run(['npx', '--no-install', 'oprim', 'sequence-map', '--json'], { cwd });
      parsed = JSON.parse((res.stdout || '').trim());
    } catch {
      return { text: 'Could not run oprim sequence-map — is oprim installed in this project?' };
    }
    if (!parsed || !Array.isArray(parsed.nodes) || parsed.nodes.length === 0) {
      return { text: 'oprim/sequence.yaml has no bets to map.' };
    }

    await $.store.set(STORE_KEY, parsed);
    await $.ui.open({ id: PANE_ID, title: 'Sequence map' });
    // $.store.set() alone doesn't re-run an already-open pane's ui.render hook — only specific
    // triggers do (open, resize, focus, invalidate). Ask for a redraw explicitly so a second
    // /sequence-map run against a still-open pane actually shows the fresh data.
    $.ui.invalidate('ui.render');

    return {
      text: 'Opened the sequence map pane.',
      context: [
        'Sequence map (Mermaid graph TD):\\n' + parsed.mermaid,
      ],
    };
  });

  on('ui.render', { component: 'Pane' }, async ($, e, next) => {
    if (e.requestId !== PANE_ID) return next(e);

    const table = $.ui.resolve(e);
    const { Box, Text, Button } = table;
    let data = null;
    try {
      data = await $.store.get(STORE_KEY);
    } catch {
      // Fall through to the empty state rather than failing the draw.
    }

    if (!data || !Array.isArray(data.nodes) || data.nodes.length === 0) {
      return h(Text, { dimColor: true }, 'No map yet — run /sequence-map again.');
    }

    const exportButton = h(Button, {
      label: 'Export .mmd',
      onPress: async () => {
        try {
          await $.fs.write('sequence-map.mmd', data.mermaid + '\\n');
          $.ui.toast('Wrote sequence-map.mmd');
        } catch {
          $.ui.toast('Could not write sequence-map.mmd');
        }
      },
    });

    if (e.surface !== 'terminal' && table.Svg) {
      const { Svg } = table;
      const graph = buildSvgGraph(data);
      return h(
        Box,
        { flexDirection: 'column', gap: 1 },
        h(Svg, { source: graph.source, alt: graph.alt, width: graph.width, height: graph.height }),
        exportButton
      );
    }

    const nodesById = new Map(data.nodes.map((node) => [node.id, node]));
    const outgoing = new Map();
    for (const edge of data.edges || []) {
      if (!outgoing.has(edge.from)) outgoing.set(edge.from, []);
      outgoing.get(edge.from).push(edge.to);
    }

    const layers = data.layers && data.layers.length > 0 ? data.layers : [data.nodes.map((n) => n.id)];

    const layerRows = layers.map((layerIds, layerIndex) => {
      const boxes = layerIds.map((id) => {
        const node = nodesById.get(id) || { id, title: id, lane: 'unknown' };
        const color = LANE_COLOR[node.lane] || 'gray';
        const successors = outgoing.get(id) || [];

        const children = [
          h(Text, { bold: true, color }, node.id),
          h(Text, { wrap: 'truncate-end' }, node.title),
          h(Text, { dimColor: true }, '(' + node.lane + ')'),
        ];
        if (successors.length > 0) {
          children.push(h(Text, { color, dimColor: true }, '-> ' + successors.join(', ')));
        }

        return h(
          Box,
          { key: id, flexDirection: 'column', borderStyle: 'round', borderColor: color, paddingX: 1, width: 28 },
          ...children
        );
      });

      return h(
        Box,
        { key: 'layer-' + layerIndex, flexDirection: 'row', flexWrap: 'wrap', gap: 1 },
        ...boxes
      );
    });

    return h(Box, { flexDirection: 'column', gap: 1 }, ...layerRows, exportButton);
  });
}
`;

export const CLAUDE_MODS_REGISTRY: ClaudeMod[] = [
  {
    id: 'spec-delta-drift-interceptor',
    title: 'Spec-delta drift interceptor',
    description:
      "Catches a bet's spec-delta MODIFIED/REMOVED requirement drifting from oprim/specs current truth at write time, instead of only at oprim validate/CI time.",
    shape: 'plugin',
    pluginFiles: [
      {
        path: '.claude-plugin/plugin.json',
        content:
          JSON.stringify(
            {
              name: 'spec-drift-check',
              description:
                "Catches a bet's spec-delta MODIFIED/REMOVED requirement drifting from oprim/specs current truth at write time.",
              version: '1.0.0',
            },
            null,
            2
          ) + '\n',
      },
      {
        path: 'hooks/hooks.json',
        content:
          JSON.stringify(
            {
              description:
                'Runs checkSpecDeltaDrift() on a bet spec-delta write and surfaces drift via a toast, at write time.',
              modules: ['./register.js'],
            },
            null,
            2
          ) + '\n',
      },
      {
        path: 'hooks/register.js',
        content: SPEC_DELTA_DRIFT_INTERCEPTOR_REGISTER,
      },
    ],
  },
  {
    id: 'cross-bet-conflict-live-check',
    title: 'Cross-bet conflict live check',
    description:
      "Surfaces two active bets touching the same requirement header in the same capability's spec delta at write time, instead of only at oprim validate/CI time.",
    shape: 'plugin',
    pluginFiles: [
      {
        path: '.claude-plugin/plugin.json',
        content:
          JSON.stringify(
            {
              name: 'cross-bet-conflict',
              description:
                "Surfaces two active bets touching the same requirement header in the same capability's spec delta at write time.",
              version: '1.0.0',
            },
            null,
            2
          ) + '\n',
      },
      {
        path: 'hooks/hooks.json',
        content:
          JSON.stringify(
            {
              description:
                'Runs checkCrossBetConflicts() on a bet spec-delta write and surfaces any overlap as a non-blocking notice, at write time.',
              modules: ['./register.js'],
            },
            null,
            2
          ) + '\n',
      },
      {
        path: 'hooks/register.js',
        content: CROSS_BET_CONFLICT_LIVE_CHECK_REGISTER,
      },
    ],
  },
  {
    id: 'sequence-map',
    title: 'Sequence map',
    description:
      "Renders oprim/sequence.yaml's blocked_by/unlocks edges as a dependency map in a pane (/sequence-map), with a Mermaid (.mmd) export.",
    shape: 'plugin',
    pluginFiles: [
      {
        path: '.claude-plugin/plugin.json',
        content:
          JSON.stringify(
            {
              name: 'sequence-map',
              description:
                "Renders oprim/sequence.yaml's blocked_by/unlocks edges as a dependency map in a pane, with a Mermaid export.",
              version: '1.0.0',
            },
            null,
            2
          ) + '\n',
      },
      {
        path: 'hooks/hooks.json',
        content:
          JSON.stringify(
            {
              description:
                "Registers /sequence-map, which renders the sequencing board's dependency edges in a pane and offers a Mermaid (.mmd) export.",
              modules: ['./register.js'],
            },
            null,
            2
          ) + '\n',
      },
      {
        path: 'hooks/register.js',
        content: SEQUENCE_MAP_REGISTER,
      },
    ],
  },
];

export function getClaudeMod(id: string): ClaudeMod | undefined {
  return CLAUDE_MODS_REGISTRY.find((mod) => mod.id === id);
}
