## Requirements

### Requirement: Compiled CLI output SHALL NOT be tracked in git
`packages/cli/dist/` SHALL be ignored and SHALL contain no tracked files; the published package SHALL be built by `prepublishOnly` from source. CI SHALL fail if `git ls-files packages/cli/dist` returns any path.

#### Scenario: Clean tree after build
- **GIVEN** a fresh clone
- **WHEN** a developer runs `npm run build` in `packages/cli`
- **THEN** `git status` shows no changes under `packages/cli/dist/`

#### Scenario: Accidentally committed build output
- **GIVEN** a commit that force-adds `packages/cli/dist/cli.js`
- **WHEN** CI runs
- **THEN** the job fails with a message naming the tracked dist file

#### Scenario: Published package still complete
- **WHEN** CI runs `npm pack --dry-run` after `npm run build`
- **THEN** the tarball lists `dist/cli.js`, `dist/lib/claude-mods.js` and `dist/workflows/`
