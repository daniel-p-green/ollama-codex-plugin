---
description: Check Ollama readiness for Codex App
allowed-tools: ["Bash(bash:*)"]
---

Run the bundled status checker:

```bash
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh status
```

Report whether:

- `ollama` is installed
- Ollama is at least v0.24.0
- the Ollama server is reachable
- `codex` is installed

If the Ollama server is not reachable, explain that setup can still be available if the `ollama` CLI is installed, but local model serving may need Ollama to be started.
