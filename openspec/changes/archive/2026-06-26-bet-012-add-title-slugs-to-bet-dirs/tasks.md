## 1. Update oprim-bet skill in install-agent.ts

- [x] 1.1 Update the ID scanning step (Step 2) in `betSkill()` to match `BET-(\d+)(-.*)?` so both `BET-NNN/` and `BET-NNN-slug/` directories are counted, and scan both `oprim/bets/` and `oprim/bets/archived/`
- [x] 1.2 Add a slug derivation step after ID assignment: lowercase title, strip punctuation, replace spaces with `-`, truncate to ~40 chars at a word boundary
- [x] 1.3 Update the directory creation step (Step 5) to use `BET-NNN-<slug>/` as the directory name
- [x] 1.4 Update the example in the bet-decision.md template comment (currently `BET-006-add-title-slugs-to-bet-dirs`) to use the generic `BET-NNN-<slug>` form

## 2. Update oprim:archive skill in install-agent.ts

- [x] 2.1 Replace the direct path construction (`oprim/bets/BET-NNN/`) with a glob-based resolution: match `oprim/bets/BET-NNN/` (exact) OR `oprim/bets/BET-NNN-*/` (slug variant), use the one that exists
- [x] 2.2 If neither or multiple matches are found, report an error with the found paths

## 3. Update installed skill files

- [x] 3.1 Run `oprim update` (or regenerate) to overwrite `.claude/skills/oprim-bet/SKILL.md` and `.claude/skills/oprim-archive/SKILL.md` with the updated content from `install-agent.ts`

## 4. Link the bet

- [x] 4.1 Update `oprim/bets/BET-012-add-title-slugs-to-bet-dirs/bet-decision.md` Links section with the OpenSpec change path (already done at promote time)
