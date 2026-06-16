<p align="center">
  <img src="plugins/ollama-codex/assets/logo.svg" alt="Ollama logo" width="96" />
</p>

# Ollama for Codex

[![Validate](https://github.com/daniel-p-green/ollama-codex-plugin/actions/workflows/validate.yml/badge.svg)](https://github.com/daniel-p-green/ollama-codex-plugin/actions/workflows/validate.yml)
[![Release](https://img.shields.io/github/v/release/daniel-p-green/ollama-codex-plugin)](https://github.com/daniel-p-green/ollama-codex-plugin/releases)
[![License](https://img.shields.io/github/license/daniel-p-green/ollama-codex-plugin)](LICENSE)

A Codex plugin command surface for using Ollama with Codex.

> Current status: this is a supported command/control plugin for the Codex Mac app and Codex CLI. It installs through the Codex plugin system, exposes a plugin card, starter prompts, skills, slash commands, MCP tools, status checks, dry runs, setup, model switching, model listing, model pulling, diagnostics, and explicit restore flows. It does not currently provide a verified native visual model-switching widget inside the Codex Mac app. The experimental `/ollama` widget path is kept for future host support and diagnostics, but JSON/tool output from that path is expected on current Codex builds and is not a setup failure.

Ollama can already work with Codex, but most people do not know that. Even when they do, using it means remembering the right `ollama launch` commands, knowing the difference between Codex App and Codex CLI profiles, and restoring things manually when they want to switch back.

This plugin solves the supported part of that problem: it makes Ollama discoverable and usable from Codex's plugin surface. Install it from the Codex plugin GUI, use the starter prompts or slash commands, check readiness, configure Codex App or Codex CLI, switch App models, list or pull Ollama models, and restore profiles without memorizing the command surface.

It is intentionally thin where it matters. Ollama App setup, Ollama model switching, and Ollama restore delegate to Ollama's official commands. Native Codex/OpenAI model switching uses Codex's documented `model` config key, makes a timestamped backup first, and clears top-level Ollama provider pointers when switching back to the OpenAI provider. Codex App and Codex CLI state stay separate, and restore remains explicit.

Use it when you want a Codex plugin for:

- Installing, enabling, disabling, and discovering Ollama workflows through the Codex plugin GUI.
- Starting supported Ollama workflows from Codex starter prompts and slash commands.
- Checking whether Ollama, the Ollama server, Codex CLI, and plugin wiring are ready.
- Setting up Codex App with local or Ollama Cloud models.
- Switching Codex App to a specific Ollama model.
- Switching Codex App back to a native Codex/OpenAI model with a backup first.
- Configuring a Codex CLI Ollama profile without launching a nested Codex session.
- Preparing exact terminal commands for Codex CLI runs with `codex --oss`, a specific model, or the generated `ollama-launch` profile.
- Listing or pulling Ollama models from inside Codex.
- Restoring Codex App or Codex CLI profiles safely and separately.

In short: the easiest supported way to make Ollama visible, usable, and reversible inside Codex today, while keeping provider/profile changes explicit.

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

Open a new Codex thread, then start with the command surface:

```text
/ollama-codex-doctor
/ollama-codex-status
```

Then use the supported workflows directly:

```text
/ollama-codex-app-use-codex-model gpt-5.4
/ollama-codex-app-use-model gemma4:31b
/ollama-codex-cli-config gpt-oss:20b
/ollama-codex-cli-run-model gpt-oss:120b
```

See [docs/demo.md](docs/demo.md) for a fuller dry-run demo, [docs/acceptance.md](docs/acceptance.md) for the current visual UI boundary and future acceptance checklist, and [docs/share.md](docs/share.md) for public copy that does not overclaim.

## Current Codex Experience

Today, the GUI is Codex's plugin GUI: the plugin card, starter prompts, enable/disable controls, slash-command discovery, and command output inside a Codex thread.

The Codex plugin card gives starter prompts for the workflows Ollama documents but Codex users would otherwise need to remember manually:

- Check Ollama readiness for Codex
- Set up Codex App with Ollama
- Switch Codex App to a native Codex/OpenAI model
- Switch Codex App to an Ollama model
- Configure Codex CLI with Ollama
- Run Codex CLI with an Ollama model
- Restore Codex App's previous profile

Those prompts route to the bundled skill and deterministic shell wrapper. The wrapper supports dry runs, reports readiness, and preserves Ollama's App/CLI restore boundaries.

This does not replace Codex's built-in model selector. Codex still has one active provider profile at a time. This plugin makes it easier to switch that profile deliberately, not to keep OpenAI and Ollama providers simultaneously active in one native picker.

## What Is Not Supported Yet

- A verified native in-chat visual model picker inside the Codex Mac app.
- Replacing or extending Codex's built-in top model dropdown.
- Keeping Codex/OpenAI models and Ollama models active at the same time.
- Silently restoring Codex App or Codex CLI profile state when the plugin is disabled.

The repo still contains an experimental MCP widget prototype behind `/ollama` and `/ollama-codex-panel`. It is useful for future host testing, but it is not part of the accepted product surface today. If those commands return JSON or structured tool output instead of a visible widget, that confirms the current Codex host is not mounting the widget surface for this repo-local plugin.

## Roadmap: Visual UI

When Codex exposes a supported plugin-hosted visual surface for repo-local plugins, the roadmap is to turn the current command/control layer into a first-class visual Ollama control panel:

- A native in-Codex model picker for Ollama options.
- Codex/OpenAI and Ollama model catalogs visible side by side for comparison.
- Clear active-provider and saved-profile state before switching.
- One-click setup, switch, restore, list, pull, and doctor actions.
- Separate Codex App and Codex CLI lanes so restore boundaries stay obvious.
- Direct handoff to Ollama's official commands for App setup, App model switching, and App restore.
- No claim to replace Codex's built-in model dropdown unless Codex exposes that extension point.

## What It Enables

For Codex App:

- Configure Codex App to use Ollama's OpenAI-compatible endpoint.
- Use local models and Ollama Cloud models in the desktop app.
- Switch Codex App directly to a chosen Ollama model.
- Switch Codex App back to a native Codex/OpenAI model with a Codex config backup.
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
/ollama-codex-doctor
/ollama-codex-status
/ollama-codex-list-models
/ollama-codex-pull-model gemma4:31b
```

Experimental visual UI probes:

```text
/ollama
/ollama-codex-panel
```

These probe the future MCP widget path. They are not the accepted GUI surface today.

Codex App:

```text
/ollama-codex-app-setup
/ollama-codex-app-use-codex-model gpt-5.4
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
bash plugins/ollama-codex/scripts/ollama-codex.sh doctor
```

Codex App:

```bash
bash plugins/ollama-codex/scripts/ollama-codex.sh app-setup
bash plugins/ollama-codex/scripts/ollama-codex.sh app-use-codex-model gpt-5.4
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
bash plugins/ollama-codex/scripts/ollama-codex.sh --dry-run app-use-codex-model gpt-5.4
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

If you reinstall or update the plugin while a Codex thread is already open, start a fresh Codex thread before testing commands again. Active threads can keep MCP tool handles from the previous cache-busted plugin path until the thread is recreated.

If any plugin MCP command fails with `Transport closed`, run the doctor command from the same thread or a shell:

```text
/ollama-codex-doctor
```

```bash
bash plugins/ollama-codex/scripts/ollama-codex.sh doctor
```

If the doctor shows the installed plugin and MCP config are current, the remaining fix is to open a fresh Codex thread so Codex reloads the plugin MCP server.

For the visual UI boundary and future acceptance checklist, use [docs/acceptance.md](docs/acceptance.md). A source probe or standalone widget fixture is useful regression coverage, but it is not proof that Codex Mac app has accepted a native plugin widget.

Run the local preflight before testing plugin wiring:

```bash
./scripts/acceptance-preflight.sh
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

Open a new Codex thread to pick up updated skills, commands, and MCP tools.

## Proof

- [GitHub Actions validation](https://github.com/daniel-p-green/ollama-codex-plugin/actions/workflows/validate.yml)
- [Release notes](https://github.com/daniel-p-green/ollama-codex-plugin/releases)
- [Demo walkthrough](docs/demo.md)
- [Romain-ready checklist](docs/romain-ready.md)

## Assets And License

The README and plugin card use the Ollama logo from Wikimedia Commons / the Ollama GitHub repository. See `plugins/ollama-codex/assets/OLLAMA-LOGO-LICENSE.md`.

This plugin is MIT licensed. See `LICENSE`.
