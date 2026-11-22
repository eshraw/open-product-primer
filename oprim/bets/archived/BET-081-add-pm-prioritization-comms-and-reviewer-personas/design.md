# Design: BET-081 prioritization, comms and reviewer personas

## Context
Consumes BET-079's `ovw --portfolio --json` and BET-080's mode-gated workflow set and ask-first blocks. Board-vision rule: agents propose, owners apply.

## Decisions

### 1. Workflows
`prioritize`, `stakeholder-update`, `roadmap-comms`, `publish` — schema/template/cursor-command/inline each, `modes: [portfolio]`, ask-first blocks (BET-080) in the comms templates. Outputs under `outputs/` (personal, never exported).

### 2. Ranking is transparent, not computed
Prioritize is an agent workflow but must show its inputs per bet (objectives, risk letters, door type) so the PM can disagree line by line. A deterministic score was considered and rejected for v1 — weighting OKR fit vs risk is the PM's judgment; revisit if the PM wants a reproducible score.

### 3. Personas need a new install target
`.claude/agents/<name>.md` is a new Claude install location. Schema gains `claude.agent: <name>` (alongside `skill`/`command`); `install-agent.ts` writes it in portfolio mode only. Agent frontmatter: `name`, `description` (when to use), `tools: Read, Edit`. Edit (not Write) keeps "append only" enforceable by instruction plus a post-check in the persona body ("re-read the file and confirm all prior content is unchanged").

### 4. criteria.yaml persona output as YAML comments
Appending a markdown heading to YAML would break `oprim measure`. data-eng writes `# ## data-eng perspective (YYYY-MM-DD)` comment lines; a test asserts the file parses to identical data before and after.

### 5. Publish
Composes from local or resolved remote workspace (BET-076 resolver gives the path). Notion upload only when the user explicitly asks and a Notion MCP is present; never sync back.

## Alternatives considered
- Personas as skills — rejected: subagents give an independent context, which is the point of a reviewer.
- Personas for Cursor/Codex — deferred; no equivalent first-class location.

## Risks
- Business viability: drafts might be sent as-is with wrong commitments. Every draft starts with a "DRAFT — verify before sending" banner and cites refs.
