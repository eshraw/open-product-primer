---
name: oprim-triage
description: Route each open inbox.md item to a product note, portfolio note, personal task or discard — one question per item
---

Work through the open items in `inbox.md` and route each one. One question per item; nothing is written to a product workspace without the user confirming the exact target.

**Interactive prompts:** Use the **AskUserQuestion tool** for every question in this skill — do not write questions as plain text.

## Steps

### 1. Load the inbox and the product registry
- Read `inbox.md` at the project root. Open items are lines starting with `- [ ]`; skip `- [x]` lines and the empty placeholder `-`. If there are no open items, say "Inbox is empty" and stop.
- Read `products:` from `oprim/config.yaml`. Each entry's `source` names a `remote_context.sources` entry, which has either a local `path:` or a `git:` URL. Note which products are local and which are git.
- Skim `wiki/products/*.md` for each product's vocabulary (features, people, metrics) — you use it only to guess the likely product.

### 2. Route each item — exactly one question per item
Process items top to bottom. For each, ask one AskUserQuestion with the item text in the question and these options, putting your best guess first and marking it "(Recommended)":
- **NOTE in <product>** — the most likely product from `products:` and `wiki/products/` (add one option for a second candidate only if it is genuinely close)
- **Portfolio NOTE** — a note in this workspace's `oprim/notes/`
- **Personal task** — goes to `STATE.md`
- **Discard**

The user can always pick "Other" to name a different product or stop triaging. If they stop, leave the remaining items unchecked and go to step 4.

### 3. Apply the choice
- **NOTE in a local product**: show the target path (`<product path>/oprim/notes/NOTE-NNN-<slug>.md`, NNN = that workspace's max `NOTE-(\d+)-` + 1, zero-padded to 3) and the note content you will write, and ask for confirmation. Only on "yes", write the note following that product's note conventions (title from the item, body = the item text plus any context, a `## Bets` section) and record destination `<product>:NOTE-NNN`. On "no", leave the item unchecked.
- **NOTE in a git product** (or a product with no local path): do not write into the product. Append a handoff entry to `outputs/handoffs/<product>.md` (create it with a `# Handoffs for <product>` heading if missing): `- <YYYY-MM-DD> NOTE candidate: <item text> (from inbox)`. Record destination `<product>:handoff`.
- **Portfolio NOTE**: create `oprim/notes/NOTE-NNN-<slug>.md` in this workspace using the same conventions as `oprim-note` (read `oprim/templates/note.md` for the frontmatter tier). Record destination `NOTE-NNN`.
- **Personal task**: append `- <item text>` under `## In progress` in `STATE.md` (create the section if missing). Record destination `STATE.md`.
- **Discard**: change nothing except the inbox line. Record destination `discarded`.

### 4. Check off routed items
For every routed item, change its line in `inbox.md` from `- [ ] …` to `- [x] … → <destination>` (e.g. `→ checkout:NOTE-012`, `→ NOTE-004`, `→ STATE.md`, `→ discarded`). Edit only those lines; leave unrouted items and all other lines untouched.

### 5. Report
One line per routed item with its destination, then the count of items still open. Append `- <YYYY-MM-DD> /oprim:triage` under `## Last commands` in `STATE.md`.
