# Ollama Codex Reference

This reference summarizes the official Ollama documentation used by the plugin. Re-check the documentation index before adding behavior because Ollama integration commands can change.

## Documentation Index

Ollama publishes a documentation index at:

https://docs.ollama.com/llms.txt

The index currently includes both Codex pages:

- Codex App: https://docs.ollama.com/integrations/codex-app.md
- Codex CLI: https://docs.ollama.com/integrations/codex.md

## Codex App

Official page:

https://docs.ollama.com/integrations/codex-app

Codex App is OpenAI's desktop coding agent for macOS and Windows. Ollama configures the App to use Ollama's OpenAI-compatible endpoint so Codex App can work with local models and Ollama Cloud models.

Codex App support requires Ollama v0.24.0 or newer.

Supported quick setup:

```bash
ollama launch codex-app
ollama launch codex-app --yes
```

Supported model selection:

```bash
ollama launch codex-app --model kimi-k2.6:cloud
ollama launch codex-app --model gemma4:31b
ollama launch codex-app --model gemma4:31b --yes
```

Supported restore:

```bash
ollama launch codex-app --restore
ollama launch codex-app --restore --yes
```

Important App behavior:

- `ollama launch codex-app` configures Codex App to use Ollama's OpenAI-compatible endpoint.
- After setup, start a Codex task or open a repository as usual.
- Codex App's built-in browser can still open local servers and sites.
- Review mode can still inspect code changes, leave comments, and iterate on fixes.
- Running with a model persists that model selection for the next Codex App launch.
- Restore switches Codex App back to the profile used before `ollama launch codex-app`.
- If Codex App is open during restore or model switching, Ollama may ask before restarting it.
- The plugin wrapper uses `--yes` for App setup, model switching, and restore so a GUI command does not fail after partially changing profile state.
- Before overwriting Codex App config files, Ollama saves backups under `~/.ollama/backup/codex-app/`.
- On Windows, `~` resolves to the user's profile directory.
- Codex exposes one active `model_provider` at a time. The plugin's visual switcher shows Codex/OpenAI and Ollama rows together, but provider switching remains explicit.
- The plugin's `app-use-codex-model <model>` path is not an Ollama command. It backs up Codex App config, restores away from an active Ollama profile when needed, and sets Codex's documented native `model` key for OpenAI/Codex rows.

Troubleshooting behavior:

- If Codex App does not open after setup, open Codex manually once and run `ollama launch codex-app` again.
- If Codex App is already running and does not switch models, allow Ollama to restart it when prompted, or quit Codex App and run setup again.

## Codex CLI

Official page:

https://docs.ollama.com/integrations/codex

Install Codex CLI before using the CLI integration:

```bash
npm install -g @openai/codex
```

Ollama recommends a context window of at least 64k tokens for Codex CLI.

Supported quick setup:

```bash
ollama launch codex
```

When launched through `ollama launch codex`, Ollama refreshes the model catalog and uses a dedicated Codex profile for that session.

Supported config-only setup:

```bash
ollama launch codex --config
```

Live plugin acceptance testing on Ollama 0.30.8 found that `ollama launch codex --config --model <model>` wrote the expected `~/.codex/ollama-launch.config.toml` and `~/.codex/model.json` files, then still launched an interactive Codex TUI. To keep Codex plugin use non-surprising, the wrapper's `cli-config <model>` writes the documented CLI profile and model catalog directly. Codex App configuration is still delegated to `ollama launch codex-app`.

Supported CLI restore:

```bash
ollama launch codex --restore
```

This removes the Ollama launch profile and generated model catalog for Codex CLI.

Supported manual CLI usage:

```bash
codex --oss
codex --oss -m gpt-oss:120b
codex --oss -m gpt-oss:120b-cloud
```

Supported profile-based CLI usage after creating or generating the profile:

```bash
codex --profile ollama-launch
```

The profile-based setup described by Ollama uses:

```toml
model = "gpt-oss:120b"
model_provider = "ollama-launch"
model_catalog_json = "~/.codex/model.json"

[model_providers.ollama-launch]
name = "Ollama"
base_url = "http://localhost:11434/v1/"
wire_api = "responses"
```

Prefer Ollama's official CLI behavior when launching from a real terminal. From inside the Codex plugin GUI, prefer the wrapper's deterministic `cli-config <model>` command so setup does not nest a second Codex session.

## Ollama Model Helpers

The plugin includes model helper commands for common setup needs:

```bash
ollama ls
ollama pull <model>
```

Use model names exactly as supplied by the user or Ollama docs. Preserve tags such as `:cloud`.

## Implementation Rules

- Delegate Ollama App setup, Ollama model selection, App restore, CLI setup, and CLI restore to `ollama launch`.
- For native Codex/OpenAI row switching, back up Codex App config and only edit the documented top-level `model`, `model_provider`, and `model_catalog_json` keys needed to return to the OpenAI provider.
- Use the wrapper's documented CLI profile writer for non-launching CLI config inside Codex.
- Keep Codex App restore and Codex CLI restore separate.
- Treat plugin disablement as separate from restore. Disabling the plugin should not silently restore App or CLI profile state.
