# Goal: add a "portfolio mode" to oprim for product managers

oprim works well for one product or repo: it holds that product's bets, PDRs, sequencing board, specs and KPI reviews. It doesn't cover the product manager's own workspace, which spans several products and needs company-wide context. I want one oprim-powered repo to work as a **PM assistant**, with global context, while each product keeps its own oprim instance focused on code.

This repo manages itself with oprim (`spec_framework: native`). Use its own workflow.

## What to do in this session (no code yet)

1. Read `README.md`, `WORKFLOW.md`, `CLAUDE.md`, `oprim/config.yaml`, `oprim/sequence.yaml`, and `packages/cli/src/lib/{remote-context,install-agent,workflow-schema,workflow-renderer,config-merge,integrity,validate-checks}.ts`. Check which parts already exist before you propose anything new. Remote context in particular is the natural basis for linking products.
2. Run `/oprim:explore` on the problem below. Compare at least 2–3 approaches, for example:
   (a) a `mode: portfolio` flag in `config.yaml`;
   (b) a separate `oprim portfolio` command group;
   (c) a set of forked workflows plus a scaffold preset with no new core concepts.
   Recommend one.
3. Write a **PDR** that sets the boundary between the portfolio and a product (see "Authority boundaries").
4. Split the work into **4–7 small bets** with `oprim-bet`. Each bet needs a kill criterion, door type and risk profile. Put them on `sequence.yaml` with `blocked_by`/`unlocks`. Add an `oprim-criteria` file to the first bet in the "now" lane.
5. **Stop.** Summarize the PDR, the bets and the proposed board, and list the open questions. Don't promote anything or write code until I approve.

## Requirements for portfolio mode

### R1. Workspace mode and scaffold
- Add a `mode: product | portfolio` setting to `oprim/config.yaml`. The default is `product`, and existing projects must not change at all.
- `oprim init --mode portfolio` scaffolds what product mode does, plus:
  - `context/`: company overview, OKRs, product principles, glossary and people. These files are written by humans and loaded into every PM workflow.
  - `STATE.md`: current focus, work in progress, blockers and the last commands run, updated by the workflows.
  - `inbox.md`: quick capture.
  - `wiki/`: knowledge built from meetings (people, products, decisions), append-only.
- `oprim update` adds the new config keys without overwriting anything (`config-merge.ts`).

### R2. Product registry, built on remote context
- `config.yaml` gets a `products:` list. Each entry reuses `remote_context.sources` (git or local path) and adds metadata: owner, squad, the OKR objectives it serves, and status. Don't build a second linking mechanism.
- Add a syntax for referencing another product's artifact, such as `<product>:BET-012` or `<product>:PDR-003`. It must work in `blocked_by`, `unlocks`, `requires_pdrs` and bet links, and `doctor`/`validate` must resolve it.
- The portfolio repo itself is citable (`oprim context init`). That lets products cite portfolio-level PDRs, such as company policy, without copying them.

### R3. Portfolio-level artifacts
- **Objectives:** stored in `context/` or `oprim/objectives/` (your call; justify it). Every portfolio or product bet should reference at least one objective.
- **Portfolio bets:** bets that span products, or come before a product exists. Pick an ID namespace that can't collide with product IDs.
- **Delegation:** `/oprim:delegate <portfolio-bet> --to <product>` creates a linked bet in the product's workspace, with links in both directions.
  - Local-path products: write directly, after confirmation.
  - Git products: produce a handoff file or patch. Never push.
  - After delegating, the portfolio bet follows the product bet's status and never copies its content.
- **Portfolio PDRs:** company-wide policy that product PDRs can cite.

### R4. Views across products
- `oprim ovw --portfolio` combines every product's `sequence.yaml` through remote context and shows:
  - each product's Now/Next lanes and how busy they are;
  - dependencies between products that are unresolved or out of order;
  - objectives with no bet in Now or Next, and bets linked to no objective;
  - overdue reviews (`Review date` passed) and bets missing `criteria.yaml`.
- The output must read cleanly in a terminal. If OKF frontmatter is on, it must also be parseable, so Obsidian Dataview or Notion can use it.

### R5. PM workflows
Write each one as a `<id>.schema.yaml` + `<id>.template.md` pair, rendered for every supported agent and forkable through `oprim/workflows/`:
- `oprim-capture` appends to `inbox.md`. `/oprim:triage` routes each inbox item to a NOTE in the right product, a portfolio note, a personal task, or discard. It asks one question per item with AskUserQuestion.
- `/oprim:ingest <meeting-note>` updates `wiki/` and suggests where each extracted decision belongs: the wiki log, a PDR candidate (portfolio or product), or a note or bet candidate. Nothing is written to a product workspace without confirmation.
- `/oprim:start-day` and `/oprim:plan-week` work from `STATE.md`, the portfolio view and the inbox. Calendar and Slack are optional, used only if those MCP servers exist, and the workflows must still work without them.
- `/oprim:prioritize` ranks by OKR fit, risk and door type, and proposes changes to the boards without applying them.
- `/oprim:stakeholder-update` and `/oprim:roadmap-comms` write update and roadmap documents for a chosen audience from the boards and reviews, saved to `outputs/`.
- `/oprim:publish <BET|PDR>` (optional): renders a Notion-ready PRD from the bet, criteria and spec. Git stays the source of truth.
- **Questions before drafting:** before any bet, PDR, criteria or comms draft, ask 2–3 questions about the assumptions it rests on and wait for the answers. Allow `rules.*` to turn this off per workflow.
- **Reviewer personas** (Claude only, under `.claude/agents/`): `c-level` reviews bets, `eng-lead` reviews specs and designs, and `data-eng` reviews criteria. Each adds a `## <persona> perspective` section to the file it reviews.

### R6. Checks
- `doctor` and `validate` in portfolio mode check that:
  - every product source can be reached;
  - every cross-product reference resolves;
  - every objective reference resolves;
  - delegated bets exist on both sides, with matching back-links;
  - WIP limits hold per product and across the portfolio, if one is set.

## Authority boundaries (to state in the PDR)
- **Portfolio** owns company-wide context, OKR alignment, order across products, delegation and portfolio-level policy.
- **Product workspaces** own their own bets, PDRs, specs and measurement.
- The portfolio **references** product artifacts and never copies their content. Products never write back into the portfolio, except for read-only citation.
- The portfolio never holds specs (what/how), so `spec_framework` there is forced to `none`.

## Constraints
- Changes must be additive and backward compatible: product mode behaves exactly as before, and every existing test keeps passing.
- Follow the repo's conventions:
  - workflows as schema+template pairs;
  - rendering for every agent through `workflow-renderer.ts`;
  - deterministic logic in TypeScript `lib/` with Vitest tests on real temp directories, not in prose instructions;
  - every artifact must work with OKF frontmatter on or off.
- Never write to another repo without explicit confirmation, and never push to a git remote.

## Out of scope for now
- New measurement backends; note "Databricks source for `oprim measure`" as a separate later bet.
- A hosted service or UI.
- Two-way sync with Notion.

## Open questions to ask me, with AskUserQuestion, before writing the bets
- Objectives: a file in `context/` or first-class `oprim/objectives/` artifacts?
- ID namespace for portfolio bets.
- Delegation to git products: a handoff file, a patch, or a branch in a local clone?
- Should `STATE.md` and `wiki/` be part of oprim, or stay a recommended convention outside the CLI?

A few choices are built in and worth checking:
- It reuses remote_context for the product registry instead of adding a second way to link products.
- The portfolio never holds specs.
- It makes Claude stop after the explore, PDR and bets stage, so you review the design before any code is written.
