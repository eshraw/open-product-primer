## Requirements

### Requirement: A git source SHALL resolve via on-demand git fetch, not a user-managed clone
For each `git`-kind entry in `remote_context.sources`, the system SHALL resolve the target's full oprim workspace content by fetching the `git` URL into an oprim-managed local cache directory, rather than requiring the user to clone and maintain a local checkout themselves.

#### Scenario: First resolution of a git source
- **WHEN** a `git` source has never been resolved on this machine
- **THEN** the system shallow-clones the source's `git` URL into a new oprim-managed cache directory and reads the resulting oprim workspace content

#### Scenario: Subsequent resolution reuses and refreshes the cache
- **WHEN** a `git` source has already been resolved once and is resolved again
- **THEN** the system re-fetches the existing cache directory in place (rather than re-cloning from scratch) so the resolved content reflects the current remote state

### Requirement: A local-path source SHALL resolve by reading the target directory directly, with no cache
For each `path`-kind entry in `remote_context.sources`, the system SHALL resolve the target's full oprim workspace content by reading it directly from the configured filesystem path at resolution time. No cache, fetch, or copy step SHALL be involved — the content is read live from disk on every resolution.

#### Scenario: Resolving a local-path source
- **WHEN** a `path` source is resolved
- **THEN** the system reads the oprim workspace directly from the configured path and returns its current on-disk content, with no intermediate cache directory created

#### Scenario: Local-path source content changes between resolutions
- **WHEN** files under a `path` source's target directory change between two resolutions
- **THEN** the next resolution reflects those changes immediately, since no cached copy exists to go stale

### Requirement: Git source resolution SHALL never require the user to manually sync the cache
The system SHALL NOT expose the git-source resolution cache as something the user is expected to `git pull` or otherwise manually keep current; every resolution SHALL re-fetch from the remote (subject to an internal throttle) rather than trusting a possibly stale prior fetch indefinitely.

#### Scenario: Remote has changed since last resolution
- **WHEN** a git source's default branch has new commits since the cache was last fetched
- **THEN** the next resolution (outside the throttle window) fetches and reflects those new commits without any manual git operation by the user

### Requirement: A source pulls the whole remote context
The system SHALL resolve a source's entire published oprim workspace (decisions, bets, specs) with no path- or capability-level filtering in this capability, regardless of whether the source is `git` or `path` kind.

#### Scenario: Resolving a git source returns the full oprim workspace
- **WHEN** a `git` source is resolved
- **THEN** the resolved content includes that context's full `oprim/` workspace, not a subset

#### Scenario: Resolving a local-path source returns the full oprim workspace
- **WHEN** a `path` source is resolved
- **THEN** the resolved content includes that context's full `oprim/` workspace, not a subset

### Requirement: Git source resolution failures SHALL degrade to last-known-good content with a staleness indication
The system SHALL, when a git fetch fails (e.g. network unreachable, remote deleted, auth failure), fall back to the last successfully cached resolution for that source if one exists, and mark it as stale, rather than hard-failing the caller.

#### Scenario: Git fetch fails but a prior cache exists
- **WHEN** resolving a `git` source fails to reach the remote and a previously cached resolution exists
- **THEN** the system returns the cached content marked as stale, including the timestamp of the last successful fetch

#### Scenario: Git fetch fails and no prior cache exists
- **WHEN** resolving a `git` source fails to reach the remote and no prior successful cache exists
- **THEN** the system reports the source as unresolved with the underlying fetch error, rather than returning partial or fabricated content

### Requirement: Local-path source resolution failures SHALL report the missing path directly, with no stale fallback
The system SHALL, when a `path` source's configured directory does not exist or is not readable, report the source as unresolved with the underlying filesystem error. Since local-path sources are never cached, there is no last-known-good content to fall back to.

#### Scenario: Configured local path does not exist
- **WHEN** resolving a `path` source whose configured path does not exist on disk
- **THEN** the system reports the source as unresolved with a clear "path not found" error, rather than falling back to any prior state

### Requirement: The system SHALL support a lightweight identity-only fetch, distinct from full resolution
For any source (`git` or `path`), the system SHALL support resolving just the `.oprim-context/context.yaml` identity file — including its `name` and `description` — without fetching or reading the source's full oprim workspace. For a `git` source this SHALL be a targeted fetch of the single identity file, not a shallow clone of the whole repository. This mode is used by listing and doctor checks so they remain cheap even when full resolution would be slow or unnecessary.

#### Scenario: Identity-only fetch for a git source
- **WHEN** the system performs an identity-only fetch for a `git` source
- **THEN** it retrieves only the remote's `.oprim-context/context.yaml` content, without cloning or fetching the rest of the repository

#### Scenario: Identity-only fetch for a local-path source
- **WHEN** the system performs an identity-only fetch for a `path` source
- **THEN** it reads only the target directory's `.oprim-context/context.yaml`, without reading the rest of its `oprim/` workspace

#### Scenario: Identity-only fetch fails
- **WHEN** an identity-only fetch cannot reach a `git` source's remote, or a `path` source's configured directory does not exist
- **THEN** the system reports the identity-only fetch as failed with the underlying error, distinct from a failure during full resolution
