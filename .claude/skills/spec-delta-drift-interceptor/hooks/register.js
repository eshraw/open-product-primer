// Function-hooks module for the spec-delta-drift-interceptor mod — see claude-mods.ts.
// EARLY ACCESS: register(on)/$.ui.log/$.process.run are gated behind
// CLAUDE_CODE_ENABLE_FUNCTION_HOOKS and may change shape between Claude Code releases. A hooks
// module may only import its own files by relative path and "claude-code" — no Node builtins — so
// shelling out goes through $.process.run, not node:child_process.
//
// Surfaces the drift as a transcript line via $.ui.log rather than $.ui.toast: a toast is a
// transient overlay whose rendering depends on the session's UI surface, while $.ui.log's default
// destination ("to: transcript") always lands as a plain line every surface shows — see the
// anthropics/claude-code `mods/diff` example, which uses the same call for its panel-toggle
// messages ("Diff panel shown"/"Diff panel hidden").

export function register(on) {
  on('tool.call', { tool: ['Write', 'Edit'] }, async ($, e, next) => {
    const result = await next(e);

    try {
      const filePath = String(e.file_path || '').replace(/\\/g, '/');
      const match = filePath.match(/oprim\/bets\/pending\/[^/]+\/specs\/([^/]+)\/spec\.md$/);
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
        (c) => c.name && c.name.startsWith('spec-delta:') && c.name.includes(`in ${capability} `) && !c.pass
      );
      if (drift.length === 0) return result;

      const reason = drift.map((c) => `${c.name}${c.note ? ` (${c.note})` : ''}`).join('; ');
      $.ui.log(`⚠ Spec-delta drift in ${capability}: ${reason}`);
    } catch {
      // Graceful degradation — never error or block on interceptor failure.
    }

    return result;
  });
}
