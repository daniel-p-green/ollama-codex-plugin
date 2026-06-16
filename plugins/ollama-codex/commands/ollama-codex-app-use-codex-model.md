---
description: Switch Codex App back to a native Codex/OpenAI model
argument-hint: <model>
---

Switch Codex App to a native Codex/OpenAI model from the same command workflow used for Ollama models:

```bash
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh app-use-codex-model $ARGUMENTS
```

This command backs up the Codex App config, restores away from an active Ollama profile when needed, and sets the documented Codex `model` key to the selected native model.
