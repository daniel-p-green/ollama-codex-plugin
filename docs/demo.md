# Demo

This demo shows the plugin without mutating Codex App or Codex CLI profile state. Setup, model switching, launch, and restore commands are shown with `--dry-run`.

## Install

```bash
git clone https://github.com/daniel-p-green/ollama-codex-plugin.git
cd ollama-codex-plugin
codex plugin marketplace add "$PWD"
codex plugin add ollama-codex@ollama-codex-local
```

Open a new Codex thread and try:

```text
/ollama-codex-status
/ollama-codex-app-use-model gemma4:31b
/ollama-codex-cli-config
/ollama-codex-cli-run-model gpt-oss:120b
```

## One-Command Local Proof

```bash
bash scripts/demo.sh
```

The demo runs:

- Package validation.
- Local readiness checks.
- Codex App dry runs.
- Codex CLI dry runs.
- Model helper dry runs.

## Expected Dry-Run Shape

```text
+ ollama launch codex-app
+ ollama launch codex-app --model gemma4:31b
+ ollama launch codex-app --model kimi-k2.6:cloud
+ ollama launch codex-app --restore
+ ollama launch codex
+ ollama launch codex --config
+ codex --oss
+ codex --oss -m gpt-oss:120b
+ codex --oss -m gpt-oss:120b-cloud
+ codex --profile ollama-launch
+ ollama launch codex --restore
+ ollama ls
+ ollama pull gemma4:31b
```

## Safety Boundary

The demo intentionally avoids real setup and restore commands. Real commands change Codex App or Codex CLI profile state, so they remain explicit user actions:

```bash
bash plugins/ollama-codex/scripts/ollama-codex.sh app-setup
bash plugins/ollama-codex/scripts/ollama-codex.sh cli-config
bash plugins/ollama-codex/scripts/ollama-codex.sh app-restore
bash plugins/ollama-codex/scripts/ollama-codex.sh cli-restore
```
