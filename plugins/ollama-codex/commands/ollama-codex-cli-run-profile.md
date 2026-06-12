---
description: Run Codex CLI with the Ollama launch profile
allowed-tools: ["Bash(bash:*)"]
---

Run Codex CLI with the generated Ollama launch profile:

```bash
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh cli-run-profile
```

If the profile does not exist, run `/ollama-codex-cli-config` first or explain that `ollama launch codex --config` creates the profile.
