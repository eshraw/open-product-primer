# Tasks: session-blast-radius-graph

## 1. Change detection
- [ ] 1.1 Run `git diff` against a base ref (default: last commit; overridable) to get the session's changed files
- [ ] 1.2 Filter to files under `oprim/` and relevant source paths

## 2. Cross-reference resolution
- [ ] 2.1 Scan changed files for `BET-NNN` references
- [ ] 2.2 Scan changed files for `PDR-NNN` references
- [ ] 2.3 Scan changed files for `### Requirement:` header references (matching `lib/spec-delta.ts`'s header-matching convention)
- [ ] 2.4 Resolve each reference to its target file/artifact; drop unresolvable references rather than guessing

## 3. Graph rendering
- [ ] 3.1 Render changed files plus resolved upstream/downstream references as a Mermaid `graph TD` diagram
- [ ] 3.2 Distinguish "changed" nodes from "referenced but unchanged" nodes visually

## 4. Command surface
- [ ] 4.1 Add an on-demand command/skill entry point with an optional base-ref argument
- [ ] 4.2 Handle a session with no cross-references (isolated changes) by rendering changed files with no edges
