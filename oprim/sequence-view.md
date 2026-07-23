<!-- Auto-generated from oprim/sequence.yaml. Do not edit directly. -->
<!-- Regenerate by running: node oprim/scripts/generate-sequence-view.js -->

# Sequencing Board

```mermaid
graph TD
    subgraph Next
        BET022["BET-022: Align oprim workspace structure with ..."]
        BET013["BET-013: Introduce atomic notes in oprim for l..."]
        BET023["BET-023: Author native oprim specs in Gherkin ..."]
        BET024["BET-024: Adopt change and current spec dir lif..."]
        BET025["BET-025: Supercharge oprim config with merge o..."]
    end
    subgraph Later
        BET014["BET-014: Improve agent focus during bet discovery"]
        BET019["BET-019: Add quick-capture mode to bet creatio..."]
    end
    BET024 --> [
    BET024 --> B
    BET024 --> E
    BET024 --> T
    BET024 --> 
    BET024 --> 0
    BET024 --> 2
    BET024 --> 3
    BET024 --> ]
```

### Backlog
- **BET-005**: Unify oprim, openspec, and grafiphy under a single context folder
- **BET-020**: Enable PDR surfacing by default in oprim init
- **BET-026**: Pull team context from remote oprim stores
- **BET-027**: Move oprim workflows to declarative schemas
- **BET-028**: Add oprim validate with strict CI gating
- **BET-029**: Add explore and reconcile commands to oprim
- **BET-030**: Add list, show, and status JSON commands
- **BET-031**: Add a current decisions rollup view
