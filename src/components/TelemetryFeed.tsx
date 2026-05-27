import React, { useState } from 'react';
import { TelemetryLog, SubscriptionTier } from '../types';
import { Terminal, Database, CheckCircle, AlertTriangle, RefreshCw, Filter, Code, Eye } from 'lucide-react';

interface TelemetryFeedProps {
  logs: TelemetryLog[];
  onResetLogs: () => Promise<void>;
}

export default function TelemetryFeed({ logs, onResetLogs }: TelemetryFeedProps) {
  // Filtering states
  const [filterCache, setFilterCache] = useState<'all' | 'hit' | 'miss'>('all');
  const [filterTier, setFilterTier] = useState<'all' | SubscriptionTier>('all');
  const [selectedLog, setSelectedLog] = useState<TelemetryLog | null>(null);

  // Derive filter set
  const filteredLogs = logs.filter(log => {
    if (filterCache === 'hit' && !log.cache_hit) return false;
    if (filterCache === 'miss' && log.cache_hit) return false;
    if (filterTier !== 'all' && log.user_tier !== filterTier) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 font-sans text-white/90">
      
      {/* Upper header section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-sans font-extrabold text-white flex items-center gap-2">
            <Terminal className="text-[#f27d26] h-5 w-5 glow-orange" /> Telemetry Ledger Archive Feed
          </h2>
          <p className="text-xs text-white/60 mt-1 max-w-3xl">
            Audit and inspect active unit-economy cost metrics, Azure neural text-to-speech character weights, and real-time LLM validation logs in the system database.
          </p>
        </div>

        <button
          onClick={onResetLogs}
          className="px-3 py-1.5 border border-[#f27d26]/30 bg-[#f27d26]/10 text-[#f27d26] hover:bg-[#f27d26]/20 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer glow-orange-sm"
        >
          <RefreshCw className="h-3 w-3" />
          Re-seed Ledger Logs
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LOGS TABLE (Grid span 7) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Query filter strip */}
          <div className="bg-[#0a0a0a] p-4 border border-white/10 rounded-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-xs font-sans">
              
              {/* Cache hit/miss query */}
              <div className="flex items-center gap-2">
                <span className="text-white/40 flex items-center gap-1 font-semibold uppercase text-[10px] tracking-wider"><Filter className="h-3 w-3 text-[#f27d26]" /> Cache Select:</span>
                <select
                  value={filterCache}
                  onChange={(e) => setFilterCache(e.target.value as any)}
                  className="bg-black border border-white/10 rounded p-1 text-xs focus:outline-hidden focus:border-[#f27d26] text-white font-medium cursor-pointer"
                >
                  <option value="all">All Operations</option>
                  <option value="hit">Cache Hit Loop</option>
                  <option value="miss">Cache Miss (AI processed)</option>
                </select>
              </div>

              {/* Subscriptions tier query */}
              <div className="flex items-center gap-2">
                <span className="text-white/40 font-semibold uppercase text-[10px] tracking-wider">Tier:</span>
                <select
                  value={filterTier}
                  onChange={(e) => setFilterTier(e.target.value as any)}
                  className="bg-black border border-white/10 rounded p-1 text-xs focus:outline-hidden focus:border-[#f27d26] text-white font-medium cursor-pointer"
                >
                  <option value="all">All Tiers</option>
                  <option value="payg">Pay-As-You-Go</option>
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                </select>
              </div>

            </div>

            <span className="text-[9px] font-mono font-bold text-[#f27d26] bg-[#f27d26]/10 border border-[#f27d26]/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
              {filteredLogs.length} Records Listed
            </span>
          </div>

          {/* Table list shell */}
          <div className="bg-[#0a0a0a] border border-white/12 rounded-xl overflow-hidden shadow-xl">
            <div className="max-h-[460px] overflow-y-auto">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="bg-black border-b border-white/10 text-white/50 font-mono text-[9px] uppercase tracking-wider">
                    <th className="py-3 px-3">Transaction</th>
                    <th className="py-3 px-3">Student / Dialect</th>
                    <th className="py-3 px-3">Page Resource</th>
                    <th className="py-3 px-3 text-center">Cache State</th>
                    <th className="py-3 px-3 text-right">Cost (USD)</th>
                    <th className="py-3 px-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-sans">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-white/30">
                        <Database className="h-8 w-8 mx-auto mb-2 text-[#f27d26] opacity-60" />
                        No ledger logs currently logged.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map(log => {
                      const isSelected = selectedLog?.transaction_id === log.transaction_id;
                      return (
                        <tr
                          key={log.transaction_id}
                          onClick={() => setSelectedLog(log)}
                          className={`hover:bg-white/5 transition-all cursor-pointer ${
                            isSelected ? 'bg-white/5 text-white border-l-2 border-l-[#f27d26]' : ''
                          }`}
                        >
                          {/* Transaction code */}
                          <td className="py-3px px-3 py-3">
                            <span className="font-mono text-[10px] font-bold text-white block">{log.transaction_id}</span>
                            <span className="text-[9px] text-white/40 font-mono">{formatTime(log.timestamp)}</span>
                          </td>

                          {/* Student dial */}
                          <td className="py-3 px-3">
                            <span className="text-white/90 block truncate max-w-[130px] font-semibold">{log.user_name}</span>
                            <span className="text-[9px] text-white/40 flex items-center gap-1 font-mono uppercase">
                              <span className={`h-1.5 w-1.5 rounded-full ${
                                log.user_tier === 'premium' ? 'bg-[#f27d26] shadow-[0_0_6px_#f27d26]' : log.user_tier === 'standard' ? 'bg-blue-400' : 'bg-slate-500'
                              }`}></span>
                              {log.target_language.split(' (')[0]}
                            </span>
                          </td>

                          {/* Book target */}
                          <td className="py-3 px-3">
                            <span className="text-white/70 block truncate max-w-[140px] font-medium">{log.book_title}</span>
                            <span className="text-[9px] text-white/40 font-mono">Page {log.page_number}</span>
                          </td>

                          {/* Cache hit label */}
                          <td className="py-3 px-3 text-center">
                            {log.cache_hit ? (
                              <span className="font-mono text-[8px] tracking-wider uppercase font-extrabold text-emerald-400 bg-emerald-950/40 border border-emerald-500/25 px-2 py-0.5 rounded">
                                CACHE HIT
                              </span>
                            ) : (
                              <span className="font-mono text-[8px] tracking-wider uppercase font-extrabold text-rose-400 bg-rose-950/40 border border-rose-500/25 px-2 py-0.5 rounded">
                                CACHE MISS
                              </span>
                            )}
                          </td>

                          {/* Cost */}
                          <td className="py-3 px-3 text-right">
                            <span className="font-mono text-white font-extrabold block">
                              ${log.metrics.calculated_cost_usd.toFixed(5)}
                            </span>
                          </td>

                          {/* View details quick trigger icon */}
                          <td className="py-3 px-3 text-center">
                            <Eye className={`h-3.5 w-3.5 ${isSelected ? 'text-[#f27d26]' : 'text-white/20'}`} />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* JSON TRANSACTION DB SCHEMA WORKSPACE (Grid span 5) */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-5 text-white font-mono text-xs flex flex-col justify-between h-full min-h-[460px] shadow-xl">
            <div>
              <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                <span className="text-white/60 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5">
                  <Code className="text-[#f27d26] h-4 w-4" /> Live Document Schema Inspector
                </span>
                
                {selectedLog && (
                  <span className="bg-[#f27d26]/10 text-[#f27d26] border border-[#f27d26]/30 text-[9px] font-black px-1.5 py-0.5 rounded font-mono">
                    PROCESSED RECORD
                  </span>
                )}
              </div>

              {selectedLog ? (
                <div>
                  <span className="text-[10px] text-white/40 block mb-2">// Active Transaction Database representation</span>
                  
                  {/* Detailed Interactive JSON Document format */}
                  <pre className="text-[10px] text-emerald-300 font-mono leading-relaxed bg-black p-4 rounded-lg overflow-x-auto max-h-[380px] border border-white/5 shadow-inner">
                    {JSON.stringify({
                      transaction_id: selectedLog.transaction_id,
                      user_id: selectedLog.user_id,
                      book_id: selectedLog.book_id,
                      book_title: selectedLog.book_title,
                      page_number: selectedLog.page_number,
                      cache_hit: selectedLog.cache_hit,
                      metrics: {
                        claude_input_tokens: selectedLog.metrics.claude_input_tokens,
                        claude_output_tokens: selectedLog.metrics.claude_output_tokens,
                        azure_characters: selectedLog.metrics.azure_characters,
                        calculated_cost_usd: parseFloat(selectedLog.metrics.calculated_cost_usd.toFixed(5))
                      },
                      student_dialect: selectedLog.target_language,
                      user_subscription_tier: selectedLog.user_tier,
                      transaction_timestamp: selectedLog.timestamp
                    }, null, 2)}
                  </pre>
                </div>
              ) : (
                /* Empty logs help block */
                <div className="h-64 flex flex-col items-center justify-center text-center text-white/30 space-y-2">
                  <Eye className="h-8 w-8 text-[#f27d26] opacity-60 stroke-1" />
                  <span className="text-xs font-bold text-white/70">Inspect Database Ledger</span>
                  <p className="text-[10px] text-white/50 max-w-xs leading-normal">
                    Select any individual log transaction on the left list row to analyze its primary JSON model representation stored in the Ledger Cache.
                  </p>
                </div>
              )}
            </div>

            {/* Little prompt explaining how this data map scales */}
            <div className="p-3 bg-black border border-white/5 rounded-lg text-[10px] text-white/40 leading-normal mt-4">
              <span className="font-bold text-[#f27d26] block mb-0.5">Database Sync Ledger Strategy:</span>
              This structured document map caches university material requests using standard OCR-hash keys, protecting against costly compute margins.
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

// Format timestamp parser
function formatTime(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch (e) {
    return isoStr;
  }
}
