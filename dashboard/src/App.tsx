import { useEffect, useState } from 'react';
import axios from 'axios';
import { ShieldAlert, CheckCircle, Activity, Server, FileText } from 'lucide-react';

interface Metrics {
  raw_findings_count: number;
  deduplicated_count: number;
  actionable_tickets_count: number;
  noise_reduction_percentage: string;
}

interface Ticket {
  id: string;
  cve: string;
  package: string;
  severity: string;
  cvss: number;
  exploitabilityScore: number;
  priority: string;
  duplicateCount: number;
  scanners: string[];
  llmSummary: string;
  resource: string;
}

function App() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In production, point to backend. For demo, we assume running on localhost:3000
    axios.get('http://localhost:3000/api/report')
      .then(res => {
        setMetrics(res.data.metrics);
        setTickets(res.data.tickets);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading AI CSPM Analysis...</div>;
  }

  return (
    <div className="min-h-screen p-8">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-blue-500" />
          AI-Driven CSPM Triage Dashboard
        </h1>
        <p className="text-slate-400 mt-2">Deduplicating and prioritizing multi-scanner vulnerabilities via context and exploitability scoring.</p>
      </header>

      {/* Metrics Row */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
            <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">Raw Findings</h3>
            <p className="text-4xl font-bold text-slate-100">{metrics.raw_findings_count}</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
            <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">After Dedup</h3>
            <p className="text-4xl font-bold text-slate-100">{metrics.deduplicated_count}</p>
          </div>
          <div className="bg-blue-900/30 rounded-xl p-6 border border-blue-500/30 shadow-lg">
            <h3 className="text-blue-300 text-sm font-semibold uppercase tracking-wider mb-2">Actionable Tickets</h3>
            <p className="text-4xl font-bold text-blue-400">{metrics.actionable_tickets_count}</p>
          </div>
          <div className="bg-emerald-900/30 rounded-xl p-6 border border-emerald-500/30 shadow-lg">
            <h3 className="text-emerald-300 text-sm font-semibold uppercase tracking-wider mb-2">Noise Reduction</h3>
            <p className="text-4xl font-bold text-emerald-400">
              {metrics.noise_reduction_percentage}
            </p>
          </div>
        </div>
      )}

      {/* Prioritized Tickets */}
      <h2 className="text-2xl font-bold text-white mb-6">Top Prioritized Tickets</h2>
      <div className="space-y-6">
        {tickets.map((ticket, idx) => (
          <div key={idx} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl hover:border-slate-600 transition-colors">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className={`px-3 py-1 rounded text-xs font-bold ${
                    ticket.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    ticket.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                    'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  }`}>
                    {ticket.priority} (Score: {ticket.exploitabilityScore})
                  </div>
                  <h3 className="text-xl font-bold text-slate-100">{ticket.cve} in {ticket.package}</h3>
                </div>
                <div className="flex gap-2 text-sm text-slate-400">
                  <span className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded">
                    <Activity className="w-4 h-4" /> Duplicates: {ticket.duplicateCount}
                  </span>
                  <span className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded">
                    <Server className="w-4 h-4" /> Scanners: {ticket.scanners.join(', ')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-slate-400 text-sm font-semibold mb-2">Affected Resource</h4>
                  <p className="text-slate-200 font-mono text-sm bg-slate-900 p-3 rounded">{ticket.resource}</p>
                </div>
                <div>
                  <h4 className="text-slate-400 text-sm font-semibold mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> AI Summary & Context
                  </h4>
                  <p className="text-slate-300 text-sm bg-slate-900/50 p-3 rounded leading-relaxed border border-slate-700">
                    {ticket.llmSummary}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-900/80 px-6 py-3 border-t border-slate-700 flex justify-between items-center">
               <span className="text-xs text-slate-500">Base CVSS: {ticket.cvss} ({ticket.severity})</span>
               <button className="text-blue-400 text-sm hover:text-blue-300 flex items-center gap-2 font-medium transition-colors">
                 <CheckCircle className="w-4 h-4" /> Create Jira Ticket
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
