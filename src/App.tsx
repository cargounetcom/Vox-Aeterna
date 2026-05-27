import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import LayoutProcessor from './components/LayoutProcessor';
import Dashboard from './components/Dashboard';
import TelemetryFeed from './components/TelemetryFeed';
import IntegrationsControl from './components/IntegrationsControl';
import { TelemetryLog } from './types';
import { Compass, Headphones, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('sandbox');
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const [cacheSize, setCacheSize] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiOnline, setApiOnline] = useState<boolean>(true);

  // Integrations state structures
  const [azureConfig, setAzureConfig] = useState<{
    key: string;
    region: string;
    voice: string;
    isEnabled: boolean;
  }>({
    key: '',
    region: 'eastus',
    voice: 'en-US-JennyNeural',
    isEnabled: false
  });

  const [importedData, setImportedData] = useState<{
    text: string;
    title: string;
    id: string;
    page: number;
  } | null>(null);

  const handleImportPage = (text: string, title: string, id: string, page: number) => {
    setImportedData({ text, title, id, page });
  };

  const clearImportedData = () => {
    setImportedData(null);
  };

  // Initial fetch of logs and cache size from Express backend
  const fetchTelemetry = async () => {
    try {
      const response = await fetch('/api/telemetry');
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
        setCacheSize(data.cacheSize || 0);
        setApiOnline(true);
      } else {
        setApiOnline(false);
      }
    } catch (err) {
      console.error("Failed to load telemetry database logs from server:", err);
      setApiOnline(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  // Handler: Run layout translation and linearization using strict prompt
  const handleProcessPage = async (payload: {
    book_title: string;
    book_id: string;
    page_number: number;
    raw_text: string;
    target_language: string;
    user_id: string;
    user_tier: string;
    user_name: string;
  }) => {
    const response = await fetch('/api/process-page', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error("Page translation and formatting request failed on server.");
    }

    const data = await response.json();
    
    // Refresh local trace feed logs
    await fetchTelemetry();

    return {
      text: data.text,
      log: data.log,
      isCached: data.isCached
    };
  };

  // Handler: Trigger random batch uploads simulation in the background
  const handleTriggerSimulation = async (batchSize: number, cachingRate: number) => {
    const response = await fetch('/api/telemetry/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batchSize, cachingRate })
    });

    if (response.ok) {
      await fetchTelemetry();
    } else {
      console.error("Simulated batch transaction loop failed on Express backend.");
    }
  };

  // Handler: Reset server database logs and cash seed
  const handleResetDB = async () => {
    const response = await fetch('/api/telemetry/reset', {
      method: 'POST'
    });

    if (response.ok) {
      await fetchTelemetry();
    } else {
      console.error("Database seed reset routine failed.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col justify-between">
      
      {/* Assembly Header View */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} cacheSize={cacheSize} />

      {/* Primary tab views selection */}
      <main className="flex-1">
        {isLoading ? (
          <div className="h-96 flex flex-col items-center justify-center space-y-3">
            <span className="h-8 w-8 animate-spin border-4 border-slate-900 border-t-transparent rounded-full"></span>
            <span className="font-mono text-xs text-slate-400 uppercase tracking-widest leading-none">Connecting Server Node...</span>
          </div>
        ) : !apiOnline ? (
          <div className="max-w-md mx-auto my-20 bg-rose-50 border border-rose-200 p-6 rounded-2xl text-center space-y-4">
            <ShieldAlert className="text-rose-600 h-10 w-10 mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">Express Connection Loss Detected</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              The Dev Server is currently starting up or compiling. Please wait for the initial asset bundler to spin up, or click the refresh button below.
            </p>
            <button
              onClick={fetchTelemetry}
              className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-500 cursor-pointer transition-all"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <div className="transition-all duration-300">
            {activeTab === 'sandbox' && (
              <LayoutProcessor 
                onProcess={handleProcessPage} 
                activeLogs={logs} 
                azureConfig={azureConfig}
                importedData={importedData}
                clearImportedData={clearImportedData}
              />
            )}
            
            {activeTab === 'dashboard' && (
              <Dashboard
                logs={logs}
                onTriggerSimulation={handleTriggerSimulation}
                onResetDB={handleResetDB}
                cacheSize={cacheSize}
              />
            )}
            
            {activeTab === 'telemetry' && (
              <TelemetryFeed logs={logs} onResetLogs={handleResetDB} />
            )}

            {activeTab === 'integrations' && (
              <IntegrationsControl
                onImportPage={handleImportPage}
                azureConfig={azureConfig}
                setAzureConfig={setAzureConfig}
                setActiveTab={setActiveTab}
              />
            )}
          </div>
        )}
      </main>

      {/* Universal brand footer block */}
      <footer className="border-t border-slate-200 bg-white/60 py-6 text-center text-xs text-slate-400 font-mono">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 justify-center">
            <Headphones className="h-3.5 w-3.5 text-slate-400" />
            <span>AuralAcademic Layout Analytics Engine © 2026</span>
          </div>
          <div>
            <span>Status: <span className="text-emerald-500 font-semibold uppercase">Active Node [Offline Sim-Mesh Enable]</span></span>
          </div>
        </div>
      </footer>

    </div>
  );
}

// Inline fallback icon imports if missing
function ShieldAlert(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
