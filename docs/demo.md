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
/ollama-codex-panel
/ollama-codex-status
/ollama-codex-app-use-model gemma4:31b
/ollama-codex-cli-config gpt-oss:20b
/ollama-codex-cli-run-model gpt-oss:120b
```

The panel renders directly in the Codex conversation.

## One-Command Local Proof

```bash
bash scripts/demo.sh
```

The demo runs:

- Package validation.
- Local readiness checks.
- In-Codex panel command routing.
- Codex App dry runs.
- Codex CLI dry runs.
- Model helper dry runs.

## Expected Dry-Run Shape

```text
+ ollama launch codex-app --yes
+ ollama launch codex-app --model gemma4:31b --yes
+ ollama launch codex-app --model kimi-k2.6:cloud --yes
+ ollama launch codex-app --restore --yes
+ ollama launch codex
[info] would write Codex CLI profile: ~/.codex/ollama-launch.config.toml
[info] would write Codex CLI model catalog: ~/.codex/model.json
[info] model: gpt-oss:20b
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
bash plugins/ollama-codex/scripts/ollama-codex.sh cli-config gpt-oss:20b
bash plugins/ollama-codex/scripts/ollama-codex.sh app-restore
bash plugins/ollama-codex/scripts/ollama-codex.sh cli-restore
```
