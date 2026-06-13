---
description: Launch Codex CLI through Ollama
allowed-tools: ["Bash(bash:*)"]
---

Run Ollama's supported Codex CLI quick setup:

```bash
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh --dry-run cli-setup
```

Report that `ollama launch codex` refreshes the model catalog and launches a dedicated interactive Codex profile for that session. Because this starts Codex CLI, tell the user to run the printed command from a real terminal unless they explicitly ask to allow nested Codex.
