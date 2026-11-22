### Objective authoring (oprim-objective)
Create a new objective (OKR) in `oprim/objectives/`.

1. Ask for the objective title (an outcome, not a project).
2. Assign next OBJ ID: scan `oprim/objectives/OBJ-(\d+)-`, max+1 zero-padded to 3 digits (default 001; never reuse IDs).
2b. Read `oprim/config.yaml`'s `rules.objective` — if non-empty, apply it as additional guidance and reflect it in the generated content; if empty, behavior is unchanged.
3. Gather: period (e.g. `2027-Q1`), 2–4 key results (`metric: baseline → target by end of period`), rationale.
4. Ask if superseding an existing objective.
5. If `oprim/templates/objective.md` begins with frontmatter, prepend `type: objective`, `title`, `description`, `tags`, `timestamp`, `period`, `status: Active`; otherwise no frontmatter.
6. Write `oprim/objectives/OBJ-NNN-<slug>.md`: `# OBJ-NNN: <title>`, `## Status` (`Active`), `## Period`, `## Key results`, `## Rationale`. If superseding, set the old objective's Status to `Superseded by OBJ-NNN`.
7. Report what was created; bets link it with `- Objectives: OBJ-NNN` in `## Links`.