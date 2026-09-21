// Function-hooks module for the cross-bet-conflict-live-check mod — see claude-mods.ts.
// EARLY ACCESS: register(on)/$.ui.log/$.process.run are gated behind
// CLAUDE_CODE_ENABLE_FUNCTION_HOOKS and may change shape between Claude Code releases. A hooks
// module may only import its own files by relative path and "claude-code" — no Node builtins — so
// shelling out goes through $.process.run, not node:child_process.
//
// Reuses checkCrossBetConflicts() (via `oprim validate --json`) as the detection primitive rather
// than forking conflict-matching logic, so this live notice and `oprim validate`'s own check never
// drift apart. Surfaced via $.ui.log (always lands as a transcript line, unlike a toast) tagged with
// the check's own estimated criticality (low/medium/high, from estimateCriticality() in
// spec-delta.ts) rather than a generic "[cross-bet conflict]" label, so the author can tell a
// contradictory add-vs-remove from two edits that happen to agree without opening either delta.

const CONFLICT_LINE = /^spec-delta: (BET-\d+) and (BET-\d+) both touch "(.*)" in (.+) \[criticality: (low|medium|high)\]$/;

export function register(on) {
  on('tool.call', { tool: ['Write', 'Edit'] }, async ($, e, next) => {
    const result = await next(e);

    try {
      const filePath = String(e.file_path || '').replace(/\\/g, '/');
      const match = filePath.match(/oprim\/bets\/pending\/([^/]+)\/specs\/([^/]+)\/spec\.md$/);
      if (!match) return result;
      const [, betDir, capability] = match;
      const betIdMatch = betDir.match(/^(BET-\d+)/);
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
        $.ui.log(`[${criticality}] ${otherBet} also touches "${header}" in ${capability} — heads-up, not a blocker`);
      }
    } catch {
      // Graceful degradation — never error or block on live-check failure.
    }

    return result;
  });
}
