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
              name: 'spec-delta-drift-interceptor',
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
];

export function getClaudeMod(id: string): ClaudeMod | undefined {
  return CLAUDE_MODS_REGISTRY.find((mod) => mod.id === id);
}
