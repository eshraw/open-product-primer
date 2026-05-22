## 1. Dependencies

- [x] 1.1 Add `@inquirer/prompts` to `packages/cli/package.json` dependencies
- [x] 1.2 Run `npm install` and verify TypeScript types resolve

## 2. Shared Skill Installation Helper

- [x] 2.1 Extract per-agent skill installation from `update.ts` into `packages/cli/src/lib/install-agent.ts` — expose `installAgentSkills(agent: 'claude' | 'cursor', projectRoot: string): void`
- [x] 2.2 Update `update.ts` to call `installAgentSkills` instead of the inline logic
- [x] 2.3 Add directory creation logic in `installAgentSkills` — create `.claude/skills/`, `.claude/commands/oprim/` (or `.cursor/` equivalents) if absent

## 3. primer/config.yaml Schema

- [x] 3.1 Add optional `agents: string[]` field to the `configTemplate` in `packages/cli/src/lib/templates.ts` — default to empty array `[]` on first write
- [x] 3.2 Add `readAgentsFromConfig(projectRoot: string): string[] | null` helper in `packages/cli/src/lib/detect.ts` — returns `null` when field is absent (signals legacy fallback)
- [x] 3.3 Add `writeAgentsToConfig(agents: string[], projectRoot: string): void` helper that reads, updates, and writes back `primer/config.yaml` without clobbering other fields

## 4. oprim init — Agent Selection

- [x] 4.1 Add `--agent <name>` option (repeatable) to the `init` command in `init.ts`
- [x] 4.2 After scaffolding `primer/`, check if `--agent` flags were passed — if so, use them as the selected agents list
- [x] 4.3 If no `--agent` flags and no existing `agents:` in config, show the `@inquirer/prompts` checkbox prompt with Claude Code and Cursor as options
- [x] 4.4 If `agents:` already exists in config (re-run), skip the prompt and re-install for the stored list
- [x] 4.5 Validate `--agent` values against the supported list (`claude`, `cursor`); exit with non-zero and list supported names if unknown value is passed
- [x] 4.6 Call `writeAgentsToConfig` with the resolved selection
- [x] 4.7 Call `installAgentSkills` for each selected agent; emit a notice if the agent's config directory was created
- [x] 4.8 When no agents are selected, print a suggestion to run `oprim update` after configuring an AI tool
- [x] 4.9 Update the final summary output in `init.ts` to show which agents were installed

## 5. oprim update — Config-Aware Installation

- [x] 5.1 At the start of `update.ts` action, call `readAgentsFromConfig` to check for a declared agent list
- [x] 5.2 If `agents:` is non-null and non-empty, iterate over config-declared agents and call `installAgentSkills` for each (skip directory detection)
- [x] 5.3 If `agents:` is an empty list `[]`, print "No agents configured — run `oprim init` to select agents" and exit
- [x] 5.4 If `agents:` is null (field absent), keep the existing directory-detection fallback behavior unchanged

## 6. oprim doctor — Agent Environment Validation

- [x] 6.1 In `doctor.ts`, call `readAgentsFromConfig` to get declared agents
- [x] 6.2 If `agents:` is present, check that each declared agent's config directory exists; report fail for any missing directory
- [x] 6.3 If `agents:` is absent, skip the directory check (legacy behavior unchanged)
- [x] 6.4 Add a passing check line to doctor output when all declared agent directories are present

## 7. Tests

- [x] 7.1 Unit test: `readAgentsFromConfig` returns `null` when field absent, array when present, empty array for `agents: []`
- [x] 7.2 Unit test: `writeAgentsToConfig` updates `agents:` without clobbering other config fields
- [x] 7.3 Unit test: `installAgentSkills` creates directories and writes expected files for `claude` and `cursor`
- [x] 7.4 Integration test: `oprim init --agent claude` scaffolds primer and installs Claude skills without a prompt
- [x] 7.5 Integration test: `oprim init --agent unknown` exits non-zero with error message
- [x] 7.6 Integration test: `oprim update` on a project with `agents: [claude]` installs only Claude even when `.cursor/` exists
