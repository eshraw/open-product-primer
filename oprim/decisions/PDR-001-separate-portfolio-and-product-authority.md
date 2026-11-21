# PDR-001: Separate portfolio and product authority in oprim workspaces

## Status
Proposed

## Context
oprim today models exactly one product per repo: its bets, PDRs, sequencing board, specs and KPI reviews. A product manager's own workspace spans several products and needs company-wide context (objectives, principles, people, meeting knowledge) that no single product repo should own. We want one oprim-powered repo to act as a **PM assistant** with that global context, while each product keeps its own oprim instance focused on code.

Without an explicit boundary, a portfolio workspace drifts into one of two failure modes: it copies product artifacts (two sources of truth that silently diverge), or products start writing into it (the portfolio becomes a dumping ground no one owns). This PDR fixes the boundary before any portfolio code is written (BET-075 → BET-081).

Constraints that shaped it, all verified in the current code:
- `remote_context` (BET-026, `lib/remote-context.ts`) already links repos by git URL or local path, with identity validation, a throttled cache, and `doctor` reachability checks.
- Remote context exports **only** `oprim/` (`assembleOprimWorkspaceContent`) — anything a product should be able to cite must live under `oprim/`; anything private to the PM must live outside it.
- The git cache under `~/.oprim/remote-context-cache/` is `reset --hard` on every fetch — it is read-only by construction and must never be a write target.
- Every ID parser (`validate-checks.ts`, `spec-delta.ts`, `hyperlink.ts`, `oprim-bet`'s ID scan) is anchored on `^BET-\d+`.

## Decision
**1. One mode switch, not a second tool.** `oprim/config.yaml` gains `mode: product | portfolio`. An absent `mode` means `product`; product-mode behaviour and files stay byte-for-byte as today (no key is added to an existing product config). Portfolio logic lives in isolated `lib/portfolio/*` modules that commands call behind a single `mode === 'portfolio'` guard.

**2. Authority split.**

| Owner | Owns | Never does |
|---|---|---|
| **Portfolio** | company-wide context, objectives (OKRs), cross-product ordering, delegation, portfolio-level policy PDRs | hold specs (what/how); copy a product artifact's content; write into a product without explicit confirmation; push to any git remote |
| **Product** | its own bets, PDRs, specs, criteria, measurement and reviews | write back into the portfolio (it may only *cite* portfolio artifacts read-only) |

**3. Reference, never copy.** The portfolio points at product artifacts with a qualified reference `<source>:<ID>` (e.g. `checkout:BET-012`, `acme-portfolio:PDR-003`, `acme-portfolio:OBJ-002`), where `<source>` is a `remote_context.sources` name. Status of a referenced artifact is always *read* at resolution time, never stored. Bare IDs always mean "this workspace".

**4. Reuse remote context as the only linking mechanism.** `config.yaml` gains a `products:` list whose entries name an existing `remote_context.sources` entry and add metadata (owner, squad, objectives, status). No second URL/path registry. The portfolio repo itself is a citable remote context (`oprim context init`), with `mode: portfolio` recorded in its identity file so products know which source is their portfolio.

**5. The portfolio never holds specs.** `init --mode portfolio` writes `integrations.spec_framework: none`; `doctor`/`validate` fail if a portfolio workspace has any other value or any `specs/` delta; `oprim-spec` is not installed in portfolio mode.

**6. Workspace layout splits by audience.**
- Under `oprim/` (citable by products via remote context): `decisions/` (portfolio PDRs), `objectives/` (`OBJ-NNN-<slug>.md`, first-class), `bets/`, `sequence.yaml`, `company/` (overview, principles, glossary — human-written, loaded by every PM workflow).
- Outside `oprim/` (personal, never exported): `STATE.md`, `inbox.md`, `wiki/` (append-only, incl. `wiki/people/`), `outputs/` (comms drafts, delegation handoffs). Scaffolded by `init --mode portfolio` and maintained by PM workflows; the CLI never parses their content.

**7. Portfolio bets keep the `BET-NNN` namespace.** Collisions are prevented by qualification, not by a prefix: any reference that crosses a workspace boundary must be qualified. This keeps every existing `^BET-\d+` parser working unchanged.

**8. Delegation writes only with consent, never pushes.** `/oprim:delegate` writes a linked bet directly into a **local-path** product only after confirmation; for a **git** product it writes a handoff file to `outputs/handoffs/` and nothing else. Both sides carry back-links (`Delegated to:` / `Delegated from:`), which `validate` checks.

**9. Determinism.** Reference resolution, objective checks, back-link checks, WIP checks and the portfolio view are TypeScript in `lib/` with Vitest tests on real temp dirs. Agent workflows draft and route; they never decide board state (consistent with the board-vision rule that `ovw`/`status` render deterministically from `sequence.yaml`).

## Alternatives considered
- **Separate `oprim portfolio` command group** — zero product-mode risk, but duplicates `init`/`doctor`/`validate`/`ovw`, splits the mental model, and contradicts the desired `init --mode portfolio` / `ovw --portfolio` surface. Rejected.
- **Forked workflows + scaffold preset, no core concepts** — zero core risk, but cross-product resolution, objective checks and back-link validation would live in prose, violating "deterministic logic in TypeScript". Forks also trip `doctor`'s skill-drift check permanently. Rejected as the architecture; its spirit is kept by shipping PM workflows early (BET-080) as a value probe.
- **Copy product bets into the portfolio** (snapshot sync) — simple reads, but two sources of truth that silently diverge. Rejected.
- **`PBET-NNN` / `PF-BET-NNN` prefix for portfolio bets** — visually distinct, but requires touching every `^BET-\d+` parser. Rejected in favour of qualified references.
- **Objectives in a single `context/okrs.md`** — simpler to write, but heading-based resolution is fragile and the file would not be citable unless under `oprim/`. Rejected for first-class `oprim/objectives/`.
- **Patch file or branch in a local clone for git delegation** — more automatic, but patches go stale against a moving HEAD and branches raise blast radius; the only clone oprim has is the read-only cache. Rejected for a handoff file.

## Consequences
- Positive: one install and one mental model; product mode untouched; products can cite company policy and objectives without copying; portfolio status can never go stale because it is never stored.
- Trade-offs: cross-product checks depend on reachability (git sources degrade to the last-known-good cache, reported as stale); every cross-workspace reference must be typed qualified; the `<source>:<ID>` syntax becomes data in users' repos and is hard to change later (1-way door, BET-076).
- Trade-offs: a qualified reference in a product's `sequence.yaml` is today reported as "dangling"; after BET-076 it is resolved instead. No existing workspace contains `:` references, so no existing output changes.
- Follow-ups: BET-075 (mode + scaffold), BET-076 (registry + references), BET-077 (objectives), BET-078 (delegation), BET-079 (portfolio view), BET-080 (PM daily workflows), BET-081 (PM comms + reviewer personas). Databricks measurement (BET-082) is out of scope.

## Evidence
- `packages/cli/src/lib/remote-context.ts` — source registry, identity, cache with `reset --hard`, `oprim/`-only export
- `packages/cli/src/lib/integrity.ts` — current dangling-reference check (would flag `checkout:BET-012`)
- `packages/cli/src/lib/validate-checks.ts`, `lib/spec-delta.ts` — `^BET-\d+` anchored parsing
- `/oprim:explore` session 2026-11-21 comparing mode flag vs command group vs forked workflows

## Related
- Bets: BET-075, BET-076, BET-077, BET-078, BET-079, BET-080, BET-081
- OpenSpec: None (native specs)
- Supersedes: None
