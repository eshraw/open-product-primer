## 1. Generator Implementation

- [x] 1.1 Write a function/script that reads `oprim/sequence.yaml` and produces a Mermaid `graph TD` diagram string with subgraphs for `now`, `next`, and `later` buckets
- [x] 1.2 Add `blocked_by` edges to the diagram output (directed arrows from dependent bet to each blocker)
- [x] 1.3 Render the `backlog` bucket as a Markdown list appended below the Mermaid block
- [x] 1.4 Truncate bet titles to ≤40 characters in diagram node labels to avoid wrapping

## 2. Output File

- [x] 2.1 Write the generator output to `oprim/sequence-view.md`, including an auto-generated header comment indicating the file is derived from `sequence.yaml`
- [x] 2.2 Verify `oprim/sequence-view.md` renders correctly in the GitHub web UI (open file in browser and confirm diagram is displayed, not raw text)

## 3. Skill Integration

- [x] 3.1 Extend the `/oprim:sequence` skill to call the view generator as a final step after board validation and write
- [x] 3.2 Confirm that running `/oprim:sequence` with any change to `sequence.yaml` produces an updated `sequence-view.md` diff

## 4. Validation

- [x] 4.1 Verify all four spec scenarios pass against the generated output (bucket grouping, backlog list, dependency arrows, GitHub rendering)
- [x] 4.2 Confirm both `sequence.yaml` and `sequence-view.md` appear in the same commit when the sequence board is updated
