// Static registry of installable Claude Code function-hook "mods" — see
// oprim/bets/pending/BET-051-spec-delta-drift-interceptor-mod/design.md. Both `oprim init`'s
// mod-selection prompt and the `oprim claude-mods` command read from this single registry, so a
// future mod (BET-052–066) is added here once rather than duplicated per entry point.

export interface ClaudeModHookFile {
  filename: string; // written to .claude/hooks/<filename>
  content: string;
  event: 'PreToolUse' | 'PostToolUse' | 'UserPromptSubmit' | 'Stop';
  matcher?: string;
  command: string; // registered in .claude/settings.json under hooks[event]
}

export interface ClaudeMod {
  id: string;
  title: string;
  description: string;
  hookFiles: ClaudeModHookFile[];
}

// PostToolUse hook: on a Write/Edit to a bet's specs/<capability>/spec.md delta, shells out to
// `oprim validate --json` (already runs checkSpecDeltaDrift()) and surfaces any MODIFIED/REMOVED
// drift for that capability inline, at write time instead of only at validate/CI time. Silently
// no-ops on any failure (oprim not resolvable, malformed hook input, etc.) — this is a
// write-time convenience on top of `oprim validate`, never a second source of required failures.
const SPEC_DELTA_DRIFT_INTERCEPTOR_SCRIPT = `#!/usr/bin/env node
// PostToolUse hook (Write|Edit) — see claude-mods.ts's spec-delta-drift-interceptor entry.

let raw = '';
process.stdin.on('data', (chunk) => { raw += chunk; });
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(raw || '{}');
    const filePath = input.tool_input && input.tool_input.file_path;
    if (!filePath) return;

    const match = String(filePath).replace(/\\\\/g, '/').match(
      /oprim\\/bets\\/pending\\/[^/]+\\/specs\\/([^/]+)\\/spec\\.md$/
    );
    if (!match) return;
    const capability = match[1];

    const { execSync } = require('child_process');
    let output;
    try {
      output = execSync('npx --no-install oprim validate --json', {
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
    } catch (err) {
      // validate exits non-zero when a required check fails — stdout still carries the report
      output = err && err.stdout ? err.stdout.toString() : null;
    }
    if (!output) return;

    const report = JSON.parse(output);
    const drift = (report.checks || []).filter(
      (c) => c.name && c.name.startsWith('spec-delta:') && c.name.includes(\`in \${capability} \`) && !c.pass
    );
    if (drift.length === 0) return;

    const reason = drift.map((c) => \`- \${c.name}\${c.note ? \` (\${c.note})\` : ''}\`).join('\\n');
    process.stdout.write(JSON.stringify({
      decision: 'block',
      reason: \`Spec-delta drift detected in \${capability}:\\n\${reason}\`,
    }) + '\\n');
  } catch {
    // Graceful degradation — never error or block on interceptor failure.
  }
});
`;

export const CLAUDE_MODS_REGISTRY: ClaudeMod[] = [
  {
    id: 'spec-delta-drift-interceptor',
    title: 'Spec-delta drift interceptor',
    description:
      "Catches a bet's spec-delta MODIFIED/REMOVED requirement drifting from oprim/specs current truth at write time, instead of only at oprim validate/CI time.",
    hookFiles: [
      {
        filename: 'spec-delta-drift-interceptor.js',
        content: SPEC_DELTA_DRIFT_INTERCEPTOR_SCRIPT,
        event: 'PostToolUse',
        matcher: 'Write|Edit',
        command: 'node ".claude/hooks/spec-delta-drift-interceptor.js"',
      },
    ],
  },
];

export function getClaudeMod(id: string): ClaudeMod | undefined {
  return CLAUDE_MODS_REGISTRY.find((mod) => mod.id === id);
}
