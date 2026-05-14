# GoClaw Documentation Sources

| Source | URL | Purpose | Priority |
|---|---|---|---|
| Official LLM full documentation | https://docs.goclaw.sh/llms-full.txt | Primary machine-readable documentation snapshot for coding agents | 1 |
| Official LLM index | https://docs.goclaw.sh/llms.txt | Shorter LLM-oriented documentation index | 2 |
| Official skills documentation | https://docs.goclaw.sh/skills | Human-readable documentation for skills | 3 |
| Instance OpenAPI schema | `<configured-api-url>/v1/openapi.json` | Technical contract for the installed GoClaw instance | 1 for the local instance |
| Official repository/source | To be confirmed | Source-level confirmation when public or available | Pending |

## Discrepancy rule

When official documentation, OpenAPI, and empirical behaviour disagree, do not silently choose one. Record the discrepancy in `documents/goclaw-notes.md` or in the PR description and add tests for the behaviour that AgentForge must support.
