---
description: Check Ollama readiness for Codex App and CLI
allowed-tools: ["Bash(bash:*)"]
---

Run the bundled status checker:

```bash
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh status
```

Report whether:

- `ollama` is installed
- Ollama is at least v0.24.0
- the Ollama HTTP API is reachable
- local models are available
- `codex` is installed
- Codex CLI Ollama profile/catalog files exist
- Codex App backup files exist

If the Ollama HTTP API is not reachable, explain that setup can still be available if the `ollama` CLI is installed, but local model serving may need Ollama to be started.
