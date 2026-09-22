# Tasks: bet-lineage-dependency-graph

## 1. Lineage resolution
- [ ] 1.1 Resolve a bet ID to its directory (reuse `resolveBetDirectory()`/`normalizeBetId()` from `lib/spec-delta.ts`)
- [ ] 1.2 Parse `bet-decision.md`'s `## Links` section for PDR and OpenSpec-change references
- [ ] 1.3 Detect `criteria.yaml` presence and link it into the chain if found
- [ ] 1.4 Enumerate `specs/<capability>/spec.md` delta files under the bet directory

## 2. Graph rendering
- [ ] 2.1 Render the resolved chain (PDR → bet → criteria → spec-delta) as a Mermaid `graph TD` diagram
- [ ] 2.2 Mark archive status (pending vs. archived) on the bet node

## 3. Command surface
- [ ] 3.1 Add an on-demand command/skill entry point taking a bet ID and outputting the rendered graph
- [ ] 3.2 Handle a bet with sparse lineage (no PDR, no criteria) by rendering the partial chain rather than erroring
