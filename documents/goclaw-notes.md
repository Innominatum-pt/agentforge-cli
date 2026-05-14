# GoClaw Implementation Notes

## How to use this file

- All notes must be evidence-based and dated when possible.
- Do not invent API behaviour here.
- When official documentation, OpenAPI, and empirical behaviour disagree, record the discrepancy in this file or in the PR description, and add tests for the behaviour that AgentForge must support.

## Notes

### 2026-05-14 — Refresh of docs.goclaw.sh/llms-full.txt

- Attempted to fetch `https://docs.goclaw.sh/llms-full.txt` during PR work.
- The fetch appeared to return content in preview, but the persisted snapshot could not be saved to `documents/goclaw-llms-full.txt`.
- The existing local snapshot was preserved and left in place.
- Next refresh attempt should verify the saved file size matches the expected content length.

### 2026-05-14 — Official docs confirm agent import and memory document endpoints

- Official docs confirm `POST /v1/agents/{id}/import` as documented merge import.
- Official docs confirm `include=` sections and `context_files`.
- Official docs confirm memory document CRUD endpoints (`GET/PUT/DELETE /v1/agents/{agentID}/memory/documents/{path...}`).
- Official docs separate `context_files` from memory JSONL in archive format.
- Official docs mention optional `?user_id=` for per-user memory scoping.
- Existing AgentForge runtime found that deletion of orphan memory documents required using the original document owner `user_id` as `X-GoClaw-User-Id`.
- Decision: PR #9 adds client methods supporting both documented `user_id` query scoping and request user header override, but does not migrate deployContextFiles() yet.
- Future migration must preserve current working deletion semantics until validated against the running GoClaw OpenAPI/runtime.
