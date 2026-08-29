# Architecture Decision Records — cspm-noise-reduction-agent
> Last updated: 2026-08-29

---

## ADR-001: Rules-Based Scoring as Primary, LLM as Summary-Only

**Date:** Pre-2026-08-29  
**Status:** Accepted

**Context:**  
Pure LLM scoring of 150+ vulnerability findings would be expensive, slow (rate-limited), and non-deterministic. Reviewers need reproducible prioritization.

**Decision:**  
Scoring uses a deterministic rules engine: `CVSS base score + contextual modifiers (internet-facing, exploit available, runtime-loaded)`. The LLM (`summarizeWithLLM()`) is reserved for generating human-readable summaries on the top 10 tickets only, and only when `OPENAI_API_KEY` is provided.

**Consequences:**  
- ✅ Reproducible, auditable scoring — same input always produces same ranking  
- ✅ Zero cost in demo mode (no LLM call without API key)  
- ⚠️ Contextual modifiers are hardcoded heuristics; a trained ML model would be more adaptive

---

## ADR-002: Deduplication Key = CVE + Package + Resource

**Date:** Pre-2026-08-29  
**Status:** Accepted

**Context:**  
Trivy and Wiz may both report CVE-2023-XXXX in `libssl` on `prod-cluster/pod-A`. These are the same issue, not two separate tickets.

**Decision:**  
Deduplicate by `(cve, package, resource)` composite key. Multiple findings with the same key are collapsed into one, with scanner sources merged into an array.

**Consequences:**  
- ✅ 150 raw findings → ~12 actionable tickets (90% noise reduction) in demo data  
- ⚠️ Over-deduplication risk: same CVE in same package across different resources is correctly treated as different issues — the `resource` field prevents this

---

## ADR-003: MCP Server for AI Agent Integration

**Date:** Pre-2026-08-29  
**Status:** Accepted

**Context:**  
AI coding assistants (Claude) need a structured way to query prioritized findings and suggest patches. The Model Context Protocol (MCP) provides a standard tool-calling interface for this.

**Decision:**  
The backend exposes a `get_prioritized_findings(top_n, use_llm)` MCP tool via stdio. When running as `npx ts-node src/index.ts mcp`, the process is a compliant MCP server.

**Consequences:**  
- ✅ Claude Desktop and other MCP clients can query findings directly  
- ⚠️ The `GET /api/report` endpoint spawns a subprocess via `StdioClientTransport` — this breaks in test environments where `npx` isn't in PATH

---

## ADR-004: `isTest` Guard to Bypass MCP Subprocess in Tests

**Date:** 2026-08-29  
**Status:** Accepted

**Context:**  
`GET /api/report` spawns `npx ts-node src/index.ts mcp` via `StdioClientTransport`. In Jest (`ts-jest`), `npx` is not in PATH, causing the test suite to fail with `ENOENT`.

**Decision:**  
Added `const isTest = process.env.NODE_ENV === 'test' || !!process.env.JEST_WORKER_ID`. When true, the handler calls the scoring pipeline directly (`loadFindings → deduplicate → scoreFindings`) without spawning a subprocess.

**Consequences:**  
- ✅ Tests pass without spawning child processes  
- ✅ Production behavior unchanged — `isTest` is false in production  
- ⚠️ The test path calls scoring functions directly; it does not test the MCP serialization/deserialization layer — that requires an integration test with a real MCP client
