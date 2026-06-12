# Ollama Codex App Reference

This reference summarizes the official Ollama documentation used by the plugin.

## Documentation Index

Ollama publishes a documentation index at:

https://docs.ollama.com/llms.txt

Use that index to discover the current Ollama docs before adding new behavior.

## Codex App

Official page:

https://docs.ollama.com/integrations/codex-app.md

Codex App support requires Ollama v0.24.0 or newer.

Supported setup command:

```bash
ollama launch codex-app
```

Supported model selection command:

```bash
ollama launch codex-app --model kimi-k2.6:cloud
ollama launch codex-app --model gemma4:31b
```

Supported restore command:

```bash
ollama launch codex-app --restore
```

Important behavior:

- `ollama launch codex-app` configures Codex App to use Ollama's OpenAI-compatible endpoint.
- Codex App can then work with local models and Ollama Cloud models in the desktop app.
- After setup, start a task or open a repository as usual.
- The built-in browser can still open local servers and sites.
- Review mode can still inspect code changes, leave comments, and iterate on fixes.
- Running with a model persists that model selection for the next Codex App launch.
- Restore switches Codex App back to the profile used before Ollama configured it.
- Ollama saves backups under `~/.ollama/backup/codex-app/` before overwriting Codex App config files.
- Codex CLI and Codex App profiles are separate in Ollama Launch.

Troubleshooting behavior:

- If Codex App does not open after setup, open Codex manually once and run `ollama launch codex-app` again.
- If Codex App is already running and does not switch models, allow Ollama to restart it when prompted, or quit Codex App and run setup again.

## Codex CLI

Official page:

https://docs.ollama.com/integrations/codex.md

The plugin focuses on Codex App. Codex CLI setup remains documented for users who need it:

```bash
ollama launch codex
ollama launch codex --config
ollama launch codex --restore
codex --oss
codex --oss -m gpt-oss:120b
```

Do not mix Codex CLI restore behavior with Codex App restore behavior. Use `ollama launch codex-app --restore` for Codex App.

## Implementation Rule

Delegate setup, model selection, and restore to `ollama launch`. Do not write or patch Codex App configuration files directly.
