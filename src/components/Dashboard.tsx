import React, { useState, useMemo } from 'react';
import { ModelRates, TelemetryLog } from '../types';
import { TrendingUp, Layers, HelpCircle, RefreshCw, BarChart2, DollarSign, Archive, Compass, Cpu, Check, Sliders } from 'lucide-react';

interface DashboardProps {
  logs: TelemetryLog[];
  onTriggerSimulation: (size: number, rate: number) => Promise<void>;
  onResetDB: () => Promise<void>;
  cacheSize: number;
}

export default function Dashboard({ logs, onTriggerSimulation, onResetDB, cacheSize }: DashboardProps) {
  // Configurable sliders for business economics
  const [paygUsersCount, setPaygUsersCount] = useState<number>(350);
  const [standardSubscribers, setStandardSubscribers] = useState<number>(240);
  const [premiumSubscribers, setPremiumSubscribers] = useState<number>(150);
  
  const [standardPagesPercent, setStandardPagesPercent] = useState<number>(65); // % of cap consumed
  const [premiumPagesPercent, setPremiumPagesPercent] = useState<number>(55); // % of cap consumed
  
  const [globalCacheHitRate, setGlobalCacheHitRate] = useState<number>(65); // slider for library caching loops
  
  // Advanced rates control
  const [clPerMIn, setClPerMIn] = useState<number>(3.00); // Claude 3.5 Sonnet Input rate/1M
  const [clPerMOut, setClPerMOut] = useState<number>(15.00); // Claude 3.5 Sonnet Output rate/1M
  const [azSpeechPerM, setAzSpeechPerM] = useState<number>(16.00); // Azure speech per 1M characters
  
  // Processing Simulation trigger states
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simSize, setSimSize] = useState<number>(15);

  // Configurable dynamic subscription and store metrics (User Plan Architect)
  const [paygRate, setPaygRate] = useState<number>(0.15); // $0.15 per processed page
  const [standardPrice, setStandardPrice] = useState<number>(14.99); // subscription fee standard
  const [standardLimit, setStandardLimit] = useState<number>(150); // standard limit Cap pages
  const [premiumPrice, setPremiumPrice] = useState<number>(29.99); // subscription fee premium
  const [premiumLimit, setPremiumLimit] = useState<number>(400); // premium limit Cap pages
  const [appStoreFeePercent, setAppStoreFeePercent] = useState<number>(30); // Apple/Google Store surcharge fee percentage 0-45%
  
  const APP_STORE_FEE = appStoreFeePercent / 100;

  // Derive page financial ledger calculations
  const economics = useMemo(() => {
    // Standard standard-sized page model bounds
    const avgPageWords = 300;
    const avgPageCharacters = 1800;
    
    const inputTokensPerPage = 450; 
    const outputTokensPerPage = 400;

    // Direct Cost computations
    const inputCost = (inputTokensPerPage / 1000000) * clPerMIn;
    const outputCost = (outputTokensPerPage / 1000000) * clPerMOut;
    const speechCost = (avgPageCharacters / 1000000) * azSpeechPerM;
    const hostingCost = 0.00085;
    const cloudCacheReadCost = 0.00005;

    const fullProcessingCost = inputCost + outputCost + speechCost + hostingCost; // ~0.037 default

    // Monthly usage per subscriber group
    const avgPagesStandard = Math.round((standardLimit * standardPagesPercent) / 100);
    const avgPagesPremium = Math.round((premiumLimit * premiumPagesPercent) / 100);

    // Totals Requested monthly
    const totalPagesStandardRequested = standardSubscribers * avgPagesStandard;
    const totalPagesPremiumRequested = premiumSubscribers * avgPagesPremium;
    const totalPagesPAYGRequested = paygUsersCount * 8; // Assumed 8 pages average for casual researchers

    const totalPagesRequested = totalPagesStandardRequested + totalPagesPremiumRequested + totalPagesPAYGRequested;

    // Cache Hits vs Misses
    const calculatedCacheHitRateFraction = globalCacheHitRate / 100;
    const cacheHitsCount = Math.round(totalPagesRequested * calculatedCacheHitRateFraction);
    const cacheMissesCount = totalPagesRequested - cacheHitsCount;

    // Total Costs
    const missesProcessingCost = cacheMissesCount * fullProcessingCost;
    const hitsRetrievalCost = cacheHitsCount * cloudCacheReadCost;
    const totalOperationalCost = missesProcessingCost + hitsRetrievalCost;

    // Caching Cost-Avoidance benefits vs raw reprocessing (no cache loop)
    const costWithoutCache = totalPagesRequested * fullProcessingCost;
    const totalSavingsVianCache = Math.max(0, costWithoutCache - totalOperationalCost);

    // Business revenues after app marketplace fees
    const grossRevenuePAYG = totalPagesPAYGRequested * 0.15; // 15 cents/page
    const grossRevenueStandard = standardSubscribers * 14.99;
    const grossRevenuePremium = premiumSubscribers * 29.99;
    const totalGrossRevenue = grossRevenuePAYG + grossRevenueStandard + grossRevenuePremium;

    const netCorpRevenuePAYG = grossRevenuePAYG * (1 - APP_STORE_FEE);
    const netCorpRevenueStandard = grossRevenueStandard * (1 - APP_STORE_FEE);
    const netCorpRevenuePremium = grossRevenuePremium * (1 - APP_STORE_FEE);
    const totalNetCorpRevenue = netCorpRevenuePAYG + netCorpRevenueStandard + netCorpRevenuePremium;

    const netProfit = totalNetCorpRevenue - totalOperationalCost;
    const profitMargin = totalNetCorpRevenue > 0 ? (netProfit / totalNetCorpRevenue) * 100 : 0;

    return {
      fullProcessingCost,
      totalPagesRequested,
      cacheHitsCount,
      cacheMissesCount,
      totalOperationalCost,
      totalSavingsVianCache,
      totalGrossRevenue,
      totalNetCorpRevenue,
      netProfit,
      profitMargin,
      costWithoutCache,
      calculatedCacheHitRateFraction,
      paygInfo: {
        rev: grossRevenuePAYG,
        netRev: netCorpRevenuePAYG,
        pages: totalPagesPAYGRequested,
      },
      standardInfo: {
        rev: grossRevenueStandard,
        netRev: netCorpRevenueStandard,
        pages: totalPagesStandardRequested,
        avg: avgPagesStandard
      },
      premiumInfo: {
        rev: grossRevenuePremium,
        netRev: netCorpRevenuePremium,
        pages: totalPagesPremiumRequested,
        avg: avgPagesPremium
      }
    };
  }, [
    paygUsersCount, standardSubscribers, premiumSubscribers,
    standardPagesPercent, premiumPagesPercent, globalCacheHitRate,
    clPerMIn, clPerMOut, azSpeechPerM,
    paygRate, standardPrice, standardLimit, premiumPrice, premiumLimit, appStoreFeePercent
  ]);

  // Run dynamic simulation handler
  const handleSimulate = async () => {
    setIsSimulating(true);
    try {
      await onTriggerSimulation(simSize, globalCacheHitRate / 100);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimulating(false);
    }
  };

  // Create progressive chart coordinate nodes for Cash-Savings vs Cache-Hit-Rate points: [0, 20, 40, 60, 80, 100]
  const cacheHitSavingsTrend = useMemo(() => {
    const points = [0, 20, 40, 60, 80, 100];
    return points.map(pct => {
      const frac = pct / 100;
      const hits = Math.round(economics.totalPagesRequested * frac);
      const misses = economics.totalPagesRequested - hits;
      const c = (misses * economics.fullProcessingCost) + (hits * 0.00005);
      const noCacheCost = economics.totalPagesRequested * economics.fullProcessingCost;
      const savings = Math.max(0, noCacheCost - c);
      const profit = economics.totalNetCorpRevenue - c;
      const margin = economics.totalNetCorpRevenue > 0 ? (profit / economics.totalNetCorpRevenue) * 100 : 0;
      return { pct, savings, margin, cost: c };
    });
  }, [economics.totalPagesRequested, economics.fullProcessingCost, economics.totalNetCorpRevenue]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 text-white/95">
      
      {/* Intro Header banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-[#0a0a0a] border border-white/10 text-white p-6 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <span className="font-mono text-xs text-[#f27d26] uppercase tracking-[0.16em] font-bold flex items-center gap-1.5">
            <Cpu className="h-3.5 w-3.5 glow-orange animate-pulse" /> Direct COGS vs Caching Optimization Analysis
          </span>
          <h2 className="text-2xl font-sans font-extrabold tracking-tight">
            Financial & Unit Economics Ledger
          </h2>
          <p className="text-sm text-white/60 max-w-2xl">
            Simulate textbook scan workloads, cached query loop ratios, subscription limits, and unit income sheets to observe scalable university pipeline margins.
          </p>
        </div>
        
        {/* Reset / Live Simulation Triggers */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onResetDB}
            className="px-4 py-2 border border-white/10 hover:border-white/20 rounded-xl bg-black text-[#f27d26] hover:bg-white/5 text-xs font-mono transition-all flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset Seed Data
          </button>
          
          <div className="flex items-center gap-1.5 bg-black p-1.5 rounded-xl border border-white/10">
            <input
              type="number"
              value={simSize}
              onChange={(e) => setSimSize(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-12 text-center bg-zinc-950 text-emerald-400 font-mono text-xs p-1 rounded border border-white/10 focus:outline-hidden"
              title="Batch size to simulate"
            />
            <button
              onClick={handleSimulate}
              disabled={isSimulating}
              className="px-3.5 py-1.5 bg-[#f27d26] hover:bg-[#d86a1a] disabled:bg-[#f27d26]/40 disabled:cursor-not-allowed rounded-lg text-xs font-bold text-black tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(242,125,38,0.3)]"
            >
              {isSimulating ? (
                <span className="h-3 w-3 animate-spin border-2 border-black border-t-transparent rounded-full" />
              ) : (
                <TrendingUp className="h-3.5 w-3.5" />
              )}
              Trigger Simulation
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Controls & Sliders (Grid Span 4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Section: Operational Unit Costs (Constant parameters) */}
          <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-5 shadow-xl">
            <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-[#f27d26] border-b border-white/5 pb-3 mb-4 flex items-center gap-2">
              <Cpu className="text-[#f27d26] h-4 w-4" />
              API Cost Coefficients
            </h3>
            
            <div className="space-y-4">
              {/* Claude 3.5 Sonnet Input */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-white/60 font-medium">Claude 3.5 Input (/1M tokens)</span>
                  <span className="font-mono text-white font-bold">${clPerMIn.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={clPerMIn}
                  onChange={(e) => setClPerMIn(parseFloat(e.target.value))}
                  className="w-full accent-[#f27d26] h-1 bg-black rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Claude 3.5 Sonnet Output */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-white/60 font-medium">Claude 3.5 Output (/1M tokens)</span>
                  <span className="font-mono text-white font-bold">${clPerMOut.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="25"
                  step="1"
                  value={clPerMOut}
                  onChange={(e) => setClPerMOut(parseFloat(e.target.value))}
                  className="w-full accent-[#f27d26] h-1 bg-black rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Azure AI Speech */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-white/60 font-medium">Azure TTS Audio (/1M chars)</span>
                  <span className="font-mono text-white font-bold">${azSpeechPerM.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="24"
                  step="1"
                  value={azSpeechPerM}
                  onChange={(e) => setAzSpeechPerM(parseFloat(e.target.value))}
                  className="w-full accent-[#f27d26] h-1 bg-black rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Readout of Static Cost per single fresh page */}
              <div className="p-3 bg-black border border-dashed border-white/10 rounded-xl mt-2">
                <span className="font-mono text-[9px] text-white/40 block uppercase tracking-wider">Estimated Delivery Expense (COGS)</span>
                <span className="font-sans font-bold text-base text-white block mt-1">
                  ${economics.fullProcessingCost.toFixed(4)}
                  <span className="text-xs text-white/50 font-normal"> / fresh page</span>
                </span>
                <span className="text-[10px] text-white/40 block leading-tight mt-1">
                  Considers typical LLM translation context size, vocal synthesis character count, and minor cache reads.
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Subscription Planner (User Plan Architect) */}
          <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-5 shadow-xl space-y-4">
            <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-[#f27d26] border-b border-white/5 pb-3 flex items-center gap-2">
              <Sliders className="text-[#f27d26] h-4 w-4" />
              Subscription Plan Architect
            </h3>

            {/* App Store Surcharge Fee & PAYG Fee Sliders */}
            <div className="grid grid-cols-2 gap-3 pb-1 border-b border-white/5">
              <div className="space-y-1">
                <label className="text-[10px] text-white/40 block uppercase tracking-wider">Store Take-Cut</label>
                <div className="flex justify-between items-center bg-black/40 border border-white/5 p-1.5 rounded-lg h-8">
                  <input
                    type="range"
                    min="0"
                    max="45"
                    step="5"
                    value={appStoreFeePercent}
                    onChange={(e) => setAppStoreFeePercent(parseInt(e.target.value))}
                    className="w-12 accent-[#f27d26] h-1"
                    title="Store platform cut"
                  />
                  <span className="font-mono text-xs text-white/90 font-bold shrink-0">{appStoreFeePercent}%</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] text-white/40 block uppercase tracking-wider">PAYG Price / Pg</label>
                <div className="flex justify-between items-center bg-black/40 border border-white/5 p-1.5 rounded-lg h-8">
                  <input
                    type="range"
                    min="0.05"
                    max="0.50"
                    step="0.05"
                    value={paygRate}
                    onChange={(e) => setPaygRate(parseFloat(e.target.value))}
                    className="w-12 accent-[#f27d26] h-1"
                    title="Price per page"
                  />
                  <span className="font-mono text-[11px] text-white/90 font-bold shrink-0">${paygRate.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Standard Tier Configurator Sliders */}
            <div className="space-y-2 border-b border-white/5 pb-3">
              <span className="font-mono text-[9px] tracking-widest text-[#f27d26]/80 block uppercase font-bold">Standard Tier Config</span>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between items-center text-[10px] text-white/60 mb-1">
                    <span>Monthly Fee</span>
                    <span className="font-mono text-white font-semibold">${standardPrice.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="4.99"
                    max="39.99"
                    step="1"
                    value={standardPrice}
                    onChange={(e) => setStandardPrice(parseFloat(e.target.value))}
                    className="w-full accent-[#f27d26] h-1 bg-black rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-[10px] text-white/60 mb-1">
                    <span>Page Allowance</span>
                    <span className="font-mono text-white font-semibold">{standardLimit} p.</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="355"
                    step="15"
                    value={standardLimit}
                    onChange={(e) => setStandardLimit(parseInt(e.target.value))}
                    className="w-full accent-[#f27d26] h-1 bg-black rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Premium Tier Configurator Sliders */}
            <div className="space-y-2 pb-1">
              <span className="font-mono text-[9px] tracking-widest text-[#f27d26]/80 block uppercase font-bold">Premium Tier Config</span>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between items-center text-[10px] text-white/60 mb-1">
                    <span>Monthly Fee</span>
                    <span className="font-mono text-white font-semibold">${premiumPrice.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="14.99"
                    max="99.99"
                    step="1"
                    value={premiumPrice}
                    onChange={(e) => setPremiumPrice(parseFloat(e.target.value))}
                    className="w-full accent-[#f27d26] h-1 bg-black rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-[10px] text-white/60 mb-1">
                    <span>Page Allowance</span>
                    <span className="font-mono text-white font-semibold">{premiumLimit} p.</span>
                  </div>
                  <input
                    type="range"
                    min="150"
                    max="1000"
                    step="50"
                    value={premiumLimit}
                    onChange={(e) => setPremiumLimit(parseInt(e.target.value))}
                    className="w-full accent-[#f27d26] h-1 bg-black rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Subscription & User Parameters */}
          <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-5 shadow-xl space-y-5">
            <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-[#f27d26] border-b border-white/5 pb-3 flex items-center gap-2">
              <Layers className="text-[#f27d26] h-4 w-4" />
              Customer Demographics
            </h3>

            {/* Slider: PAYG Users */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/60">Pay-As-You-Go Accounts</span>
                <span className="font-mono text-[#f27d26] font-semibold">{paygUsersCount} users</span>
              </div>
              <input
                type="range"
                min="50"
                max="1000"
                step="50"
                value={paygUsersCount}
                onChange={(e) => setPaygUsersCount(parseInt(e.target.value))}
                className="w-full accent-[#f27d26] h-1 bg-black rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Slider: Standard Subscriptions */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/60">Standard Subscribers ($14.99)</span>
                <span className="font-mono text-[#f27d26] font-semibold">{standardSubscribers} users</span>
              </div>
              <input
                type="range"
                min="0"
                max="500"
                step="20"
                value={standardSubscribers}
                onChange={(e) => setStandardSubscribers(parseInt(e.target.value))}
                className="w-full accent-[#f27d26] h-1 bg-black rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Slider: Premium Subscriptions */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/60">Premium Subscribers ($29.99)</span>
                <span className="font-mono text-[#f27d26] font-semibold">{premiumSubscribers} users</span>
              </div>
              <input
                type="range"
                min="0"
                max="300"
                step="10"
                value={premiumSubscribers}
                onChange={(e) => setPremiumSubscribers(parseInt(e.target.value))}
                className="w-full accent-[#f27d26] h-1 bg-black rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Sliders: Usage limits per user standard/premium */}
            <div className="pt-2 border-t border-white/5 space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/40 font-normal">Standard Volume ({economics.standardInfo.avg} pages / mo)</span>
                  <span className="text-white font-bold">{standardPagesPercent}% Cap</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={standardPagesPercent}
                  onChange={(e) => setStandardPagesPercent(parseInt(e.target.value))}
                  className="w-full accent-[#f27d26] h-1 bg-black rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/40 font-normal">Premium Volume ({economics.premiumInfo.avg} pages / mo)</span>
                  <span className="text-white font-bold">{premiumPagesPercent}% Cap</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={premiumPagesPercent}
                  onChange={(e) => setPremiumPagesPercent(parseInt(e.target.value))}
                  className="w-full accent-[#f27d26] h-1 bg-black rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Slider: Cache Hit Ratio (Visualizing 100% Core Margin Caching Loop) */}
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-5 shadow-xl space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-sans font-bold text-white flex items-center gap-1.5">
                <Archive className="text-emerald-400 h-4 w-4" /> Shared Syllabus Cache Rate
              </span>
              <span className="font-mono text-emerald-400 font-extrabold text-xs bg-emerald-950 border border-emerald-500/35 px-2.5 py-0.5 rounded-full">{globalCacheHitRate}%</span>
            </div>
            
            <p className="text-[10px] text-white/50 leading-normal font-medium">
              Represents curriculum repetition inside the academic group. Lookups completely bypass LLM translation fees to pull static cache blocks ($0.00005 lookup fees), driving infinite profit scale.
            </p>
            
            <input
              type="range"
              min="0"
              max="95"
              step="5"
              value={globalCacheHitRate}
              onChange={(e) => setGlobalCacheHitRate(parseInt(e.target.value))}
              className="w-full accent-emerald-400 h-1.5 bg-black rounded-lg cursor-pointer"
            />
          </div>

        </div>

        {/* RIGHT COLUMN: Ledger Calculations & Custom SVG Charts (Grid Span 8) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Segment: Interactive Financial Highlights Card matrix */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Total Monthly Request Volume */}
            <div className="bg-[#0a0a0a] border border-white/10 p-4 rounded-xl shadow-md">
              <span className="font-mono text-[9px] text-white/40 block uppercase tracking-wider">Monthly Request Volume</span>
              <span className="font-sans font-bold text-lg text-white block mt-1">{economics.totalPagesRequested.toLocaleString()} Pages</span>
              <span className="text-[10px] text-white/50 block leading-tight mt-1 font-mono">
                {economics.cacheHitsCount.toLocaleString()} cache hits
              </span>
            </div>

            {/* Total Operational Cost (COGS) */}
            <div className="bg-[#0a0a0a] border border-white/10 p-4 rounded-xl shadow-md">
              <span className="font-mono text-[9px] text-white/40 block uppercase tracking-wider">API Delivery Costs (COGS)</span>
              <span className="font-sans font-bold text-lg text-rose-450 block mt-1">${economics.totalOperationalCost.toFixed(2)}</span>
              <span className="text-[10px] text-white/40 block leading-tight mt-1 font-mono">
                No-cache cost: ${economics.costWithoutCache.toFixed(0)}
              </span>
            </div>

            {/* Corporate Net Revenue (Post 30% App Fee) */}
            <div className="bg-[#0a0a0a] border border-white/10 p-4 rounded-xl shadow-md">
              <span className="font-mono text-[9px] text-white/40 block uppercase tracking-wider">Net Corp Revenue (-30%)</span>
              <span className="font-sans font-bold text-lg text-white block mt-1">${economics.totalNetCorpRevenue.toFixed(2)}</span>
              <span className="text-[10px] text-white/50 block leading-tight mt-1 font-mono">
                Gross: ${economics.totalGrossRevenue.toFixed(0)}
              </span>
            </div>

            {/* Calculated Monthly Net profit */}
            <div className={`p-4 rounded-xl border shadow-lg ${economics.netProfit >= 0 ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-rose-950/20 border-rose-500/20'}`}>
              <span className="font-mono text-[9px] text-white/40 block uppercase tracking-wider">Net Monthly Profit</span>
              <span className={`font-sans font-extrabold text-lg block mt-1 ${economics.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ${economics.netProfit.toFixed(2)}
              </span>
              <span className={`text-[10px] block leading-tight mt-1 font-bold ${economics.netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                Operating Margin: {economics.profitMargin.toFixed(1)}%
              </span>
            </div>

          </div>

          {/* Segment: The Subscription Ledger Analysis Sheet */}
          <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] overflow-hidden shadow-xl">
            <div className="bg-black px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-sans font-black text-xs uppercase tracking-wider text-[#f27d26] flex items-center gap-1.5">
                <BarChart2 className="text-[#f27d26] h-4 w-4" /> Subscription Matrix Profit Performance
              </h3>
              <span className="font-mono text-[9px] text-white/45 uppercase tracking-wide">Standard Monthly Analysis</span>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-black/60 border-b border-white/5 text-white/40 font-mono text-[9px] uppercase tracking-wider">
                  <th className="py-3 px-4">Subscription Tier</th>
                  <th className="py-3 px-4 text-center">Unit Count</th>
                  <th className="py-3 px-4 text-center">Simulated Vol</th>
                  <th className="py-3 px-4 text-right">App Store Surcharge</th>
                  <th className="py-3 px-4 text-right">Corporate Net</th>
                  <th className="py-3 px-4 text-right">LLM Cost Burden</th>
                  <th className="py-3 px-4 text-right text-[#f27d26] font-bold">Gross Tier Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80 font-sans">
                
                {/* Tier PAYG */}
                <tr className="hover:bg-white/5 transition-all">
                  <td className="py-3.5 px-4 font-medium">
                    <span className="text-white block font-bold">Pay-As-You-Go</span>
                    <span className="text-[10px] text-white/40 font-mono">${paygRate.toFixed(2)} / target page</span>
                  </td>
                  <td className="py-3.5 px-4 text-center text-white/60 font-mono">{paygUsersCount}</td>
                  <td className="py-3.5 px-4 text-center text-white/60 font-mono">{economics.paygInfo.pages.toLocaleString()} pages</td>
                  <td className="py-3.5 px-4 text-right text-white/40 font-mono">-${(economics.paygInfo.rev * APP_STORE_FEE).toFixed(1)}</td>
                  <td className="py-3.5 px-4 text-right text-white font-medium font-mono">${economics.paygInfo.netRev.toFixed(1)}</td>
                  <td className="py-3.5 px-4 text-right text-rose-400 font-mono">
                    -${(economics.paygInfo.pages * (1 - economics.calculatedCacheHitRateFraction) * economics.fullProcessingCost).toFixed(1)}
                  </td>
                  <td className="py-3.5 px-4 text-right text-white font-bold font-mono">
                    {calculateTierMargin(economics.paygInfo.netRev, economics.paygInfo.pages * (1 - economics.calculatedCacheHitRateFraction) * economics.fullProcessingCost)}%
                  </td>
                </tr>

                {/* Tier Standard */}
                <tr className="hover:bg-white/5 transition-all">
                  <td className="py-3.5 px-4 font-medium">
                    <span className="text-white block font-bold">Standard Subscriber</span>
                    <span className="text-[10px] text-white/40 font-mono">${standardPrice.toFixed(2)} / subscription</span>
                  </td>
                  <td className="py-3.5 px-4 text-center text-white/60 font-mono">{standardSubscribers}</td>
                  <td className="py-3.5 px-4 text-center text-white/60 font-mono">{economics.standardInfo.avg} pages avg</td>
                  <td className="py-3.5 px-4 text-right text-white/40 font-mono">-${(economics.standardInfo.rev * APP_STORE_FEE).toFixed(1)}</td>
                  <td className="py-3.5 px-4 text-right text-white font-medium font-mono">${economics.standardInfo.netRev.toFixed(1)}</td>
                  <td className="py-3.5 px-4 text-right text-rose-400 font-mono">
                    -${(economics.standardInfo.pages * (1 - economics.calculatedCacheHitRateFraction) * economics.fullProcessingCost).toFixed(1)}
                  </td>
                  <td className="py-3.5 px-4 text-right text-white font-bold font-mono">
                    {calculateTierMargin(economics.standardInfo.netRev, economics.standardInfo.pages * (1 - economics.calculatedCacheHitRateFraction) * economics.fullProcessingCost)}%
                  </td>
                </tr>

                {/* Tier Premium */}
                <tr className="hover:bg-white/5 transition-all">
                  <td className="py-3.5 px-4 font-medium">
                    <span className="text-white block font-bold">Premium Subscriber</span>
                    <span className="text-[10px] text-white/40 font-mono">${premiumPrice.toFixed(2)} / subscription</span>
                  </td>
                  <td className="py-3.5 px-4 text-center text-white/60 font-mono">{premiumSubscribers}</td>
                  <td className="py-3.5 px-4 text-center text-white/60 font-mono">{economics.premiumInfo.avg} pages avg</td>
                  <td className="py-3.5 px-4 text-right text-white/40 font-mono">-${(economics.premiumInfo.rev * APP_STORE_FEE).toFixed(1)}</td>
                  <td className="py-3.5 px-4 text-right text-white font-medium font-mono">${economics.premiumInfo.netRev.toFixed(1)}</td>
                  <td className="py-3.5 px-4 text-right text-rose-400 font-mono">
                    -${(economics.premiumInfo.pages * (1 - economics.calculatedCacheHitRateFraction) * economics.fullProcessingCost).toFixed(1)}
                  </td>
                  <td className="py-3.5 px-4 text-right text-white font-bold font-mono">
                    {calculateTierMargin(economics.premiumInfo.netRev, economics.premiumInfo.pages * (1 - economics.calculatedCacheHitRateFraction) * economics.fullProcessingCost)}%
                  </td>
                </tr>

              </tbody>
            </table>
          </div>

          {/* Segment: The 100% Margin Loop Graphic & SVG Chart */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 100% Caching graphic explain */}
            <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-5 shadow-xl flex flex-col justify-between">
              <div>
                <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-[#f27d26] mb-3 flex items-center gap-1.5">
                  <Archive className="text-[#f27d26] h-4 w-4" />
                  Caching Loop Margin Multiplier
                </h4>
                <p className="text-xs text-white/60 leading-relaxed font-normal">
                  When syllabus textbook material is processed, lookups of equivalent content pull the pre-computed assets directly from the distributed local CDN:
                </p>

                {/* Vertical process blocks */}
                <div className="space-y-3 mt-4 text-[11px] relative">
                  <div className="absolute left-3 top-3 bottom-3 w-[1px] bg-white/10 border-dashed border-l"></div>
                  
                  {/* Step 1 */}
                  <div className="flex gap-3 items-start relative">
                    <div className="h-6 w-6 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-300 font-bold font-mono text-[10px] relative z-10 shadow-md shrink-0">
                      1
                    </div>
                    <div className="flex-1">
                      <span className="font-bold text-white block leading-tight">Direct API Request (Miss)</span>
                      <span className="text-white/50 block mt-0.5">Material is analyzed. Heavy LLM and TTS character rates apply: <span className="text-rose-400 font-mono font-bold">${economics.fullProcessingCost.toFixed(4)} (COGS)</span></span>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex gap-3 items-start relative">
                    <div className="h-6 w-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-bold font-mono text-[10px] relative z-10 shadow-md shrink-0">
                      2
                    </div>
                    <div className="flex-1">
                      <span className="font-bold text-white block leading-tight">Distributed Syllabus Retrieval (Hit)</span>
                      <span className="text-white/50 block mt-0.5">Subsequent loads pull pre-composed assets directly. COGS scales immediately to <span className="text-emerald-400 font-mono font-bold">$0.00005 / lookup</span></span>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex gap-3 items-start relative">
                    <div className="h-6 w-6 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-300 font-bold font-mono text-[10px] relative z-10 shadow-md shrink-0">
                      3
                    </div>
                    <div className="flex-1">
                      <span className="font-bold text-white block leading-tight">The 100% Core Margin Scale-Out</span>
                      <span className="text-white/50 block mt-0.5">As the system covers the curriculum, delivery overhead drops near zero, creating massive recurring profits.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic cache stats read */}
              <div className="bg-emerald-950/20 text-emerald-400 text-xs py-2 px-3 border border-emerald-500/20 rounded-lg mt-4 font-mono font-bold flex items-center justify-between">
                <span>Monthly Caching Cost Avoidance:</span>
                <span>${economics.totalSavingsVianCache.toFixed(2)} USD</span>
              </div>
            </div>

            {/* SVG Margin Impact Graph (Cache hit rate vs Margin and Cumulative expense savings) */}
            <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-5 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-[#f27d26] flex items-center gap-1.5">
                  <TrendingUp className="text-[#f27d26] h-4 w-4" /> Margin Delta Projection
                </h4>
                <span className="font-mono text-[8px] text-white/40 tracking-wider">SAVINGS VS CACHE %</span>
              </div>
              <p className="text-[10px] text-white/50 mb-4 font-sans leading-relaxed">
                Profit margin percentages (orange bars) and monthly expense savings (emerald line) scaling relative to the syllabus cache rate.
              </p>

              {/* Sophisticated SVG charting engine */}
              <div className="h-52 w-full mt-2 relative">
                
                {/* SVG Drawing layout */}
                <svg viewBox="0 0 320 200" className="w-full h-full">
                  {/* Grid Lines */}
                  <line x1="30" y1="20" x2="310" y2="20" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                  <line x1="30" y1="60" x2="310" y2="60" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                  <line x1="30" y1="100" x2="310" y2="100" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                  <line x1="30" y1="140" x2="310" y2="140" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                  <line x1="30" y1="170" x2="310" y2="170" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />

                  {/* Compute coordinate path for Savings Area Chart */}
                  {(() => {
                    const maxSavings = Math.max(...cacheHitSavingsTrend.map(d => d.savings)) || 1000;
                    const getY = (val: number) => 170 - (val / Math.max(1, maxSavings)) * 140;
                    const pointsStr = cacheHitSavingsTrend.map((d, index) => {
                      const x = 30 + (index * 56);
                      const y = getY(d.savings);
                      return `${x},${y}`;
                    }).join(' ');

                    const fullAreaStr = `30,170 ${pointsStr} 310,170`;

                    return (
                      <>
                        {/* Shaded Area */}
                        <polygon points={fullAreaStr} fill="url(#savingsGrad)" className="opacity-40" />
                        {/* Connecting Line */}
                        <polyline points={pointsStr} fill="none" stroke="#10b981" strokeWidth="2" />
                        
                        {/* Margin Bars Layer */}
                        {cacheHitSavingsTrend.map((d, index) => {
                          const x = 30 + (index * 56);
                          const marginPercent = Math.max(-50, d.margin);
                          const marginNormalized = (marginPercent + 50) / 150; // fraction of height
                          const barHeight = marginNormalized * 110;
                          const barY = 170 - barHeight;

                          // Hover active cursor
                          const isCurrent = Math.abs((globalCacheHitRate) - d.pct) < 15;

                          return (
                            <g key={d.pct} className="cursor-pointer transition-all duration-300">
                              {/* Glowing background bar */}
                              <rect
                                x={x - 6}
                                y={barY}
                                width="12"
                                height={barHeight}
                                fill={isCurrent ? '#f27d26' : 'rgba(242,125,38,0.2)'}
                                rx="2"
                                className="transition-all duration-300"
                              />
                              {/* Draw tiny indicator dot on line */}
                              <circle
                                cx={x}
                                cy={getY(d.savings)}
                                r={isCurrent ? '3.5' : '2'}
                                fill="#10b981"
                                stroke="#ffffff"
                                strokeWidth="0.5"
                              />
                            </g>
                          );
                        })}
                      </>
                    );
                  })()}

                  {/* Definitions of Gradients */}
                  <defs>
                    <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* X Axis Labels */}
                  {cacheHitSavingsTrend.map((d, index) => (
                    <text
                      key={d.pct}
                      x={30 + (index * 56)}
                      y="185"
                      fontFamily="monospace"
                      fontSize="8"
                      fill="rgba(255,255,255,0.4)"
                      textAnchor="middle"
                    >
                      {d.pct}%
                    </text>
                  ))}
                </svg>

                {/* Graph overlay dynamic pointer */}
                <div className="absolute top-2 right-2 bg-black/90 text-white p-2 rounded-lg text-[9px] font-mono leading-tight shadow-md border border-white/10">
                  <div className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span> Savings: <span className="font-bold">${economics.totalSavingsVianCache.toFixed(0)}</span></div>
                  <div className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#f27d26]"></span> Target Margin: <span className="font-bold">{economics.profitMargin.toFixed(0)}%</span></div>
                </div>

                <div className="absolute bottom-6 left-1 text-[8px] font-mono uppercase text-white/30 tracking-widest rotate-270 origin-left">
                  CACHE CORRELATION
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

// Math helpers
function calculateTierMargin(netRevenue: number, opCost: number): string {
  if (netRevenue <= 0) return "0";
  const profit = netRevenue - opCost;
  const margin = (profit / netRevenue) * 100;
  return margin.toFixed(0);
}
