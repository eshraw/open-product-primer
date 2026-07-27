## 1. Config schema (remote_context.sources)

- [x] 1.1 Update `configTemplate()` in `packages/cli/src/lib/templates.ts` to replace the `store:` block with `remote_context: {enabled: false, sources: []}`
- [x] 1.2 Update `oprim update`'s additive schema-merge logic to insert the missing `remote_context` key (with `sources: []`) without touching or removing any pre-existing `store:` key some projects may still have
- [x] 1.3 Add/extend config parsing types to include `remote_context.sources: ({name: string, git: string, description?: string} | {name: string, path: string, description?: string})[]`
- [x] 1.4 Add tests: fresh init includes `remote_context: {enabled: false, sources: []}`; update adds `remote_context` to a config that still has the old inert `store: {enabled: false}` (leaving `store:` untouched); update is a no-op when schema is current; user-set values are preserved

## 2. Remote context identity

- [x] 2.1 Implement `oprim context init [--description <text>]`, which writes `.oprim-context/context.yaml` with `{name, version, description?}` at the project root
- [x] 2.2 Guard against overwriting an existing `.oprim-context/context.yaml` — no-op with a message if already present
- [x] 2.3 Register the command under the `context` command group in `packages/cli/src/cli.ts`
- [x] 2.4 Add tests for: first-time init with a description, first-time init without a description, already-initialized no-op behavior

## 3. Remote context registration

- [x] 3.1 Implement `oprim context register --git <url> --name <name> [--description <text>]`: appends `{name, git, description?}` to `remote_context.sources` and sets `enabled: true`
- [x] 3.2 Implement `oprim context register --local <path> --name <name> [--description <text>]`: appends `{name, path, description?}` to `remote_context.sources` and sets `enabled: true`
- [x] 3.3 Reject invocations with both `--git` and `--local`, or neither, with a usage error
- [x] 3.4 Reject registration when `name` already exists in `remote_context.sources`, without modifying the existing entry
- [x] 3.5 After appending the entry, perform an identity-only fetch of the target and print its canonical `description` (or a name-mismatch warning) as confirmation
- [x] 3.6 Handle identity-only fetch failure at registration time (unreachable remote, missing path, no identity file) by still keeping the entry and printing a clear warning instead of the description, suggesting `oprim context list`/`oprim doctor`
- [x] 3.7 Handle the case where the identity-only fetch succeeds but the target has no canonical description — confirm registration and note the absence, not as a failure
- [x] 3.8 Register the command under the `context` command group in `packages/cli/src/cli.ts`
- [x] 3.9 Add tests for: git registration (with/without local description), local-path registration (with/without local description), both-flags error, neither-flag error, duplicate-name error, immediate fetch success (description shown), immediate fetch failure (entry still added, warning shown), target with no description

## 4. Remote context resolution

- [x] 4.1 Design and implement the oprim-managed cache directory layout for git sources (e.g. `~/.oprim/remote-context-cache/<name>-<hash>/`)
- [x] 4.2 Implement shallow git fetch/clone-on-first-resolve for a `git`-kind `remote_context.sources` entry
- [x] 4.3 Implement re-fetch-in-place for subsequent resolutions of an already-cached git source, with a throttle window to avoid redundant fetches on rapid repeated invocations
- [x] 4.4 Implement last-known-good fallback with a staleness flag when a git fetch fails but a prior cache exists
- [x] 4.5 Implement hard failure (clear error, no fabricated content) when a git fetch fails and no prior cache exists
- [x] 4.6 Implement direct live read (no cache, no fetch) for `path`-kind `remote_context.sources` entries
- [x] 4.7 Implement hard failure for a `path` source whose configured directory does not exist or is not readable
- [x] 4.8 Implement the lightweight identity-only fetch mode: a targeted single-file read of `.oprim-context/context.yaml` for `git` sources (no full clone), and a direct single-file read for `path` sources (no full workspace read)
- [x] 4.9 Cross-check resolved `.oprim-context/context.yaml` `name` against the referencing source's declared `name` for both source kinds; surface a mismatch warning without blocking resolution
- [x] 4.10 Add tests covering: first git resolution, cached git re-resolution, throttle behavior, git fetch failure with/without prior cache, local-path resolution, local-path missing-directory failure, identity-only fetch for both source kinds (success and failure), and name mismatch warning for both source kinds

## 5. oprim context command

- [x] 5.1 Implement bare `oprim context`: resolve every `remote_context.sources` entry via the resolution module and print assembled oprim content (decisions, bets, specs) labeled by source name
- [x] 5.2 Handle the no-sources-configured case with a clear message and success exit
- [x] 5.3 Implement `--source <name>` scoping flag, including the not-found case (non-zero exit, clear message)
- [x] 5.4 Confirm `oprim update` and CLAUDE.md/AGENTS.md generation paths are untouched by this capability — no remote content written to agent instruction files
- [x] 5.5 Add tests for: multi-source assembly (mixed git and local-path), empty-sources case, `--source` scoping (match and no-match), and confirming `oprim update` output is unaffected

## 6. Remote context listing

- [x] 6.1 Implement `oprim context list`: iterate `remote_context.sources`, perform an identity-only fetch for each, and print name, kind, canonical description, and local description note (if set)
- [x] 6.2 Handle sources with no canonical description with an explicit "no description set" indicator rather than omitting the row
- [x] 6.3 Handle a per-source identity-only fetch failure by reporting that row as unresolved with the error, while still listing all other sources successfully
- [x] 6.4 Handle the no-sources-configured case with a clear message and success exit
- [x] 6.5 Register the command under the `context` command group in `packages/cli/src/cli.ts`
- [x] 6.6 Add tests for: listing multiple sources with descriptions, a source with no description, a source whose identity-only fetch fails (others still listed), and the empty-sources case

## 7. Doctor validation

- [x] 7.1 Extend the `doctor` command to iterate `remote_context.sources` and, for `git` sources, check remote reachability, presence/validity of `.oprim-context/context.yaml`, and cache resolvability — using the identity-only fetch, not a full resolution
- [x] 7.2 Extend `doctor` to, for `path` sources, check path existence/readability and presence/validity of `.oprim-context/context.yaml` via the identity-only fetch
- [x] 7.3 Report unreachable git remotes and missing local paths as distinct failure types, each with a pasteable fix/retry command
- [x] 7.4 Report missing-identity failures distinctly from unreachable/missing-path failures, for both source kinds
- [x] 7.5 Report never-resolved sources distinctly, suggesting `oprim context` as the fix
- [x] 7.6 Add tests for: all-healthy, unreachable git remote, missing local path, missing identity (both kinds), never-resolved source, and confirming doctor checks never trigger a full resolution

## 8. Guided context-init skill

- [x] 8.1 Author the `oprim-context-init` skill content as a string literal in `packages/cli/src/lib/install-agent.ts`, following the same structure as the existing `oprim-bet`/`oprim-pdr` skill content
- [x] 8.2 Skill flow: ask the user a short set of questions about what the workspace covers and who it's for, draft a description from the answers, let the user revise it, then invoke `oprim context init --description "<final text>"`
- [x] 8.3 Skill checks for an existing `.oprim-context/context.yaml` first and reports it already exists rather than re-running the drafting flow
- [x] 8.4 Support an explicit opt-out path: if the user declines drafting, warn clearly that the resulting context will show as description-less in `oprim context list`, then call `oprim context init` without `--description`
- [x] 8.5 Wire the `/oprim:context-init` command wrapper and install it to `.claude/skills/` via `oprim init`/`oprim update`, matching how other `/oprim:*` skills are installed
- [x] 8.6 Add tests: skill installs correctly via `oprim init`/`oprim update`; manual/documented verification of the guided drafting conversation and opt-out path (skill content itself isn't unit-testable the way CLI commands are)

## 9. Docs and wiring

- [x] 9.1 Update CLI help text / README for the new `oprim context`, `oprim context init`, `oprim context register`, and `oprim context list` commands, and document `/oprim:context-init`
- [x] 9.2 Link this OpenSpec change and its capabilities back into `oprim/bets/BET-026-.../bet-decision.md` Links section (done as part of promotion, verify still accurate after implementation)
- [x] 9.3 Run full test suite (`npm test` in `packages/cli/`) and confirm no regressions in existing config-schema-merge or doctor tests
