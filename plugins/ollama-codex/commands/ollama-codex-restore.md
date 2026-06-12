---
description: Restore Codex App profile after Ollama setup
allowed-tools: ["Bash(bash:*)"]
---

Restore Codex App to the profile used before Ollama configured it:

```bash
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh restore
```

Treat plugin disablement and Codex App restore as separate actions. Removing the plugin does not automatically restore Codex App profile state.
