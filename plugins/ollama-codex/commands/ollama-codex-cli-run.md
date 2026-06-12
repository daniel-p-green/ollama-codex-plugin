---
description: Run Codex CLI with Ollama OSS mode
argument-hint: [model]
allowed-tools: ["Bash(bash:*)"]
---

Run Codex CLI in Ollama-compatible OSS mode.

If a model is supplied, run:

```bash
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh cli-run-model $ARGUMENTS
```

If no model is supplied, run:

```bash
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh cli-run
```

Preserve local and cloud model names exactly as supplied. For Codex CLI, prefer models with at least a 64k context window.
