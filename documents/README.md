# documents/

This directory is the local reference area for GoClaw documentation snapshots and implementation notes.

## Contents

- `goclaw-llms-full.txt` — Official GoClaw LLM documentation snapshot from `https://docs.goclaw.sh/llms-full.txt` when available.
- `goclaw-openapi.json` — Snapshot of `/v1/openapi.json` from the configured GoClaw instance.
- `goclaw-sources.md` — Lists known documentation sources and their priority.
- `goclaw-notes.md` — Records discrepancies, implementation notes, and validated behaviours.

## Rules

- Files in `documents/` are reference material, not executable source.
- Do not edit or summarise documentation snapshots manually.
- When official documentation, OpenAPI, and empirical behaviour disagree, record the discrepancy in `goclaw-notes.md` or in the PR description and add tests for the behaviour that AgentForge must support.
