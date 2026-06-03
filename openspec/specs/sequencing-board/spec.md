## ADDED Requirements

### Requirement: Sequencing board SHALL exclude archived bets from all active buckets
A bet that has been archived via `oprim:archive` SHALL NOT appear in any active bucket (`now`, `next`, `later`, or `backlog`) of `sequence.yaml`. The board represents only bets that are active, pending, or planned.

#### Scenario: Archived bet absent from sequence.yaml
- **WHEN** a bet is successfully archived using `oprim:archive`
- **THEN** `sequence.yaml` contains no entry for that bet ID in any bucket

#### Scenario: Active board remains complete after archival
- **WHEN** a bet is archived
- **THEN** all other entries in `sequence.yaml` are unchanged and the board remains valid
