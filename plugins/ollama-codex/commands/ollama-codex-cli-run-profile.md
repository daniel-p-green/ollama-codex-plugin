---
description: Run Codex CLI with the Ollama launch profile
allowed-tools: ["Bash(bash:*)"]
---

Run Codex CLI with the generated Ollama launch profile:

```bash
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh --dry-run cli-run-profile
```

If the profile does not exist, run `/ollama-codex-cli-config <model>` first. Because this starts Codex CLI, tell the user to run the printed command from a real terminal unless they explicitly ask to allow nested Codex.
