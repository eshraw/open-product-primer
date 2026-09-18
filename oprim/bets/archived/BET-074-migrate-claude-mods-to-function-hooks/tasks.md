# Tasks: BET-074 (claude-mods)

## 1. Registry entry shape
- [x] 1.1 Extend the registry in `packages/cli/src/lib/claude-mods.ts` to accept either the existing `ClaudeModHookFile` shape (`ClaudeModClassic`) or a new plugin shape (`ClaudeModPlugin`: manifest + `hooks.json` + `register.js` module)
- [x] 1.2 Add a `shape` discriminant + `isPluginMod()` type guard so install code can branch on which shape an entry declares

## 2. Plugin-engine install path
- [x] 2.1 Implement install for a plugin-shaped mod entry: write its `pluginFiles` (manifest + `hooks.json` + `register.js`) under `.claude/skills/<mod.id>/`, picked up via the skills-directory auto-load convention — not `.claude/settings.json`'s `hooks` block
- [x] 2.2 Implement uninstall for a plugin-shaped mod entry: `fs.rmSync` only that mod's `.claude/skills/<mod.id>/` directory, leaving other mods' and oprim's own hooks untouched
- [x] 2.3 Confirm classic `ClaudeModHookFile` entries continue to install/uninstall via the existing `.claude/settings.json` merge path, unchanged

## 3. Wiring into existing commands
- [x] 3.1 `oprim init`'s mod-selection prompt installs a selected entry via the shape-appropriate path (both route through `applyClaudeModsSelection`)
- [x] 3.2 `oprim claude-mods` add/remove flows install/uninstall via the shape-appropriate path (same shared function)

## 4. Migrate the drift-interceptor mod to the plugin shape
- [x] 4.1 Rewrite `spec-delta-drift-interceptor`'s registry entry as `shape: 'plugin'`, dropping the classic `hookFiles` shell-command hook
- [x] 4.2 Port the interceptor's drift-check logic into a `register(on)` module hooking `tool.call` for `Write`/`Edit`, still shelling out to `oprim validate --json` and filtering `spec-delta:` checks by capability
- [x] 4.3 Surface drift via `$.ui.toast(...)` instead of the classic `{decision: 'block', reason}` JSON protocol
- [x] 4.4 Update `claude-mods.test.ts` and `integration.test.ts` to assert the new `.claude/skills/<id>/` plugin layout instead of the old `.claude/hooks/*.js` + settings.json hook entry
