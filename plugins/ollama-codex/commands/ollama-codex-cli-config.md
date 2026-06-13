---
description: Configure Codex CLI for Ollama without launching
argument-hint: [model]
allowed-tools: ["Bash(bash:*)"]
---

Configure Codex CLI for the exact Ollama model supplied in the command arguments without launching an interactive Codex session.

If no model name is supplied, ask for the exact model name before running anything.

If a model name is supplied, run:

```bash
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh cli-config $ARGUMENTS
```

This writes the documented `ollama-launch` CLI profile and model catalog. Preserve model tags exactly, such as `:cloud`.
