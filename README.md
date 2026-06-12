# Ollama for Codex

A repo-local Codex plugin that makes it easy to configure Codex App with Ollama from the Codex plugin UI.

Ollama configures Codex App to use Ollama's OpenAI-compatible endpoint, so Codex can work with local models and Ollama Cloud models in the desktop app.

The plugin delegates setup and restore to Ollama's official commands:

- `ollama launch codex-app`
- `ollama launch codex-app --model <model>`
- `ollama launch codex-app --restore`

It does not hand-edit Codex App configuration files. Ollama handles persistence, backups, and restore behavior.

The plugin card uses the Ollama logo from Wikimedia Commons / the Ollama GitHub repository. See `plugins/ollama-codex/assets/OLLAMA-LOGO-LICENSE.md`.

Official docs: https://docs.ollama.com/integrations/codex-app

## Requirements

- Codex CLI installed
- Codex App installed
- Ollama v0.24.0 or newer

Check local readiness:

```bash
bash plugins/ollama-codex/scripts/ollama-codex.sh status
```

## What Ollama Enables In Codex App

After setup, open Codex App and start a task or open a repository as usual. Ollama's integration keeps the normal Codex App experience intact:

- Local models and Ollama Cloud models are available through Ollama's OpenAI-compatible endpoint.
- Codex App's built-in browser can still open local servers and sites.
- Review mode can still inspect code changes, comments, and fixes inside the app.
- Running setup or model selection is persistent, so the selected model is remembered for future Codex App launches.

The Codex App profile managed by `ollama launch codex-app` is separate from the Codex CLI profile managed by `ollama launch codex`.

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

After installing, open a new Codex thread so the plugin skill and slash commands are available.

For this local workspace, the equivalent marketplace path is:

```bash
codex plugin marketplace add /Users/danielgreen/Documents/GitHub/ollama-codex-plugin
```

## Use

From Codex, use the plugin card starter prompts:

- Set up Codex App with Ollama
- Switch Codex App to an Ollama model
- Restore Codex App's previous profile

Or use the slash commands:

- `/ollama-codex-status`
- `/ollama-codex-setup`
- `/ollama-codex-use-model gemma4:31b`
- `/ollama-codex-restore`

The direct shell equivalents are:

```bash
bash plugins/ollama-codex/scripts/ollama-codex.sh setup
bash plugins/ollama-codex/scripts/ollama-codex.sh use-model gemma4:31b
bash plugins/ollama-codex/scripts/ollama-codex.sh restore
```

Examples from the official Ollama docs:

```bash
ollama launch codex-app --model kimi-k2.6:cloud
ollama launch codex-app --model gemma4:31b
```

For safe verification without changing Codex App profile state:

```bash
bash plugins/ollama-codex/scripts/ollama-codex.sh --dry-run setup
bash plugins/ollama-codex/scripts/ollama-codex.sh --dry-run use-model gemma4:31b
bash plugins/ollama-codex/scripts/ollama-codex.sh --dry-run restore
```

## Disable Or Remove

Disable the plugin in the Codex plugin GUI, or remove it from local config:

```bash
codex plugin remove ollama-codex@ollama-codex-local
```

Removing or disabling the plugin does not restore Codex App's previous profile. To restore Codex App, run:

```bash
bash plugins/ollama-codex/scripts/ollama-codex.sh restore
```

or:

```bash
ollama launch codex-app --restore
```

Before overwriting Codex App config files, Ollama saves backups under `~/.ollama/backup/codex-app/`.

If Codex App is open during restore, Ollama may ask before restarting it.

## Troubleshooting

If Codex App does not open after setup, open Codex manually once and run setup again:

```bash
bash plugins/ollama-codex/scripts/ollama-codex.sh setup
```

If Codex App is already running and does not switch models, allow Ollama to restart it when prompted, or quit Codex App and run the model command again.

## Update

After editing the local plugin, validate it:

```bash
python3 /Users/danielgreen/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py plugins/ollama-codex
```

Then reinstall from the local marketplace:

```bash
codex plugin add ollama-codex@ollama-codex-local
```

Start a new Codex thread to pick up updated skills and commands.
