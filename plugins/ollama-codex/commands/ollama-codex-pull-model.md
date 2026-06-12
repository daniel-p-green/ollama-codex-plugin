---
description: Pull an Ollama model for Codex
argument-hint: [model]
allowed-tools: ["Bash(bash:*)"]
---

Pull the exact Ollama model supplied in the command arguments.

If no model name is supplied, ask for the exact model name before running anything.

If a model name is supplied, run:

```bash
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh pull-model $ARGUMENTS
```

Do not invent or normalize model names. Preserve tags such as `:cloud`.
