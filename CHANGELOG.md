# Changelog

## 0.3.2

- Hardened Codex CLI behavior after live testing showed `ollama launch codex --config --model <model>` can still launch an interactive Codex TUI after writing config.
- Changed `cli-config` to require a model and write the documented `ollama-launch` CLI profile/catalog without launching nested Codex.
- Added non-interactive guards for CLI launch commands and updated slash commands to hand off exact terminal commands safely.
- Updated validation, demo docs, and the Romain-ready checklist with the tested behavior.

## 0.3.1

- Reframed the README and plugin card around the core product point: the missing Codex plugin GUI for Ollama.
- Moved the GUI starter-prompt experience into the first screen of the README.
- Tightened share copy for a clearer public launch message.

## 0.3.0

- Added a Romain-ready sharing pass with README badges, a 30-second demo, proof links, and public-friendly positioning.
- Added demo and share docs so the project is easier to inspect quickly from GitHub.
- Added a demo script for repeatable local proof without mutating Codex profile state.

## 0.2.0

- Expanded the plugin from Codex App-only setup to the full official Ollama/Codex surface.
- Added Codex CLI commands for `ollama launch codex`, `--config`, `--restore`, `codex --oss`, model-specific CLI launches, and the `ollama-launch` profile.
- Added model helper commands for listing and pulling Ollama models.
- Improved status checks with model summary, profile/catalog detection, and backup detection.
- Added portable repo validation and GitHub Actions.
- Added production README coverage for App workflows, CLI workflows, restore boundaries, and validation.

## 0.1.0

- Initial repo-local Codex plugin for configuring Codex App with Ollama.
- Added Codex plugin metadata, starter prompts, slash commands, setup wrapper, reference docs, and Ollama logo assets.
