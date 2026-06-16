---
description: Diagnose Ollama for Codex plugin wiring and stale-thread issues
allowed-tools: ["Bash(bash:*)"]
---

Run the bundled plugin doctor:

```bash
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh doctor
```

Use this when MCP calls fail with `Transport closed`, the experimental `/ollama` probe returns an unexpected result, or the user has just installed or updated the plugin.

Report:

- The installed plugin root and version.
- Whether `/ollama`, the experimental visual UI probe command, `.mcp.json`, and the MCP server exist.
- Whether `codex mcp get ollama_codex` points at the same installed plugin root.
- Ollama and Codex readiness from the normal status check.
- If the current thread has stale MCP handles, explain that the fix is to open a fresh Codex thread after installing or updating the plugin.
