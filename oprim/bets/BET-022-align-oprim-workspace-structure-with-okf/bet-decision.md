# Decision: BET-022 Align oprim workspace structure with Open Knowledge Format
<!-- Naming tip: verb + object [for context] — e.g. "Improve bet naming for scannability" not "Naming" -->

## Status
- Decision: Build now
- Date: 2026-06-30
- Owner: Eshane
- Review date: 2026-07-31

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)
- [ ] 1-way door (hard to reverse — requires higher confidence before committing)

## Risk profile
- **Value risk**: High — OKF may never gain traction and the bet has no standalone value; value is entirely contingent on ecosystem adoption
- **Usability risk**: High — OKF concepts (bundles, concept types) are unfamiliar to oprim users and introduce a new mental model
- **Feasibility risk**: Low — can be feature-flagged similar to the PDR surfacing approach; oprim templates and install-agent.ts are straightforward to extend
- **Business viability risk**: Low — OKF is an open spec with no licensing or vendor lock-in concerns

## Why now
- OKF v0.1 was just published by Google Cloud — early adopter positioning before the ecosystem solidifies
- oprim's workspace is already markdown+YAML, making alignment low-friction with minimal structural change
- As multi-agent workflows grow, agents need portable context beyond CLAUDE.md; OKF provides a vendor-neutral standard
- No other agent-native PM tool speaks OKF yet — competitive differentiation opportunity

## Alternatives considered
- Do nothing — continue relying on CLAUDE.md as the primary context surface for agents
- Adopt a different open format (e.g., LlamaIndex, LangChain schema) instead of OKF
- Wait for OKF to mature and gain broader ecosystem adoption before committing

## Expected outcomes
- oprim workspace is OKF-valid out of the box, consumable by any OKF-aware agent without transformation
- Reduced onboarding time for new agents on oprim-managed projects, orienting via the OKF bundle instead of bespoke docs

## Kill criteria / rollback trigger
- Alignment requires breaking changes to oprim workspace structure — not worth the cost to existing users
- Agent consumers don't benefit measurably over the CLAUDE.md baseline after a trial period

## Links
- PDRs: None
- OpenSpec change: to be filled when promoted
- Reference: https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/main/okf
- Article: https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing
