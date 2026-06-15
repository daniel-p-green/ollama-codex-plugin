---
name: configure-codex-with-ollama
description: This skill should be used when the user asks to "open the Ollama control panel", "set up Codex App with Ollama", "configure Codex CLI with Ollama", "use Ollama with Codex", "switch Codex App to a Codex model", "switch Codex App to an Ollama model", "run Codex with a local model", "run Codex with an Ollama Cloud model", "restore Codex after Ollama", "check Ollama Codex status", or mentions `ollama launch codex-app`, `ollama launch codex`, `codex --oss`, or `codex --profile ollama-launch`.
version: 0.4.0
---

# Configure Codex With Ollama

Use this skill to route Codex App and Codex CLI setup through the Ollama for Codex plugin. Keep the integration thin: verify local readiness, run the official Ollama or documented Codex config path, and report exactly what changed or what still needs attention.

## Core Rule

Delegate Ollama-side Codex App configuration to Ollama whenever an official `ollama launch codex-app` command exists. For switching back to a native Codex/OpenAI model from the panel, use the wrapper's `app-use-codex-model <model>` command, which backs up Codex App config and edits the documented top-level `model` key.

For Codex CLI profile setup, use the wrapper's deterministic `cli-config <model>` command. Live acceptance testing on Ollama 0.30.8 showed that `ollama launch codex --config --model <model>` writes the expected profile/catalog and then can still launch an interactive Codex TUI. The plugin avoids that nested-session surprise by writing the documented `ollama-launch` CLI profile and model catalog directly.

Use the bundled wrapper for deterministic checks, dry-run support, and consistent command names:

```bash
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh status
```

## Visual Control Panel

When the user asks for the GUI, visual panel, control panel, or easiest way to manage Ollama in Codex, render the in-Codex MCP widget:

Use the `render_ollama_codex_panel` tool from the `ollama_codex` MCP server. In Codex tool notation this is expected to appear as `mcp__ollama_codex__render_ollama_codex_panel`.

The panel is the preferred user-facing surface. It renders inside Codex, shows the active Codex/OpenAI profile beside Ollama's recommended and local model choices, accepts typed cloud model tags, and uses MCP tools backed by the same wrapper for native Codex model switching, Ollama setup, Ollama model switching, restore, CLI config, and model pulls.

Do not describe the plugin card, starter prompts, or localhost browser panel as the full GUI. The GUI is the MCP app widget served by `mcp/server.mjs`.

If the `render_ollama_codex_panel` tool is not available in the current Codex thread, or if the MCP call fails with `Transport closed`, say so plainly and run the plugin doctor if the command layer is available:

```bash
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh doctor
```

Then ask the user to open a fresh Codex thread after installing or updating the plugin. Do not fall back to calling a localhost panel the plugin GUI.

## Status And Discovery

Run status first when the user's request includes "check", "verify", "status", "doctor", "why is this not working", or troubleshooting language:

```bash
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh status
```

Report:

- Whether `ollama` is installed.
- Whether Ollama is at least v0.24.0.
- Whether the Ollama HTTP API is reachable.
- A brief local model summary when available.
- Whether `codex` is installed.
- Whether Codex CLI Ollama profile/catalog files exist.
- Whether Codex App backup files exist.

For model discovery:

```bash
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh list-models
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh pull-model <model>
```

Preserve model names exactly, including tags such as `:cloud`.

## Codex App Workflows

Use these commands for OpenAI's desktop Codex App on macOS or Windows:

```bash
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh app-setup
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh app-use-codex-model gpt-5.4
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh app-use-model gemma4:31b
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh app-use-model kimi-k2.6:cloud
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh app-restore
```

Backward-compatible aliases remain available:

```bash
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh setup
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh use-model gemma4:31b
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh restore
```

Use `app-setup` for "Set up Codex App with Ollama".
Use `app-use-codex-model <model>` for "Switch Codex App to a native Codex/OpenAI model".
Use `app-use-model <model>` for "Switch Codex App to an Ollama model".
Use `app-restore` for "Restore Codex App's previous profile".

The wrapper passes Ollama's `--yes` flag for Ollama App setup, Ollama model switching, and restore so the command can complete the restart/profile flow. `app-use-codex-model` backs up Codex App config, restores away from an active Ollama profile when possible, and sets the native Codex model. Report that Codex may restart or require a fresh task. Do not claim the switch or restore completed unless the command completed.

## Codex CLI Workflows

Use these commands for the `codex` terminal CLI:

```bash
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh cli-setup
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh cli-config gpt-oss:20b
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh cli-restore
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh cli-run
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh cli-run-model gpt-oss:120b
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh cli-run-model gpt-oss:120b-cloud
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh cli-run-profile
```

Use `cli-setup` for `ollama launch codex`, which refreshes the model catalog and launches a dedicated interactive Codex profile for that session.
Use `cli-config <model>` to write the documented `ollama-launch` profile and model catalog without launching a nested Codex session.
Use `cli-restore` for `ollama launch codex --restore`, which removes the Ollama launch profile and generated model catalog.
Use `cli-run` for `codex --oss`.
Use `cli-run-model <model>` for `codex --oss -m <model>`.
Use `cli-run-profile` for `codex --profile ollama-launch`.

For Codex CLI model selection, prefer models with at least a 64k context window, per Ollama's guidance.

`cli-setup`, `cli-run`, `cli-run-model`, and `cli-run-profile` launch interactive Codex CLI sessions. In normal Codex plugin use, run them with `--dry-run` and tell the user to run the printed command in a real terminal. Only run them directly when the user explicitly asks for nested Codex and `OLLAMA_CODEX_ALLOW_INTERACTIVE=1` is set.

## Dry Runs

Use `--dry-run` before mutating App or CLI state when verifying command routing:

```bash
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh --dry-run app-setup
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh --dry-run app-use-codex-model gpt-5.4
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh --dry-run app-use-model gemma4:31b
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh --dry-run app-restore
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh --dry-run cli-setup
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh --dry-run cli-config gpt-oss:20b
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh --dry-run cli-restore
```

## Restore Boundaries

Treat plugin disablement, Codex App restore, and Codex CLI restore as separate actions:

- Disabling or removing this plugin stops the plugin from being available in Codex.
- Restoring Codex App requires `ollama launch codex-app --restore` or `app-restore`.
- Restoring Codex CLI requires `ollama launch codex --restore` or `cli-restore`.

Do not imply one restore command affects both profiles.

## References

Read `references/ollama-codex-docs.md` when exact official command behavior, minimum version, model examples, backups, troubleshooting, or Codex CLI versus Codex App distinctions matter.
