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

### 2026-05-14 — Pull/export format is not equivalent to memory document CRUD

- Agent export/import uses a tar.gz archive with sections.
- Exported memory is represented as JSONL files such as `memory/global.jsonl` and `memory/users/{user_id}.jsonl`.
- Memory document CRUD exposes document paths through `/memory/documents/{path...}`.
- Therefore, full pull/export and incremental memory sync must be treated as separate mechanisms.
- Decision: PR #10 only separates deployContextFiles() internals. It does not change pull behaviour and does not replace export/import with memory GET endpoints.
- Future work should validate whether pull memory reconstruction should use export JSONL, memory document GET, or a hybrid approach.

### 2026-05-14 — Agent export client method added without runtime migration

- PR #17 adds client methods for the existing agent export/archive endpoint used by pullAgent().
- Runtime pullAgent() is intentionally unchanged.
- Export/archive pull remains separate from memory document CRUD.
- Future migration must preserve archive responseType and local reconstruction semantics.

### 2026-05-14 — Skill pull client methods added without runtime migration

- PR #19 adds client methods for the existing skill pull export/fallback endpoints.
- Runtime pullAllSkills() is intentionally unchanged.
- Skill export uses arraybuffer because current runtime writes the tarball to disk before extraction.
- Skill file fallback preserves encodeURIComponent(file.path).
- This differs from memory document paths, which are GoClaw catch-all paths and must preserve slashes.

### 2026-05-15 — context_files and memory/documents separated in sync modules

- GoClaw context_files archive import/export and memory/documents CRUD are different domains.
- contextSync.ts is for context_files archive preparation/import and its ghost placeholder workaround.
- memorySync.ts is for memory document update and pruning.
- Runtime behaviour is unchanged.
