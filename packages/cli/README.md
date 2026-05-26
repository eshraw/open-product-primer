# @open-product-primer/cli

Global CLI for [Open Product Primer](https://github.com/eshraw/open-product-primer) — product decisions, sequencing, and KPI tracking in your repository.

## Install

```bash
npm install -g @open-product-primer/cli@latest
```

## Quick start

```bash
cd your-project
oprim init
oprim doctor
oprim update
```

Bin aliases: `open-product-primer`, `oprim`.

## Commands

| Command | Description |
|---------|-------------|
| `oprim init` | Scaffold `primer/` workspace (idempotent) |
| `oprim update` | Refresh `/oprim:*` assistant commands and skills |
| `oprim doctor` | Verify scaffold, integrations, and measurement env |
| `oprim measure` | Run KPI measurement pipeline for a bet |

Full documentation: [github.com/eshraw/open-product-primer](https://github.com/eshraw/open-product-primer).
