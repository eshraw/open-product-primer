# Decision: BET-072 Visualize spec requirement dependencies as a graph

## Status
- Decision: Defer
- Date: 2026-09-16
- Owner: Eshane Rawat
- Review date: 2026-10-16

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)

## Risk profile
- **Value risk**: Low-Medium — `oprim/specs/**/spec.md` Gherkin scenarios and RFC2119 requirements can reference each other conceptually, but nothing parses or visualizes those relationships today
- **Usability risk**: Low — additive, read-only visualization
- **Feasibility risk**: Low-Medium — buildable as an on-demand parse + render over existing spec.md files, no dependency on the unverified hooks system; requires deciding how to detect "relationship" between requirements (shared terms, explicit cross-references, etc.)
- **Business viability risk**: Low — internal tooling only

## Why now
- Requirement-to-requirement relationships within and across capability specs are currently only discoverable by fully reading each `spec.md`

## Alternatives considered
- Status quo: manual reading of `spec.md` files to spot connections

## Expected outcomes
- Requirement-to-requirement relationships visualized instead of requiring full manual reads of spec.md files to spot connections

## Kill criteria / rollback trigger
- If requirements in practice rarely have detectable relationships to each other (mostly independent), kill as low-value

## Links
- PDRs: None
- OpenSpec change: <to be filled when promoted>
