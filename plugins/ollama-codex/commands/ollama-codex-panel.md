---
description: Open the Ollama for Codex visual control panel
allowed-tools: ["Bash(bash:*)"]
---

Start the bundled local control panel and open it in Codex's browser:

```bash
bash ${CLAUDE_PLUGIN_ROOT}/scripts/ollama-codex.sh panel --port 17841 --open
```

If a panel server is already running, open:

```text
http://127.0.0.1:17841
```

The panel runs on localhost only. It can check readiness, list local models, pull models, configure Codex CLI, restore Codex CLI, set up Codex App, switch Codex App models, and restore Codex App. App actions may restart Codex and require explicit confirmation in the panel.
