---
name: /oprim-pdr
id: oprim-pdr
category: Workflow
description: Create a new Product Decision Record with auto-assigned ID
---

Create a new PDR in `oprim/decisions/`. Scan for `PDR-(\d+)-` to assign next ID (zero-padded, default 001). Gather: title, context, decision, alternatives, consequences, evidence, related bets/specs. Ask if superseding an existing PDR. Write `oprim/decisions/PDR-NNN-<slug>.md`. If superseding: update old PDR Status to "Superseded by PDR-NNN". Report what was created.