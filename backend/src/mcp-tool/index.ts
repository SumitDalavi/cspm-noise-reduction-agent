import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { loadFindings } from "../ingestion/parser";
import { deduplicate } from "../dedup/engine";
import { scoreFindings, summarizeWithLLM } from "../scoring/scorer";

export function createMcpServer() {
  const server = new McpServer({
    name: "cspm-noise-reduction-agent",
    version: "1.0.0",
  });

  server.tool(
    "get_prioritized_findings",
    "Analyzes raw CSPM findings, deduplicates them, and returns a prioritized list of actionable tickets.",
    {
      top_n: z.number().optional().describe("Number of top tickets to return (default: 10)"),
      use_llm: z.boolean().optional().describe("Whether to generate LLM summaries (requires OPENAI_API_KEY env var)"),
    },
    async ({ top_n = 10, use_llm = false }) => {
      const rawFindings = loadFindings();
      const deduped = deduplicate(rawFindings);
      const scored = scoreFindings(deduped);
      
      const tickets = scored.slice(0, top_n);
      
      let finalTickets = tickets;
      if (use_llm) {
         finalTickets = await summarizeWithLLM(tickets, process.env.OPENAI_API_KEY || "dummy-key-for-demo");
      } else {
         finalTickets = await summarizeWithLLM(tickets);
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            metrics: {
              raw_findings_count: rawFindings.length,
              deduplicated_count: deduped.length,
              actionable_tickets_count: finalTickets.length,
              noise_reduction_percentage: `${((1 - (finalTickets.length / rawFindings.length)) * 100).toFixed(1)}%`
            },
            tickets: finalTickets
          }, null, 2)
        }]
      };
    }
  );

  return server;
}

export async function runMcpServer() {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server running on stdio");
}
