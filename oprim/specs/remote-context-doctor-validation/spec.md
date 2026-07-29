## Requirements

### Requirement: oprim doctor SHALL validate each configured git source
The system SHALL extend `oprim doctor` to check, for every `git`-kind entry in `remote_context.sources`: whether the remote is reachable, whether a valid `.oprim-context/context.yaml` identity is present at the remote, and whether the source currently resolves to cached content.

#### Scenario: All git sources healthy
- **WHEN** `oprim doctor` runs and every configured `git` source is reachable with a valid identity and a resolvable cache
- **THEN** doctor reports all git sources as healthy

#### Scenario: A git source's remote is unreachable
- **WHEN** `oprim doctor` runs and a configured `git` source's remote cannot be reached
- **THEN** doctor reports that source as unreachable and includes a pasteable command to retry resolution or remove the source

#### Scenario: A git source's remote lacks an identity file
- **WHEN** `oprim doctor` runs and a configured `git` source's remote is reachable but has no `.oprim-context/context.yaml`
- **THEN** doctor reports that source as missing a remote context identity, distinct from an unreachable-remote failure

### Requirement: oprim doctor SHALL validate each configured local-path source
The system SHALL extend `oprim doctor` to check, for every `path`-kind entry in `remote_context.sources`: whether the configured path exists and is readable, and whether a valid `.oprim-context/context.yaml` identity is present at that path.

#### Scenario: All local-path sources healthy
- **WHEN** `oprim doctor` runs and every configured `path` source exists, is readable, and has a valid identity file
- **THEN** doctor reports all local-path sources as healthy

#### Scenario: A local-path source's path does not exist
- **WHEN** `oprim doctor` runs and a configured `path` source's directory does not exist on disk
- **THEN** doctor reports that source as a missing path, distinct from a git-unreachable failure, and includes a pasteable command to fix or remove the source

#### Scenario: A local-path source's target lacks an identity file
- **WHEN** `oprim doctor` runs and a configured `path` source's directory exists but has no `.oprim-context/context.yaml`
- **THEN** doctor reports that source as missing a remote context identity, distinct from a missing-path failure

### Requirement: oprim doctor's identity and reachability checks SHALL use the lightweight identity-only fetch, not full resolution
The system SHALL perform the reachability and identity-validity checks above using the identity-only fetch mode (per the remote-context-resolution capability), not a full resolution of each source's oprim workspace. Full resolution SHALL only occur as part of the separately-flagged unresolved-source check below.

#### Scenario: Doctor checks do not trigger full resolution
- **WHEN** `oprim doctor` runs its reachability and identity checks across all configured sources
- **THEN** it performs only identity-only fetches for those checks, without cloning or reading any source's full oprim workspace

### Requirement: oprim doctor SHALL surface configured-but-unresolved sources proactively
The system SHALL flag any `remote_context.sources` entry (git or local path) that has never been successfully resolved on this machine, so users discover broken sources without first running `oprim context`.

#### Scenario: A source has never been resolved
- **WHEN** `oprim doctor` runs and a configured source has no successful resolution yet
- **THEN** doctor reports that source as unresolved and suggests running `oprim context` to attempt first resolution
