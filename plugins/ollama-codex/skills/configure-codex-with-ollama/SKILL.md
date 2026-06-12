---
name: configure-codex-with-ollama
description: This skill should be used when the user asks to "set up Codex App with Ollama", "use Ollama with Codex", "switch Codex App to an Ollama model", "run Codex with a local model", "restore Codex App after Ollama", "check Ollama Codex status", or mentions `ollama launch codex-app`.
version: 0.1.0
---

# Configure Codex With Ollama

Use this skill to route Codex App setup through Ollama's supported launch commands. Keep the integration thin: verify local readiness, run the official Ollama command, and report what changed or what still needs attention.

## Core Rule

Delegate configuration to Ollama. Do not edit Codex App configuration files directly.

Supported commands:

```bash
ollama launch codex-app
ollama launch codex-app --model <model>
ollama launch codex-app --restore
```

Use the bundled wrapper for deterministic checks and dry-run support:

```bash
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh status
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh setup
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh use-model gemma4:31b
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh restore
```

For non-mutating verification:

```bash
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh --dry-run setup
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh --dry-run use-model gemma4:31b
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh --dry-run restore
```

## Workflow

1. Run status first when the user's request includes "check", "verify", "status", "why is this not working", or any troubleshooting language.
2. Confirm Ollama is installed and at least v0.24.0 before setup, model switching, or restore.
3. For setup, run `bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh setup`.
4. For a specific model, require an exact model name and run `bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh use-model <model>`.
5. For restore, run `bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh restore`.
6. If Codex App is already open and Ollama prompts to restart it, surface that prompt honestly instead of claiming the switch is complete.
7. After setup or restore, report the command that ran and any output that affects the next user action.

## Model Names

Accept both local model names and Ollama Cloud model names exactly as provided. Examples from the official docs include:

```text
gemma4:31b
kimi-k2.6:cloud
```

Do not invent model names. If no model is provided, ask for the exact model name or suggest running status/listing commands first.

## Restore Behavior

Treat plugin disablement and Codex App restore as separate actions:

- Disabling or removing this plugin stops the plugin from being available in Codex.
- Restoring Codex App requires `ollama launch codex-app --restore` or the bundled `restore` wrapper.

Ollama stores backups under `~/.ollama/backup/codex-app/` before overwriting Codex App config files. Do not claim a restore happened unless the restore command was actually run.

## References

Read `references/ollama-codex-docs.md` when exact official command behavior, minimum version, backups, or CLI versus App distinctions matter.
