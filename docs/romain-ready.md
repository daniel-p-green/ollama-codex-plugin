# Romain-Ready Checklist

The goal is a repo someone working on Codex can inspect quickly and trust.

## Ready Signals

- Public GitHub repo with a clear README and install path.
- Release tag and changelog.
- MIT license.
- GitHub Actions validation.
- One-command local validation through `bash scripts/validate.sh`.
- One-command demo through `bash scripts/demo.sh`.
- Codex plugin metadata includes GUI starter prompts.
- Slash commands cover Codex App, Codex CLI, model helpers, restore, and status.
- Wrapper supports `--dry-run` so command routing can be verified without mutating profiles.
- Restore boundaries are explicit: App restore and CLI restore are separate.
- Docs are grounded in current Ollama Codex App, Codex CLI, and CLI Reference pages.

## Verified Locally

Latest local checks performed during the Romain-ready pass:

- `bash scripts/validate.sh` passed.
- `bash plugins/ollama-codex/scripts/ollama-codex.sh status` detected Ollama, Codex CLI, local models, and Codex App backup state.
- `codex plugin add ollama-codex@ollama-codex-local` installed the current plugin version into the local Codex plugin cache.
- Fresh-clone validation from GitHub passed.

## Non-Goals

- No custom native settings panel. Configuration runs through Codex plugin prompts, slash commands, and Ollama's official commands.
- No silent restore on plugin disablement. Restore remains explicit.
- No CI mutation of Codex App or Codex CLI profiles. CI uses validation and dry runs.

## Remaining Manual Check

The only remaining manual proof is a real Codex plugin GUI screenshot or short screen recording after opening the plugin card. The package itself is installed and validated, but app-level visual inspection is intentionally separate from repository validation.
