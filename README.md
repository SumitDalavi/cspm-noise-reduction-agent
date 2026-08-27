# AI-Driven CSPM Noise Reduction Agent

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

| Check | Expected Result |
| :--- | :--- |
| API Response | `curl http://localhost:3000/api/report` returns a JSON object with `metrics` and `tickets`. |
| Dashboard UI | The UI successfully loads, showing a ~90% noise reduction (e.g., 187 raw findings reduced to 12 tickets). |
| MCP Tool | The backend can be run with `npx ts-node src/index.ts mcp` to start the standard input/output MCP server. |

## Author

**Sumit Dalavi — Senior DevSecOps / Platform Engineer**
- [GitHub](https://github.com/your-username)
- [LinkedIn](https://linkedin.com/in/your-profile)


## CI & Reliability Updates (August 2026)

- **CI Pipeline Remediation:** Successfully resolved all CI/CD pipeline failures and established baseline CI workflows.
- **Specific Fix:** Added and configured robust GitHub Actions workflows for automated testing, linting, and formatting.
- **Status:** 🟩 Passing
