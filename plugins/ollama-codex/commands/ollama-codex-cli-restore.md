---
description: Restore Codex CLI after Ollama setup
allowed-tools: ["Bash(bash:*)"]
---

Restore Codex CLI by removing the Ollama launch profile and generated model catalog:

```bash
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh cli-restore
```

Treat Codex CLI restore and Codex App restore as separate actions. Do not imply this restores Codex App.
