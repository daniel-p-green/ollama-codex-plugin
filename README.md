# Ollama for Codex

A Codex plugin that makes Ollama a first-class option for both Codex App and Codex CLI.

The plugin does not patch Codex config files by hand. It delegates to Ollama's official integration commands, adds Codex GUI starter prompts and slash commands, and provides a deterministic wrapper for status checks, dry runs, model helpers, setup, launch, and restore.

Official Ollama docs:

- [Codex App](https://docs.ollama.com/integrations/codex-app)
- [Codex CLI](https://docs.ollama.com/integrations/codex)
- [Ollama CLI Reference](https://docs.ollama.com/cli)

## What It Enables

For Codex App:

- Configure Codex App to use Ollama's OpenAI-compatible endpoint.
- Use local models and Ollama Cloud models in the desktop app.
- Switch Codex App directly to a chosen model.
- Restore the previous Codex App profile.
- Keep built-in browser and review-mode workflows intact.

For Codex CLI:

- Launch Codex through Ollama with `ollama launch codex`.
- Configure Codex CLI without launching via `ollama launch codex --config`.
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

## GUI Prompts

The Codex plugin card provides starter prompts for:

- Check Ollama readiness for Codex
- Set up Codex App with Ollama
- Switch Codex App to an Ollama model
- Configure Codex CLI with Ollama
- Run Codex CLI with an Ollama model
- Restore Codex App's previous profile

## Slash Commands

Status and model helpers:

```text
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
/ollama-codex-cli-config
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
bash plugins/ollama-codex/scripts/ollama-codex.sh cli-config
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
bash plugins/ollama-codex/scripts/ollama-codex.sh --dry-run cli-config
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

Before overwriting Codex App config files, Ollama saves backups under `~/.ollama/backup/codex-app/`. If Codex App is open during restore, Ollama may ask before restarting it.

## Troubleshooting

If Codex App does not open after setup, open Codex manually once and run App setup again:

```bash
bash plugins/ollama-codex/scripts/ollama-codex.sh app-setup
```

If Codex App is already running and does not switch models, allow Ollama to restart it when prompted, or quit Codex App and run the model command again.

If Codex CLI does not find the Ollama profile, run:

```bash
bash plugins/ollama-codex/scripts/ollama-codex.sh cli-config
```

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

## Assets And License

The plugin card uses the Ollama logo from Wikimedia Commons / the Ollama GitHub repository. See `plugins/ollama-codex/assets/OLLAMA-LOGO-LICENSE.md`.

This plugin is MIT licensed. See `LICENSE`.
