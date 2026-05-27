import React from 'react';
import { Sparkles, Headphones, Layers, Database, Link } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  cacheSize: number;
}

export default function Header({ activeTab, setActiveTab, cacheSize }: HeaderProps) {
  return (
    <header className="border-b border-white/10 bg-black/60 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-6 h-20 flex flex-col md:flex-row items-center justify-between gap-4 py-4 md:py-0">
        
        {/* Brand Logo & Vibe */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="relative">
            <div className="h-10 w-10 rounded-xl bg-black border border-white/10 flex items-center justify-center text-[#f27d26] glow-orange">
              <Headphones className="h-5 w-5" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f27d26] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#f27d26]"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-sans font-black text-sm tracking-[0.14em] uppercase text-white leading-tight">
                Vox Aeterna
              </h1>
              <span className="text-[9px] font-mono border border-[#f27d26]/40 bg-[#f27d26]/10 text-[#f27d26] px-1 rounded-sm leading-none py-0.5">
                v4.2.1
              </span>
            </div>
            <p className="font-mono text-[9px] text-white/40 uppercase tracking-widest mt-0.5">
              Accessibility Layout Pipeline
            </p>
          </div>
        </div>

        {/* Modular Navigation Tabs */}
        <nav className="flex space-x-1.5 bg-black/60 p-1 rounded-xl border border-white/5">
          <button
            id="tab-sandbox"
            onClick={() => setActiveTab('sandbox')}
            className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-lg transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'sandbox'
                ? 'bg-[#f27d26] text-black font-bold shadow-[0_0_12px_rgba(242,125,38,0.4)]'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Sandbox
          </button>
          
          <button
            id="tab-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-lg transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-[#f27d26] text-black font-bold shadow-[0_0_12px_rgba(242,125,38,0.4)]'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Dashboard
          </button>

          <button
            id="tab-telemetry"
            onClick={() => setActiveTab('telemetry')}
            className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-lg transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'telemetry'
                ? 'bg-[#f27d26] text-black font-bold shadow-[0_0_12px_rgba(242,125,38,0.4)]'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            Telemetry
          </button>

          <button
            id="tab-integrations"
            onClick={() => setActiveTab('integrations')}
            className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-lg transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'integrations'
                ? 'bg-[#f27d26] text-black font-bold shadow-[0_0_12px_rgba(242,125,38,0.4)]'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Link className="h-3.5 w-3.5" />
            Integrations
          </button>
        </nav>

        {/* System telemetry mini stats block */}
        <div className="flex items-center space-x-6 text-[10px] tracking-widest uppercase font-mono text-white/40 shrink-0">
          <div className="hidden lg:flex flex-col text-right">
            <span className="text-[8px] tracking-wider text-white/30 block">SYSTEM STATUS</span>
            <span className="text-[#f27d26] font-semibold block flex items-center gap-1 justify-end">
              <span className="h-1.5 w-1.5 rounded-full bg-[#f27d26] animate-pulse"></span>
              Live Node
            </span>
          </div>
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-[8px] tracking-wider text-white/30 block">CACHE REPOSITORY</span>
            <span className="text-emerald-400 font-semibold block">{cacheSize} Pages</span>
          </div>
        </div>

      </div>
    </header>
  );
}

