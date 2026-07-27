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
| `oprim context` | Print resolved remote context content (`--source <name>` to scope to one) |
| `oprim context init` | Declare the current project a citable remote context (`--description`); prefer the guided `/oprim:context-init` skill in Claude Code |
| `oprim context register` | Register a remote context source (`--git <url>` or `--local <path>`, `--name`, optional `--description`) |
| `oprim context list` | List every registered source's name, kind, and description without fully resolving any of them |

A remote context is an oprim workspace bundled somewhere outside the current project's directory — a remote git repo or a local sibling directory — that this project can reference read-only. Content resolves fresh on demand (never a persistent clone you have to `git pull` yourself); `oprim context list` is the cheap way to see what's registered before pulling full content.

Full documentation: [github.com/eshraw/open-product-primer](https://github.com/eshraw/open-product-primer).
