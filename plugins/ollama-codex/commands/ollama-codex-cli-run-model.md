---
description: Run Codex CLI with a specific Ollama model
argument-hint: [model]
allowed-tools: ["Bash(bash:*)"]
---

Run Codex CLI in OSS mode with the exact model supplied in the command arguments.

If no model name is supplied, ask for the exact model name before running anything.

If a model name is supplied, run:

```bash
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh cli-run-model $ARGUMENTS
```

Preserve tags such as `:cloud`. For Codex CLI, prefer models with at least a 64k context window.
