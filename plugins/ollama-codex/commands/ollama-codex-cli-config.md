---
description: Configure Codex CLI for Ollama without launching
allowed-tools: ["Bash(bash:*)"]
---

Configure Codex CLI for Ollama without launching an interactive Codex session:

```bash
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh cli-config
```

Prefer this command over manually writing `~/.codex/ollama-launch.config.toml`.
