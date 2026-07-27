<!-- Auto-generated from oprim/sequence.yaml. Do not edit directly. -->
<!-- Regenerate by running: node oprim/scripts/generate-sequence-view.js -->

# Sequencing Board

```mermaid
graph TD
    subgraph Now
        BET027["BET-027: Move oprim workflows to declarative s..."]
    end
    subgraph Next
        BET028["BET-028: Add oprim validate with strict CI gating"]
        BET032["BET-032: Move active bets into a pending sub-d..."]
        BET033["BET-033: Add proposal, design, and tasks artif..."]
        BET029["BET-029: Add explore and reconcile commands to..."]
        BET031["BET-031: Add a current decisions rollup view"]
    end
    subgraph Later
        BET014["BET-014: Improve agent focus during bet discovery"]
        BET019["BET-019: Add quick-capture mode to bet creatio..."]
    end
    BET028 --> [
    BET028 --> B
    BET028 --> E
    BET028 --> T
    BET028 --> 
    BET028 --> 0
    BET028 --> 2
    BET028 --> 4
    BET028 --> ]
    BET033 --> [
    BET033 --> B
    BET033 --> E
    BET033 --> T
    BET033 --> 
    BET033 --> 0
    BET033 --> 3
    BET033 --> 2
    BET033 --> ]
```

### Backlog
- **BET-005**: Unify oprim, openspec, and grafiphy under a single context folder
- **BET-020**: Enable PDR surfacing by default in oprim init
- **BET-030**: Add list, show, and status JSON commands
