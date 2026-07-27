## Why

**Bet**: BET-026 (`oprim/bets/BET-026-pull-team-context-from-remote-oprim/bet-decision.md`)

Product decisions (PDRs, bets, strategy) are naturally org- or team-level, not repo-level, but oprim today only knows about the `oprim/` workspace inside the current repo. Teams need to pull shared company/team context — an oprim workspace living somewhere else — into the current project without cloning it in and without the resulting copy drifting from the source of truth. "Somewhere else" is deliberately broader than a git remote: it can be a remote git repository, or simply a local directory outside the current project's working dir (e.g. a sibling repo already checked out on the same machine). BET-024 (spec dir lifecycle) and BET-025 (config merge, which reserved an inert `store: {enabled: false}` key) have both landed, unblocking this work.

This capability set deliberately does not reuse OpenSpec's "store" terminology or its clone-and-manually-`git pull` sync model. A **remote context** here is just an oprim workspace bundled somewhere outside the current project's directory — reached either over git or by local filesystem path — and resolved fresh on demand rather than kept as a stale manual checkout.

A project can register multiple remote contexts. Without a way to describe what each one is *about*, an agent (or user) has no way to decide which source is relevant to a given task short of fully resolving every one of them every time — expensive for git sources and noisy regardless. Each remote context therefore carries a description (canonical, self-declared by the source itself) that can be listed cheaply, without a full resolution, so an agent can scan first and pull selectively.

## What Changes

- Add a `remote-context-identity` capability: a repo/dir can declare itself a citable remote context via an identity file, so other projects have something stable to reference and validate against, regardless of whether it's reached over git or by local path. The identity file carries a canonical `description` of what the remote context is, set via `oprim context init --description "<text>"`.
- Add a `remote-context-registration` capability: a new `oprim context register --git <url> --name <name>` or `oprim context register --local <path> --name <name>` command adds a source entry to the current project's config, as a convenience over hand-editing YAML. An optional `--description "<text>"` stores a local note (why this project registered it), distinct from the source's own canonical description. Registration immediately performs an identity-only fetch and displays the target's canonical description as confirmation, rather than requiring a separate `oprim context list` call to see it.
- Add a `remote-context-resolution` capability: resolves each configured source. Git sources are fetched on demand via a shallow git fetch into an oprim-managed local cache (never a persistent user-managed clone the user must remember to `git pull`). Local-path sources are read live and directly from the filesystem — no cache, no fetch, always current since it's already local disk. Either way, a full resolution pulls the whole referenced oprim workspace (no path- or capability-scoped partial references in this bet). A separate, lightweight identity-only fetch mode (fetching just the identity file, not the whole workspace) supports listing and doctor checks without the cost of a full resolution.
- Add an `oprim-context-command` capability: `oprim context` (bare) assembles and prints resolved remote context content on demand, optionally scoped with `--source <name>`. `oprim context init` declares the *current* repo/dir as a citable remote context (writes its identity file). Remote context is never auto-injected into CLAUDE.md or agent instructions during `oprim update` — this keeps oprim's existing "declarations, not automation" posture.
- Add a `remote-context-guided-init` capability: an `oprim-context-init` Claude Code skill (`/oprim:context-init`), following the same pattern as the existing `oprim-bet`/`oprim-pdr` skills, conversationally helps the user draft a description before calling `oprim context init` — so a remote context isn't left without a description understandable by humans and agents alike.
- Add a `remote-context-listing` capability: `oprim context list` prints name, kind (git/path), canonical description, and local note (if set) for every registered source — using the lightweight identity-only fetch, never a full resolution — so an agent can decide which source(s) are relevant before pulling full content via `oprim context --source <name>`.
- Add a `remote-context-doctor-validation` capability: `oprim doctor` gains checks that validate each configured source — for git sources: remote reachability, valid identity, cache resolution; for local-path sources: path existence, valid identity, name match — with pasteable fix guidance on failure. These checks use the same lightweight identity-only fetch as listing, not a full resolution.
- **MODIFIED** `config-schema-merge`: the existing inert `store: {enabled: false}` key (added by BET-025) is superseded by a new `remote_context: {enabled: false, sources: []}` key (`sources` entries are `{name, git}` or `{name, path}`) — named `remote_context` rather than reusing/extending `store` to avoid the "store" terminology, and distinct from the pre-existing free-text `context: ""` key.
- Worksets (OpenSpec's personal, machine-local, uncommitted multi-folder groupings) remain explicitly out of scope.

## Capabilities

### New Capabilities
- `remote-context-identity`: declaring a repo/dir as a citable remote context via an identity file (name, version, description), used for name-match validation and for describing what the context is about, regardless of source type (git or local path).
- `remote-context-registration`: `oprim context register --git <url>|--local <path> --name <name> [--description <text>]` — a convenience command that adds a source entry to the current project's `remote_context.sources` config list, and immediately performs an identity-only fetch to display the target's canonical description as confirmation.
- `remote-context-resolution`: resolving a configured source's full oprim workspace content — on-demand git fetch to a managed cache for git sources; live direct filesystem read for local-path sources — plus a lightweight identity-only fetch mode used by registration, listing, and doctor.
- `oprim-context-command`: `oprim context` prints assembled resolved content from all configured sources (or one, via `--source`); `oprim context init` writes the current repo/dir's own identity file.
- `remote-context-listing`: `oprim context list` prints name, kind, description, and local note for every registered source via the lightweight identity-only fetch, without fully resolving any of them.
- `remote-context-guided-init`: the `oprim-context-init` skill conversationally drafts a description with the user before calling `oprim context init`.
- `remote-context-doctor-validation`: `oprim doctor` checks that validate each configured source (reachable/exists, valid identity, resolvable) and emit pasteable fix commands on failure.

### Modified Capabilities
- `config-schema-merge`: replaces the inert `store: {enabled: false}` key with an active `remote_context: {enabled: boolean, sources: [{name, git} | {name, path}]}` key, resolved by the capabilities above. `oprim update`'s additive-merge behavior for other schema keys is unaffected.

## Impact

- `packages/cli/src/lib/templates.ts` — `configTemplate()` replaces the `store:` block with a `remote_context:` block.
- `packages/cli/src/commands/` — new `context` command group (`oprim context`, `oprim context init`, `oprim context register`, `oprim context list`); extend `doctor` command with remote-context checks.
- `packages/cli/src/lib/` — new module(s) for remote-context resolution (git fetch-to-cache for git sources, direct read for local-path sources, plus a lightweight identity-only fetch mode) and context assembly across the local root plus resolved remote sources.
- `packages/cli/src/cli.ts` — register the new `context` subcommands.
- `packages/cli/src/lib/install-agent.ts` — new `oprim-context-init` skill content (string literal, mirroring how `oprim-bet`/`oprim-pdr` skills are authored) installed to `.claude/skills/` and wired to the `/oprim:context-init` command wrapper.
- No dependency on OpenSpec's own stores-beta implementation; this is an oprim-native model with different terminology and a broader source model (git or local path).
