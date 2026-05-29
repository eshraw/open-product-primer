# Decision: BET-004 Double down on oprim branding over primer

## Status
- Decision: Build now
- Date: 2026-05-27
- Owner: Eshane
- Review date: 2026-06-27

## Why now
- Users naturally invoke oprim skills, not primer skills — the branding is already established in practice
- The naming split between the repo (open-product-primer) and the agent tool (oprim) causes confusion about which name to use when

## Alternatives considered
- Keep primer as the repo/project name, oprim as the tool name — repo stays open-product-primer, but all user-facing CLI/agent surfaces are fully oprim-branded (chosen direction)

## Expected outcomes
- New contributors learn one name, not two, within their first session (baseline: confused by the primer/oprim split)

## Kill criteria / rollback trigger
- oprim conflicts with an existing tool or brand externally — reconsider the name

## Links
- PDRs: None
- OpenSpec change: `openspec/changes/2026-05-29-oprim-branding-consolidation`
