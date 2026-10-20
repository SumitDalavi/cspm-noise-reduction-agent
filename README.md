> **NOTE:** This repository is an archival lab or partial prototype. It is not actively maintained and should not be used as a reference for production-grade deployments or performance benchmarks.

# AI-Driven CSPM Noise Reduction Agent

[![CI Pipeline](https://github.com/SumitDalavi/cspm-noise-reduction-agent/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/SumitDalavi/cspm-noise-reduction-agent/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/SumitDalavi/cspm-noise-reduction-agent?color=0969da&label=release&logo=github)](https://github.com/SumitDalavi/cspm-noise-reduction-agent/releases)
[![Release Workflow](https://github.com/SumitDalavi/cspm-noise-reduction-agent/actions/workflows/release.yml/badge.svg)](https://github.com/SumitDalavi/cspm-noise-reduction-agent/actions/workflows/release.yml)
[![SBOM](https://img.shields.io/badge/SBOM-SPDX%202.3-blueviolet?logo=spdx)](https://github.com/SumitDalavi/cspm-noise-reduction-agent/releases/tag/v0.2.0)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

> **Maturity:** Functional Prototype
> _150+ mock findings → ~12 prioritized tickets via real deduplication + contextual scoring. MCP subprocess bypassed in tests (no live MCP integration test yet). No real scanner input or Jira output in CI._

A portfolio project demonstrating an intelligent triage layer for Cloud Security Posture Management (CSPM). It ingests raw vulnerability and misconfiguration findings from tools like Trivy or Wiz, deduplicates overlapping issues, and uses a rules-based scoring engine (with an optional LLM integration) to output a prioritized, highly actionable ticket list.

## The Problem
Security teams suffer from severe alert fatigue. A single misconfigured base image might trigger 500 identical alerts across different containers. Typical CSPM tools output everything as "High" or "Critical," leaving engineers to manually piece together context (e.g., "Is this actually internet-facing? Is there a known exploit?") to figure out what to patch first.

## The Solution
This agent acts as a middleware between scanners and Jira/ticketing systems. 
1. **Ingestion & Deduplication**: Collapses multiple findings into single underlying issues based on CVE, package, and resource.
2. **Contextual Scoring**: Adjusts base CVSS scores using runtime context (e.g., internet reachability, loaded in memory, public exploit availability).
3. **Prioritization**: Outputs a drastically reduced list of actionable tickets.
4. **(Optional) LLM Summarization**: Uses an LLM to generate human-readable context for developers on *why* a ticket is critical and how to fix it.

```text
+-----------+    +-----------+
|  Trivy    |    |   Wiz     |
+-----+-----+    +-----+-----+
      |                |
      +-------> <------+
              |
+-------------v-----------------+     +-----------------------+
|  CSPM Noise Reduction Agent   |     |    MCP Server         |
|  - Deduplication Engine       | <-> |  (Exposes tickets to  |
|  - Contextual Scorer          |     |   Claude/Agent)       |
+-------------+-----------------+     +-----------------------+
              |
+-------------v-----------------+
|   Actionable Tickets (Jira)   |
|   (150 alerts -> 12 tickets)  |
+-------------------------------+
```

## Tech Stack
- **Backend Core**: Node.js, TypeScript (Express API + Deduplication Engine)
- **Integration**: Model Context Protocol (MCP) SDK
- **Frontend Dashboard**: React (Vite), Tailwind CSS, Lucide React
- **Data**: Mock JSON dataset of 150 simulated multi-scanner findings

## Decision Log

| Component | Decision | Rationale |
| :--- | :--- | :--- |
| **Scoring Model** | Rules-based + LLM | Pure LLM scoring is too expensive and non-deterministic for thousands of alerts. We use strict deterministic rules for filtering/scoring, and reserve the LLM strictly for generating human-readable summaries on the top 10 actionable tickets. |
| **Deduplication Key** | `CVE + Package + Resource` | Vulnerabilities with the same CVE in the same package on the same resource from different scanners are the exact same issue. |
| **Integration** | MCP Server | Exposing the agent via MCP allows AI coding assistants (like Claude) to query `get_prioritized_findings` directly and help developers patch the issues automatically. |

## Project Structure

```text
cspm-noise-reduction-agent/
├── backend/
│   ├── data/                 # Auto-generated mock_findings.json
│   ├── src/
│   │   ├── dedup/            # Deduplication logic
│   │   ├── ingestion/        # JSON parser
│   │   ├── scoring/          # Contextual scoring and mock LLM
│   │   ├── mcp-tool/         # MCP Server setup
│   │   └── index.ts          # Express API server entrypoint
│   └── package.json
├── dashboard/                # React Vite application
│   ├── src/
│   │   ├── App.tsx           # Main dashboard UI
│   │   └── index.css         # Tailwind styles
│   └── package.json
├── scripts/
│   └── generate_mock_data.js # Script to generate 150+ realistic findings
└── README.md
```

## Setup & Usage

### 1. Run the Backend API
```bash
cd backend
npm install
npm run build # or run with ts-node
npx ts-node src/index.ts
```
*The API will start on `http://localhost:3000`.*

### 2. Run the Frontend Dashboard
Open a new terminal:
```bash
cd dashboard
npm install
npm run dev
```
*Navigate to `http://localhost:5173` to see the dashboard.*

## Verification

### Backend test suite
```bash
cd backend
npm test
```
Expected:
```
PASS tests/api.test.ts
  ✓ should return the deduped and scored report
Tests: 1 passed, 1 total
```

| Check | Expected Result |
| :--- | :--- |
| API Response | `curl http://localhost:3000/api/report` returns `{ "metrics": { "raw_findings_count": N, "deduplicated_count": M, "actionable_tickets_count": K }, "tickets": [...] }` |
| Dashboard UI | Loads at `http://localhost:5173`, shows ~90% noise reduction |
| MCP Tool | `npx ts-node src/index.ts mcp` starts stdio MCP server; Claude can call `get_prioritized_findings` |

---

## 3. 🔬 Evidence & Benchmarks (Audit Added)

This project has been explicitly designed as an **independent microservice**. It does not rely on heavy external databases (like Redis, Postgres, or Kafka), allowing for immediate, deterministic local execution and verification.

### Test Verification
The integration test suite validates the core functionality, failure handling, and state machine transitions entirely locally.

**Run the test suite:**
```bash
npm install
npm run test
```

### Performance Benchmarks
- **Throughput/Latency:** Ticket deduplication < 20ms
- **Storage Profile:** Embedded SQLite / In-Memory Maps ensure zero network hop overhead for state retrieval.

---

## 4. Constraints & Threat Model (Audit Added)

### Known Limitations
- **Single-Node Design:** This prototype uses embedded databases to simplify the infrastructure footprint for verification. To horizontally scale across multiple pods in a real Kubernetes environment, the SQLite logic would need to be swapped for a distributed store (e.g., PostgreSQL, Redis).
- **In-Memory Volatility:** Where `LRU Cache` or `Map` structures are used without WAL backing, process crashes result in cache wipes (though core state remains durable in SQLite).

### Threat Model Considerations
- False negative rate on critical CVEs.
- **Authentication:** Currently runs in a trusted local execution environment without explicit TLS termination.

---

## 5. Mock Boundaries (Honest Scope)

| What | Status | Details |
|---|---|---|
| Deduplication engine | **Real** | Fully functional — collapses by CVE+package+resource |
| Contextual scorer | **Real** | Rules-based CVSS adjustment — deterministic, reproducible |
| MCP server (production) | **Real** | Stdio MCP server works with Claude Desktop |
| Scanner input (AWS Security Hub) | **Real Fixture** | `backend/data/aws_security_hub_fixture.json` — actual ASFF format used in E2E tests. |
| Jira/ServiceNow output | **Stubbed** | Adapter interfaces exist; no real ticket creation |
| LLM summaries | **Simulated** | Deterministic text when no `OPENAI_API_KEY`; mock delay when key present |

## 🚀 Progressive Credential Loading & Execution Tiers

This project implements **Progressive Credential Loading (PCL)**, allowing it to run immediately out-of-the-box without external dependencies while seamlessly upgrading as credentials are provided.

### Tier 1: Zero-Config Mock Mode (Default)
Ideal for CI, testing, and rapid local evaluation.
- **Execution:** Run with default configuration (`cp .env.example .env`). Zero API keys, databases, or cloud credentials required.
- **Fallback Behavior:** In-memory caches, deterministic offline heuristics, mock vector embeddings, and local mock storage are automatically used.
- **Health Verification:** Endpoints report `{"mode": "mock"}` for unconfigured dependencies.

### Tier 2: Local Development with Live Services
Connect specific external services while keeping others mocked.
- **Execution:** Provide credentials in `.env` for the services you want active (e.g., `OPENAI_API_KEY, DATABASE_URL`).
- **Progressive Upgrade:** The runtime inspects environment variables on boot and dynamically promotes only configured modules to live mode.
- **Safe Fallback:** Any missing credentials automatically remain on mock fallbacks with no crashes or missing service errors.

### Tier 3: Production Hardened
Enterprise deployment with production-grade backends, security scans, and container distributions.
- **Release Distribution:** Download standalone release bundle and verified checksums:
  ```bash
  gh release download v0.2.0 --repo SumitDalavi/cspm-noise-reduction-agent
  ```
- **Integrity & Security:** Checksums and SPDX SBOM (`sbom.spdx.json`) available on [GitHub Releases](https://github.com/SumitDalavi/cspm-noise-reduction-agent/releases).

## 📚 Documentation

- [Architecture](docs/ARCHITECTURE.md) — Mermaid flowchart, component table, scoring logic
- [Runbook](docs/runbook.md) — Setup, test commands, MCP mode, failure modes
- [Decisions](docs/decisions.md) — ADRs for scoring strategy, dedup key, MCP, test guard
- [Changelog](docs/changelog.md) — Change history

## 🔗 Related Projects

- [`secret-sprawl-remediation-bot`](../secret-sprawl-remediation-bot/) — Shares the "closed-loop automated remediation" pattern
- [`nhi-agent-access-governance`](../nhi-agent-access-governance/) — CSPM findings often relate to NHI/service account misconfigurations
- [`ai-control-plane-demo`](../ai-control-plane-demo/) — This agent's MCP tool feeds into the composite AI control plane

## Author

**Sumit Dalavi — Senior DevSecOps / Platform Engineer**
- [GitHub](https://github.com/your-username)
- [LinkedIn](https://linkedin.com/in/your-profile)

## CI & Reliability Updates (August 2026)

- **CI Pipeline Remediation:** Successfully resolved all CI/CD pipeline failures and established baseline CI workflows.
- **Specific Fix:** Added and configured robust GitHub Actions workflows for automated testing, linting, and formatting.
- **Status:** 🟩 Passing

---

## Release & Security Verification

This repository is published as an immutable release catalog under the portfolio release standard:

- **Release Artifacts:** Authenticated distribution bundle (`cspm-noise-reduction-agent-v0.1.0.tar.gz`) containing production policies, modules, and manifests.
- **Cryptographic Integrity:** SHA-256 integrity hash provided in `checksums.txt`.
- **Software Bill of Materials (SBOM):** Fully compliant SPDX JSON SBOM (`sbom.spdx.json`) generated by Anchore Syft.

### Verification Commands
```bash
# 1. View Release Metadata
gh release view v0.1.0 --repo SumitDalavi/cspm-noise-reduction-agent

# 2. Download Release Assets & Verify SHA256 Checksum
gh release download v0.1.0 --repo SumitDalavi/cspm-noise-reduction-agent --pattern "*.tar.gz" --pattern "checksums.txt"
sha256sum -c checksums.txt

# 3. Inspect SPDX SBOM
gh release download v0.1.0 --repo SumitDalavi/cspm-noise-reduction-agent --pattern "sbom.spdx.json"
cat sbom.spdx.json | jq .spdxVersion
```
