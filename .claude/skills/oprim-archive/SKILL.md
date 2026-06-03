---
name: oprim-archive
description: Archive a completed bet — moves it to oprim/bets/archived/BET-NNN/ and removes its sequence.yaml entry
---

Archive a completed bet by moving it to `oprim/bets/archived/` and removing it from `sequence.yaml`.

## Steps

### 1. Get the bet ID

If provided as an argument (e.g., `/oprim:archive BET-005`), use it directly.

If not provided, ask: "Which bet ID would you like to archive? (e.g., BET-005)"

Normalize the input: accept `bet-005`, `005`, `5`, or `BET-005` — always treat as `BET-NNN` zero-padded to 3 digits.

### 2. Check the bet directory exists

Check whether `oprim/bets/BET-NNN/` exists.

If not found:
- Report: "Bet BET-NNN was not found in oprim/bets/. Nothing was changed."
- Stop.

### 3. Check for active dependencies in sequence.yaml

Read `oprim/sequence.yaml`. Scan every entry across all buckets (now, next, later, backlog) for any entry whose `blocked_by` or `unlocks` list contains the target bet ID.

If dependents are found:
- Show a warning listing each dependent entry and which field references the target bet.

  Example:
  ```
  ⚠ Warning: BET-005 is referenced by active bets:
    - BET-007 (blocked_by: [BET-005])
    - BET-008 (unlocks: [BET-005])
  ```
- Ask: "Archive BET-NNN anyway? These references will become stale. (y/N)"
  - If "n" or Enter: stop, no changes made.
  - If "y": proceed.

If no dependents found: proceed without warning.

### 4. Move the bet directory to archive

Create the archive subfolder if it doesn't exist:
```bash
mkdir -p oprim/bets/archived
```

Move the directory:
```bash
mv oprim/bets/BET-NNN oprim/bets/archived/BET-NNN
```

### 5. Remove the bet entry from sequence.yaml

Read `oprim/sequence.yaml`, parse it, and remove the entry with `id: BET-NNN` from whichever bucket it appears in (now, next, later, or backlog). Write the updated YAML back using 2-space indentation. Do not modify any other entries.

### 6. Report what was done

```
## Bet Archived

**Bet:** BET-NNN
**Archived to:** oprim/bets/archived/BET-NNN/
**Removed from sequence.yaml:** ✓

The bet is preserved in full at the archive location.
```
