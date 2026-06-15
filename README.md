<p align="center">
  <img src="plugins/ollama-codex/assets/logo.svg" alt="Ollama logo" width="96" />
</p>

# Ollama for Codex

[![Validate](https://github.com/daniel-p-green/ollama-codex-plugin/actions/workflows/validate.yml/badge.svg)](https://github.com/daniel-p-green/ollama-codex-plugin/actions/workflows/validate.yml)
[![Release](https://img.shields.io/github/v/release/daniel-p-green/ollama-codex-plugin)](https://github.com/daniel-p-green/ollama-codex-plugin/releases)
[![License](https://img.shields.io/github/license/daniel-p-green/ollama-codex-plugin)](LICENSE)

The missing visual control panel for Ollama in Codex.

Ollama can already work with Codex, but most people do not know that. Even when they do, using it means remembering the right `ollama launch` commands, knowing the difference between Codex App and Codex CLI profiles, and restoring things manually when they want to switch back.

This plugin solves that by giving Ollama a visual, reversible home inside Codex. Install it from the Codex plugin GUI, open the in-chat control panel, pick a local or Ollama Cloud model, configure the App or CLI, check readiness, pull models, or restore profiles without memorizing the command surface.

It is intentionally thin. The plugin does not hand-edit Codex config files. It delegates to Ollama's official commands, keeps Codex App and Codex CLI state separate, and makes restore explicit.

Use it when you want a Codex plugin with an actual in-Codex visual panel for:

- Opening an Ollama control panel directly inside Codex.
- Setting up Codex App with local or Ollama Cloud models.
- Switching Codex App to a specific Ollama model.
- Configuring a Codex CLI Ollama profile without launching a nested Codex session.
- Preparing exact terminal commands for Codex CLI runs with `codex --oss`, a specific model, or the generated `ollama-launch` profile.
- Listing or pulling Ollama models from inside Codex.
- Restoring Codex App or Codex CLI profiles safely and separately.

In short: the easiest visual way to enable, use, and safely switch back from Ollama options in Codex.

Official Ollama docs:

- [Codex App](https://docs.ollama.com/integrations/codex-app)
- [Codex CLI](https://docs.ollama.com/integrations/codex)
- [Ollama CLI Reference](https://docs.ollama.com/cli)

## 30-Second Install

```bash
git clone https://github.com/daniel-p-green/ollama-codex-plugin.git
cd ollama-codex-plugin
bash scripts/validate.sh
codex plugin marketplace add "$PWD"
codex plugin add ollama-codex@ollama-codex-local
```

Open a new Codex thread, then start with the visual panel:

```text
/ollama-codex-panel
```

The panel renders in chat and gives you buttons for readiness checks, model selection, App setup, App model switching, App restore, CLI config, CLI restore, model listing, and model pulls.

You can still use the command layer directly:

```text
/ollama-codex-status
/ollama-codex-app-use-model gemma4:31b
/ollama-codex-cli-config gpt-oss:20b
/ollama-codex-cli-run-model gpt-oss:120b
```

See [docs/demo.md](docs/demo.md) for a fuller dry-run demo and [docs/share.md](docs/share.md) for a short public post.

## GUI Experience

After install, `/ollama-codex-panel` renders an MCP-powered control panel inside Codex. It is the primary GUI for the plugin.

The panel shows:

- Ollama install/version readiness, including the v0.24.0 Codex App minimum.
- Ollama server reachability.
- Local Ollama models from `ollama ls`.
- Codex CLI install status.
- Whether the generated Codex CLI Ollama profile/catalog exists.
- Buttons for App setup, App model switching, App restore, CLI config, CLI restore, model listing, and model pulls.

Actions that may restart Codex or restore profile state require explicit confirmation in the panel.

The Codex plugin card also gives starter prompts for the workflows Ollama documents but Codex users would otherwise need to remember manually:

- Open the Ollama control panel
- Check Ollama readiness for Codex
- Set up Codex App with Ollama
- Switch Codex App to an Ollama model
- Configure Codex CLI with Ollama
- Run Codex CLI with an Ollama model
- Restore Codex App's previous profile

Those prompts route to the bundled skill and deterministic shell wrapper. The wrapper supports dry runs, reports readiness, and preserves Ollama's App/CLI restore boundaries.

## What It Enables

For Codex App:

- Configure Codex App to use Ollama's OpenAI-compatible endpoint.
- Use local models and Ollama Cloud models in the desktop app.
- Switch Codex App directly to a chosen model.
- Restore the previous Codex App profile.
- Keep built-in browser and review-mode workflows intact.

For Codex CLI:

- Launch Codex through Ollama with `ollama launch codex`.
- Configure Codex CLI without launching a nested Codex session by writing the documented `ollama-launch` profile and model catalog.
- Restore the Codex CLI Ollama launch profile and generated model catalog.
- Run `codex --oss`, `codex --oss -m <model>`, or `codex --profile ollama-launch`.
- List and pull Ollama models from inside Codex.

Codex App and Codex CLI restore paths are intentionally separate. Disabling the plugin also does not restore either profile; restore is always an explicit command.

## Requirements

- Codex App installed for App workflows.
- Codex CLI installed for CLI workflows.
- Ollama v0.24.0 or newer.

Codex CLI works best with models configured for at least a 64k context window, per Ollama's docs.

Check local readiness:

```bash
bash plugins/ollama-codex/scripts/ollama-codex.sh status
```

## Install In Codex

Clone the repo:

```bash
git clone https://github.com/daniel-p-green/ollama-codex-plugin.git
cd ollama-codex-plugin
```

Register the cloned repo as a local marketplace:

```bash
codex plugin marketplace add "$PWD"
```

Install the plugin:

```bash
codex plugin add ollama-codex@ollama-codex-local
```

Open a new Codex thread so the plugin skill and slash commands are available.

## Slash Commands

Status and model helpers:

```text
/ollama-codex-panel
/ollama-codex-status
/ollama-codex-list-models
/ollama-codex-pull-model gemma4:31b
```

Codex App:

```text
/ollama-codex-app-setup
/ollama-codex-app-use-model gemma4:31b
/ollama-codex-app-use-model kimi-k2.6:cloud
/ollama-codex-app-restore
```

Backward-compatible App aliases:

```text
/ollama-codex-setup
/ollama-codex-use-model gemma4:31b
/ollama-codex-restore
```

Codex CLI:

```text
/ollama-codex-cli-setup
/ollama-codex-cli-config gpt-oss:20b
/ollama-codex-cli-run
/ollama-codex-cli-run-model gpt-oss:120b
/ollama-codex-cli-run-model gpt-oss:120b-cloud
/ollama-codex-cli-run-profile
/ollama-codex-cli-restore
```

## Shell Wrapper

All commands route through one script:

```bash
bash plugins/ollama-codex/scripts/ollama-codex.sh status
```

Codex App:

```bash
bash plugins/ollama-codex/scripts/ollama-codex.sh app-setup
bash plugins/ollama-codex/scripts/ollama-codex.sh app-use-model gemma4:31b
bash plugins/ollama-codex/scripts/ollama-codex.sh app-restore
```

Codex CLI:

```bash
bash plugins/ollama-codex/scripts/ollama-codex.sh cli-setup
bash plugins/ollama-codex/scripts/ollama-codex.sh cli-config gpt-oss:20b
bash plugins/ollama-codex/scripts/ollama-codex.sh cli-run
bash plugins/ollama-codex/scripts/ollama-codex.sh cli-run-model gpt-oss:120b
bash plugins/ollama-codex/scripts/ollama-codex.sh cli-run-profile
bash plugins/ollama-codex/scripts/ollama-codex.sh cli-restore
```

Models:

```bash
bash plugins/ollama-codex/scripts/ollama-codex.sh list-models
bash plugins/ollama-codex/scripts/ollama-codex.sh pull-model gemma4:31b
```

Safe dry runs:

```bash
bash plugins/ollama-codex/scripts/ollama-codex.sh --dry-run app-setup
bash plugins/ollama-codex/scripts/ollama-codex.sh --dry-run app-use-model gemma4:31b
bash plugins/ollama-codex/scripts/ollama-codex.sh --dry-run app-restore
bash plugins/ollama-codex/scripts/ollama-codex.sh --dry-run cli-setup
bash plugins/ollama-codex/scripts/ollama-codex.sh --dry-run cli-config gpt-oss:20b
bash plugins/ollama-codex/scripts/ollama-codex.sh --dry-run cli-run-model gpt-oss:120b
bash plugins/ollama-codex/scripts/ollama-codex.sh --dry-run cli-restore
```

## Restore And Disable

Disable the plugin in the Codex plugin GUI, or remove it from local config:

```bash
codex plugin remove ollama-codex@ollama-codex-local
```

Removing or disabling the plugin does not restore Codex App or Codex CLI profile state.

Restore Codex App:

```bash
bash plugins/ollama-codex/scripts/ollama-codex.sh app-restore
```

Restore Codex CLI:

```bash
bash plugins/ollama-codex/scripts/ollama-codex.sh cli-restore
```

Before overwriting Codex App config files, Ollama saves backups under `~/.ollama/backup/codex-app/`. App setup, model switching, and restore use Ollama's `--yes` flag so plugin commands can complete the restart/profile flow.

## Troubleshooting

If Codex App does not open after setup, open Codex manually once and run App setup again:

```bash
bash plugins/ollama-codex/scripts/ollama-codex.sh app-setup
```

If Codex App is already running and does not switch models, quit Codex App and run the model command again.

If Codex CLI does not find the Ollama profile, run:

```bash
bash plugins/ollama-codex/scripts/ollama-codex.sh cli-config gpt-oss:20b
```

`cli-setup`, `cli-run`, `cli-run-model`, and `cli-run-profile` launch interactive Codex CLI sessions. The wrapper refuses to launch those from a non-interactive Codex shell by default; use the printed dry-run command in a real terminal, or set `OLLAMA_CODEX_ALLOW_INTERACTIVE=1` only when you intentionally want nested Codex.

If the status command reports the Ollama HTTP API is not reachable, start Ollama or run:

```bash
ollama serve
```

## Validate

Run the repo validation script:

```bash
bash scripts/validate.sh
```

Then reinstall from the local marketplace:

```bash
codex plugin add ollama-codex@ollama-codex-local
```

Open a new Codex thread to pick up updated skills and commands.

## Proof

- [GitHub Actions validation](https://github.com/daniel-p-green/ollama-codex-plugin/actions/workflows/validate.yml)
- [Release notes](https://github.com/daniel-p-green/ollama-codex-plugin/releases)
- [Demo walkthrough](docs/demo.md)
- [Romain-ready checklist](docs/romain-ready.md)

## Assets And License

The README and plugin card use the Ollama logo from Wikimedia Commons / the Ollama GitHub repository. See `plugins/ollama-codex/assets/OLLAMA-LOGO-LICENSE.md`.

This plugin is MIT licensed. See `LICENSE`.
