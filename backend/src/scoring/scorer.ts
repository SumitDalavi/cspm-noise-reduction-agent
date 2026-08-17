import { DedupedFinding } from '../dedup/engine';

export interface ScoredTicket extends DedupedFinding {
  exploitabilityScore: number;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  llmSummary?: string;
}

export function scoreFindings(findings: DedupedFinding[]): ScoredTicket[] {
  return findings.map(finding => {
    let score = parseFloat(finding.cvss);
    
    // Contextual scoring modifiers (Rules-based)
    if (finding.context.internetFacing) {
      score += 2.0; // High risk if reachable
    }
    if (finding.context.publicExploitAvailable) {
      score += 3.0; // Known exploit
    }
    if (!finding.context.loadedAtRuntime) {
      score -= 4.0; // Likely not exploitable if not in memory
    }

    if (score > 10.0) score = 10.0;
    if (score < 0) score = 0;

    let priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    if (score >= 9.0) priority = 'CRITICAL';
    else if (score >= 7.0) priority = 'HIGH';
    else if (score >= 4.0) priority = 'MEDIUM';

    return {
      ...finding,
      exploitabilityScore: parseFloat(score.toFixed(1)),
      priority
    };
  }).sort((a, b) => b.exploitabilityScore - a.exploitabilityScore);
}

export async function summarizeWithLLM(tickets: ScoredTicket[], apiKey?: string): Promise<ScoredTicket[]> {
  // If no API key provided, just return deterministic output
  if (!apiKey) {
    return tickets.map(t => ({
      ...t,
      llmSummary: `[Deterministic] ${t.cve} in ${t.package} is a ${t.priority} priority issue (Score: ${t.exploitabilityScore}). ` + 
        (t.context.internetFacing ? 'It is internet facing. ' : '') + 
        (t.context.loadedAtRuntime ? 'It is loaded in memory at runtime.' : 'It is NOT loaded in memory.')
    }));
  }

  // In a real implementation, you would call OpenAI/Anthropic API here for the top tickets.
  // For this portfolio demo, we simulate the LLM call delay and output.
  return Promise.all(tickets.map(async t => {
    if (t.priority === 'CRITICAL' || t.priority === 'HIGH') {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 50));
      t.llmSummary = `[Mock LLM Summary] The vulnerability ${t.cve} found in ${t.package} is highly exploitable because the asset is internet-facing and public exploits are available. Immediate remediation (patching to latest stable version) is required.`;
    } else {
      t.llmSummary = `[Deterministic] Lower priority finding. Score: ${t.exploitabilityScore}.`;
    }
    return t;
  }));
}
