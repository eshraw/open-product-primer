## Context

oprim workspaces are currently repo-scoped: `oprim/decisions/`, `oprim/bets/`, `oprim/specs/` all live inside the one repo `oprim init` was run in. Product decisions are frequently org- or team-level rather than repo-level, so a team wants to declare (from any project) "here is our shared decisions/specs context" and read it, read-only, from every other project — without copying it in and risking that copy going stale relative to the source. The source can be a remote git repository, or simply another directory on the same machine outside the current project's working dir (e.g. a sibling repo already checked out locally) — both are just a "remote context": an oprim workspace bundled somewhere other than the current project's directory.

OpenSpec shipped a proven adjacent model (stores-beta): a store is a git repo with a `.openspec-store/store.yaml` identity file; a consuming repo lists `references:` in its config; `openspec doctor` validates registration. Critically, OpenSpec's sync model requires the user to manually clone the store repo and run `git pull` themselves — OpenSpec itself "never clones, pulls, or pushes" — and it only models git remotes, not local directories. Neither fits this bet: the "without cloning" requirement rules out a manual persistent clone, and the local-directory case (a project referencing a sibling repo it already has on disk) isn't a git operation at all. This design borrows the identity/doctor shape but replaces the sync mechanism, drops OpenSpec's "store" terminology entirely, and generalizes the source to be either a git remote or a local path.

`store: {enabled: false}` already exists in `oprim/config.yaml` (BET-025), reserved as inert. This bet replaces it with an active `remote_context:` key (distinct from `store:` and from the pre-existing free-text `context: ""` key).

## Goals / Non-Goals

**Goals:**
- A project can mark itself as a citable remote context (an identity file), regardless of whether other projects will reach it over git or by local path.
- A project can register one or more sources — each a remote git repo or a local directory outside the working dir — in `oprim/config.yaml` under `remote_context.sources`.
- Git sources resolve fresh from the remote on demand — no persistent local clone the user must manually keep in sync.
- Local-path sources resolve by reading the target directory directly and live — no cache, no staleness, since it's already on local disk.
- Users/agents can pull assembled remote context into the current session via one command (`oprim context`).
- An agent (or user) can discover what each registered source is about — cheaply, without a full resolution — so it can decide which source(s) are relevant before pulling full content.
- Registering a source immediately surfaces its canonical description, so the user doesn't need a separate `list` call to see what they just registered.
- Initializing a remote context is guided so it isn't left without a description — a description-less context is much less useful to `oprim context list` and to any agent/human deciding whether to pull it.
- `oprim doctor` can diagnose broken/unreachable/missing sources with actionable fix output.

**Non-Goals:**
- Worksets (personal, machine-local, uncommitted multi-folder groupings) — different problem, not requested by this bet.
- Path- or capability-scoped partial sources — a source pulls the whole remote context; sub-scoping is a future bet if needed.
- Auto-injecting remote context into CLAUDE.md/agent instructions during `oprim update` — context surfaces only via the explicit `oprim context` command.
- Write access to remote contexts — sources are strictly read-only.
- Private-repo auth flows beyond what the user's existing local git/SSH config already provides (no new credential storage).

## Decisions

### 1. Fetch mechanism: on-demand shallow git fetch into a managed cache for git sources; live direct read for local-path sources
A git source resolves by shallow-cloning (`git clone --depth 1`) or updating the target's remote into a cache directory oprim owns (e.g. `~/.oprim/remote-context-cache/<name>-<hash>/`), re-fetching when `oprim context` or `oprim doctor` runs (throttled, e.g. skip re-fetch if last fetch was under N minutes ago). The user never manages this clone directly and never runs `git pull` on it themselves. A local-path source has no cache step at all — it is read directly from the configured path every time, since it's already local disk and inherently as fresh as the filesystem.
- **Alternative considered**: mirror OpenSpec exactly (user clones + registers a path, oprim reads whatever's on disk, for git sources). Rejected — reintroduces the exact staleness risk this bet exists to avoid, and pushes a manual sync step onto the user that they can forget.
- **Alternative considered**: fetch via GitHub API instead of git. Rejected as the default — would only work for GitHub-hosted sources, excluding GitLab/Bitbucket/self-hosted git remotes that `git fetch` handles uniformly.
- **Alternative considered**: copy local-path sources into the same cache dir as git sources, for a uniform code path. Rejected — pointless copying of data that's already local and instantly readable; the resolution layer instead branches on source kind (`git` vs `path`) rather than forcing both through one cache abstraction.

### 2. Source granularity: whole-context sources only
A `remote_context.sources` entry is `{name, git}` or `{name, path}` — no path-within-source or capability filter. Resolution always pulls the referenced context's entire published oprim workspace (decisions, bets, specs).
- **Alternative considered**: capability- or sub-path-scoped sources. Rejected for v1 — adds config surface and resolution complexity without a validated need; can be layered on later without breaking the schema (an optional sub-path filter could be added additively per source).

### 3. Context surfacing: dedicated `oprim context` command, not auto-injection
`oprim context` resolves every configured source and prints the assembled remote oprim content (optionally scoped by `--source <name>`) to stdout for the user or agent to consume on demand.
- **Alternative considered**: fold resolved remote content into CLAUDE.md/agent instructions automatically on `oprim update`. Rejected — makes agent context size and freshness implicit and would silently grow every agent's prompt; conflicts with oprim's existing "declarations, not automation" stance.

### 4. Remote context identity: minimal identity file, shared by both source kinds, carrying a canonical description
`oprim context init --description "<text>"` writes an identity file (e.g. `.oprim-context/context.yaml` with `{name, version, description}`) at the project root, regardless of whether the project will later be referenced over git or by local path. Every source — git or local path — is cross-checked by `name` against this identity file after resolution, so name-match validation is uniform across both source kinds rather than only applying to git. `description` is the source's own self-declared statement of what it is (e.g. "Acme platform decisions and specs — auth, billing, infra"), authored once by whoever runs `init`, not re-typed by every project that later references it.
- **Alternative considered**: skip the identity file for local-path sources, since the referencing project already knows exactly what directory it's pointing at. Rejected — dropping identity for one source kind means doctor/name-match checks would need two different code paths, and a local path can still be misconfigured (pointed at the wrong sibling repo) just as a git URL can.
- **Alternative considered**: only let the referencing project describe a source (a purely local annotation), skipping a canonical self-description. Rejected as the sole mechanism — every project referencing the same source would have to independently guess/re-describe what it contains, and descriptions would drift from each other and from the source's actual content. A local annotation is still supported additively (decision 8) for consumer-specific notes, but the canonical description lives with the source itself.

### 5. Lightweight identity-only fetch, distinct from full resolution
Listing (`oprim context list`) and doctor's identity/reachability checks use a separate, cheaper resolution mode that fetches or reads only the identity file — not the source's full oprim workspace. For a git source this is a targeted single-file read (e.g. `git show <ref>:.oprim-context/context.yaml`, or an equivalent narrow fetch) rather than a shallow clone of the whole repo. For a local-path source it is trivially just reading the identity file directly, since the full workspace is already local and costless to statistically stat — but the code path still only reads the identity file, not the whole `oprim/` tree, to keep behavior consistent and predictable across source kinds.
- **Alternative considered**: have listing/doctor reuse the full-resolution cache, populated only after a full `oprim context` pull. Rejected as the default — it means a source shows nothing (or stale info) in `list`/`doctor` until it has been fully resolved at least once, defeating the point of a cheap pre-check that should work before any full pull has happened.

### 6. Local annotation on registration is a separate, optional field from the canonical description
`oprim context register --git <url>|--local <path> --name <name> [--description <text>]` accepts an optional `--description`, stored as a `description` field on the `remote_context.sources` entry in the *referencing* project's own config. This is the consumer's own note (e.g. "why we registered this" or a locally relevant summary) and is distinct from — and never overwrites — the canonical `description` read from the source's own identity file. `oprim context list` shows both when present: the canonical description (fetched from the source) and the local note (read straight from local config, no fetch needed).

### 7. Registration convenience command, separate from identity and from resolution/printing
`oprim context register --git <url> --name <name>` or `oprim context register --local <path> --name <name>` appends a `{name, git}` or `{name, path}` entry to the current project's `remote_context.sources`, as a shortcut over hand-editing `oprim/config.yaml`. This is distinct from `oprim context init` (declares *this* project citable) and from bare `oprim context` (prints resolved content from already-registered sources).

### 8. Config schema: replace the inert `store:` key with an active `remote_context:` key
```yaml
remote_context:
  enabled: false
  sources: []
  # - name: "acme-platform"
  #   git: "git@github.com:acme/platform-oprim.git"
  #   description: "Local note: primary platform decisions, check before infra bets"
  # - name: "sibling-repo"
  #   path: "../sibling-repo"
```
The key is named `remote_context` — not `store` (avoids reusing OpenSpec's terminology) and not `context` (already taken by the pre-existing free-text project-description field). `oprim update`'s additive schema-merge (shipped in BET-025) adds this key/its sub-keys to existing configs without touching any user-set value; the old `store:` key is dropped from the template going forward since nothing shipped depended on its (deliberately inert) presence.

### 9. Registration performs its own identity-only fetch immediately, and never blocks on it failing
`oprim context register` calls the identity-only fetch (decision 5) right after appending the new entry, and prints the resolved canonical description (or a clear warning) as part of the command's own output. If the fetch fails — unreachable remote, missing local path, or no identity file present — the entry is still added; only the confirmation output degrades to a warning. This mirrors the rest of the design's stance that transient network/filesystem issues should never block a config edit that would otherwise succeed (the same reasoning behind resolution's last-known-good fallback and doctor's non-fatal checks).
- **Alternative considered**: reject registration outright if the immediate identity-only fetch fails. Rejected — would make a flaky network moment (or a not-yet-`init`'d local sibling repo the user is about to set up) block what is otherwise a valid local config change; `oprim doctor`/`oprim context list` already exist to catch and surface a persistently broken source afterward.

### 10. A guided skill drafts the description at init time, rather than leaving it to convention
`oprim context init` itself keeps `--description` optional (needed for scripting/non-interactive use and to match the CLI-level contract), but the primary way a user is expected to initialize a remote context is through a new `oprim-context-init` Claude Code skill (`/oprim:context-init`) that asks a short set of questions (what does this workspace cover, who is it for) and drafts the description before calling the CLI — the same shape as this repo's existing `oprim-bet` and `oprim-pdr` skills, which already guide artifact authoring rather than leaving users to fill in a bare template. The skill lets the user opt out (still calling `init` without a description) but warns clearly that the result will show as description-less in `oprim context list`.
- **Alternative considered**: make `--description` a required CLI flag. Rejected — this would be the only oprim CLI command that hard-fails without an agent/skill layer in front of it, breaking the established convention that guided authoring lives in the skill, not as a raw CLI constraint (see `oprim-bet`/`oprim-pdr`, which also don't hard-require every field at the CLI level).

## Risks / Trade-offs

- **[Risk]** Remote resolution is slow or unreliable on a flaky network for git sources (feasibility risk flagged High in the bet). → **Mitigation**: cache last-known-good resolution; `oprim context`/`doctor` report staleness rather than hard-failing when a fetch times out. Local-path sources are unaffected by this risk entirely.
- **[Risk]** A local-path source pointing outside the project could reference a path that later moves or is deleted (e.g. a sibling repo the user renames). → **Mitigation**: `oprim doctor` checks local-path existence explicitly and reports it distinctly from a git-unreachable failure.
- **[Risk]** Users may not know a source exists until they run `oprim context`. → **Mitigation**: `oprim doctor` surfaces configured-but-unresolved sources proactively as part of its existing health-check output.
- **[Risk]** Cache directory grows unbounded across many git sources over time. → **Mitigation**: shallow clones only; document manual cache-clear (reuse doctor's fix commands) rather than building automatic pruning in v1. Local-path sources contribute nothing to this risk since they're never cached.
- **[Trade-off]** No partial/sub-path-scoped sources in v1 means a small config entry can pull a large remote workspace. Accepted for simplicity; schema leaves room to add optional scoping later without a breaking change.
- **[Risk]** A source's canonical `description` is free text the source author writes once at `init` time — it can be missing, stale, or vague, giving `oprim context list` little to work with. → **Mitigation**: the `oprim-context-init` skill guides drafting a description by default; `description` remains optional at the CLI level (a user can still opt out, or call the CLI directly without the skill), so `list`/doctor still surface a missing description as a soft nudge rather than something the schema can force.

## Migration Plan

- No existing users have populated the old `store:` key with anything beyond the inert default (it was reserved, not usable), so there is nothing meaningful to migrate — `oprim update` replaces the template's `store:` block with `remote_context: {enabled: false, sources: []}` going forward. Existing configs that still have the old inert `store: {enabled: false}` are left as-is by the additive merge (an unrecognized leftover key, harmless) rather than being actively deleted; only new/updated configs get `remote_context`.
- Fully reversible: deleting `remote_context.sources` entries and the local remote-context cache directory returns a project to pre-bet behavior with no residue in `oprim/`.

## Open Questions

- Should the resolution cache be shared across all oprim projects on a machine, or per-project? (Leaning shared/global by source `name`+`git` URL to avoid redundant fetches — left to implementation.)
- Exact throttle window for re-fetch-on-invocation for git sources (e.g. 5 min) — left as an implementation default, tunable later if it proves too aggressive or too stale in practice.
- Whether the old inert `store:` key should be actively removed from configs during `oprim update`, or simply left as harmless dead config — leaning toward leaving it (update never deletes user-visible keys elsewhere), but worth a second look during implementation.
